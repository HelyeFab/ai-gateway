FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python packages
RUN pip install --no-cache-dir \
    diffusers \
    transformers \
    accelerate \
    safetensors \
    flask \
    flask-cors \
    pillow \
    xformers

# Copy the API server
COPY server.py .

# Expose port
EXPOSE 7860

# Run the server
CMD ["python", "server.py"]