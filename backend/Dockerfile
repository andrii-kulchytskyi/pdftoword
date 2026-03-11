FROM python:3.12-slim

# Install LibreOffice and dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY server.py .

# Create temp dir with correct permissions
RUN mkdir -p /tmp/pdftoword && chmod 777 /tmp/pdftoword

# Create a non-root user for security
RUN useradd -m -u 1001 converter
USER converter

# LibreOffice needs a home directory for user profile
ENV HOME=/tmp/lo_home
RUN mkdir -p /tmp/lo_home

EXPOSE 8000

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
