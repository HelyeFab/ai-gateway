FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
    flask \
    flask-cors \
    pillow \
    numpy

# Install PyTorch CPU version
RUN pip install --no-cache-dir torch==2.0.1 -f https://download.pytorch.org/whl/torch_stable.html

# Install other ML dependencies
RUN pip install --no-cache-dir \
    transformers \
    diffusers \
    accelerate \
    safetensors

# Copy application
COPY app.py .

# Expose port
EXPOSE 7860

# Run the application
CMD ["python", "app.py"]