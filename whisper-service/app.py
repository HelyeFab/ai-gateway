#!/usr/bin/env python3
"""
Simple Whisper ASR service for speech-to-text
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

def load_model():
    """Load the Whisper model"""
    global model
    if model is None:
        model_size = os.environ.get("WHISPER_MODEL", "tiny")
        logger.info(f"Loading Whisper {model_size} model...")
        model = whisper.load_model(model_size)
        logger.info("Model loaded successfully!")
    return model

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio to text
    """
    try:
        # Check if audio file is in request
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        
        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        try:
            # Load model if not already loaded
            whisper_model = load_model()
            
            # Transcribe
            logger.info("Transcribing audio...")
            result = whisper_model.transcribe(tmp_path)
            
            # Return results
            return jsonify({
                "text": result["text"],
                "segments": result.get("segments", []),
                "language": result.get("language", "unknown")
            })
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        "model_size": os.environ.get("WHISPER_MODEL", "tiny")
    })

if __name__ == '__main__':
    # Pre-load model
    load_model()
    
    # Run server
    app.run(host='0.0.0.0', port=8092, debug=False)