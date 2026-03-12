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

# LibreOffice needs a writable home directory
ENV HOME=/tmp/lo_home

CMD ["sh", "-c", "echo \"Starting uvicorn on port ${PORT:-8000}\" && exec uvicorn server:app --host :: --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
