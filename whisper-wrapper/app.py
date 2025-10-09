#!/usr/bin/env python3
"""Minimal Whisper API wrapper"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model
model = None

def load_model():
    global model
    if model is None:
        model_name = os.environ.get("WHISPER_MODEL", "base")
        logger.info(f"Loading Whisper {model_name} model...")
        model = whisper.load_model(model_name)
        logger.info("Model loaded!")
    return model

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file"}), 400
        
        audio_file = request.files['audio']
        
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            # Transcribe
            whisper_model = load_model()
            result = whisper_model.transcribe(tmp_path)
            
            return jsonify({
                "text": result["text"],
                "language": result.get("language", "en")
            })
        finally:
            os.unlink(tmp_path)
            
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

if __name__ == '__main__':
    load_model()  # Preload
    app.run(host='0.0.0.0', port=8092)