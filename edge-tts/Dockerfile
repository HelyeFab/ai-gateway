FROM python:3.11-slim

WORKDIR /app

# Install ffmpeg and curl (curl needed for healthcheck)
RUN apt-get update && apt-get install -y ffmpeg curl && \
    pip install --no-cache-dir edge-tts fastapi uvicorn && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY speak_server.py .

CMD ["uvicorn", "speak_server:app", "--host", "0.0.0.0", "--port", "8090"]
