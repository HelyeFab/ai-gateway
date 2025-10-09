#!/bin/bash

echo "Setting up Ollama to accept CORS requests..."

# Create systemd override directory
sudo mkdir -p /etc/systemd/system/ollama.service.d/

# Copy the CORS configuration
sudo cp /home/sheldon/ai-gateway/ollama-cors.conf /etc/systemd/system/ollama.service.d/override.conf

# Reload systemd and restart Ollama
sudo systemctl daemon-reload
sudo systemctl restart ollama

echo "Ollama has been configured to accept CORS requests."
echo "Please wait a few seconds for Ollama to restart..."
sleep 5

# Test if Ollama is running
curl -s http://localhost:11434/api/tags > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Ollama is running and accepting requests"
else
    echo "✗ Ollama may still be starting up"
fi