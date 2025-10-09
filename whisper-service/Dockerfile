FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    speechrecognition==3.10.0 \
    pydub==0.25.1 \
    numpy==1.24.3 \
    pocketsphinx==5.0.0

# Copy application
COPY server.py .

# Set environment variable
ENV WHISPER_MODEL=tiny

# Expose port
EXPOSE 8092

# Run the application
CMD ["python", "server.py"]