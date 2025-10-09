FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    pillow==10.0.0 \
    diffusers==0.21.0 \
    transformers==4.30.0 \
    accelerate==0.20.0 \
    safetensors==0.3.1 \
    omegaconf==2.3.0

COPY server.py .

EXPOSE 7860

CMD ["python", "server.py"]