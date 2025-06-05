#!/bin/sh

echo "🔁 Warming up model..."
curl -s http://host.docker.internal:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"devstral:24b","prompt":"Hello","stream":false}' > /dev/null

echo "🚀 Starting Flask app"
exec python app.py
