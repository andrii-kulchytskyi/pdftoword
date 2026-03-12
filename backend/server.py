import asyncio
import os
import shutil
import subprocess
import tempfile
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
CONVERSION_TIMEOUT_SECONDS = 120
LIBREOFFICE_CMD = os.environ.get("LIBREOFFICE_CMD", "soffice")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify LibreOffice is available on startup
    yield


app = FastAPI(
    title="PDF to Word Converter",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


def _cleanup(directory: str) -> None:
    shutil.rmtree(directory, ignore_errors=True)


@app.post("/convert")
async def convert_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Convert an uploaded PDF file to a DOCX file.
    Returns the DOCX file as a binary response.
    """
    # Validate content type
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are accepted.",
            )

    # Read file into memory to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Generate unique workspace to avoid collisions
    job_id = uuid.uuid4().hex
    work_dir = Path(tempfile.gettempdir()) / f"pdftoword_{job_id}"
    work_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename
    original_name = Path(file.filename or "document.pdf").name
    safe_name = "".join(
        c if c.isalnum() or c in (".", "-", "_") else "_" for c in original_name
    )
    if not safe_name.lower().endswith(".pdf"):
        safe_name += ".pdf"

    pdf_path = work_dir / safe_name
    docx_name = pdf_path.stem + ".docx"
    docx_path = work_dir / docx_name

    try:
        # Write PDF to disk
        pdf_path.write_bytes(content)

        # Run LibreOffice conversion
        # --infilter="writer_pdf_import" opens the PDF in Writer (not Draw),
        # which allows proper export to the MS Word 2007 XML (docx) format.
        cmd = [
            LIBREOFFICE_CMD,
            "--headless",
            "--norestore",
            "--nologo",
            "--nolockcheck",
            "--infilter=writer_pdf_import",
            "--convert-to",
            "docx:MS Word 2007 XML",
            "--outdir",
            str(work_dir),
            str(pdf_path),
        ]

        try:
            proc = await asyncio.wait_for(
                asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={**os.environ, "HOME": str(work_dir)},
                ),
                timeout=CONVERSION_TIMEOUT_SECONDS,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=CONVERSION_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Conversion timed out. Try with a smaller file.",
            )

        if proc.returncode != 0:
            error_output = stderr.decode(errors="replace").strip()
            print(f"LibreOffice error: {error_output}")
            raise HTTPException(
                status_code=500,
                detail="Conversion failed. The PDF may be corrupted or password-protected.",
            )

        if not docx_path.exists():
            # LibreOffice sometimes names the output differently
            docx_files = list(work_dir.glob("*.docx"))
            if docx_files:
                docx_path = docx_files[0]
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Conversion completed but output file was not found.",
                )

        background_tasks.add_task(_cleanup, str(work_dir))
        return FileResponse(
            path=str(docx_path),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=docx_path.name,
        )

    except HTTPException:
        _cleanup(str(work_dir))
        raise
    except Exception as e:
        _cleanup(str(work_dir))
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
