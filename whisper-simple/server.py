#!/usr/bin/env python3
"""Simple Whisper API placeholder"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio - placeholder version"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        filename = audio_file.filename or 'audio'
        
        logger.info(f"Received audio file: {filename}")
        
        # Simulate processing time
        time.sleep(1)
        
        # Return placeholder transcription
        return jsonify({
            "text": f"This is a placeholder transcription for the audio file '{filename}'. To enable real transcription, install Whisper models.",
            "language": "en",
            "duration": 5.0,
            "info": "Placeholder service - Real Whisper model not loaded"
        })
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "running",
        "type": "placeholder",
        "info": "This is a placeholder service. For real transcription, install Whisper models."
    })

if __name__ == '__main__':
    logger.info("Starting Whisper placeholder API server...")
    app.run(host='0.0.0.0', port=8092)