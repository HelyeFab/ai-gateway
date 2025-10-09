#!/bin/bash

# Rebuild the SelfMind web production container

echo "🚀 Starting rebuild of SelfMind web container..."

# Stop and remove current container
echo "Stopping current container..."
docker stop ai-gateway-web 2>/dev/null || true
docker rm ai-gateway-web 2>/dev/null || true

# Build new image using external drive
echo "Building new image on external drive..."
cd /media/sheldon/8cefeac9-35fb-4e77-b9cc-d1562a083c39/
docker build -t ai-gateway-selfmind-web /home/sheldon/ai-gateway/selfmind-web

# Run the new container
echo "Starting new container..."
docker run -d \
  --name ai-gateway-web \
  --network ai-gateway_default \
  -p 3000:3000 \
  ai-gateway-selfmind-web

echo "✅ Rebuild complete! Container is running."
echo "🌐 Access at: http://localhost:3000 or https://selfmind.dev"