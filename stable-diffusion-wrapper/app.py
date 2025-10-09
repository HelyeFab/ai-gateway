#!/usr/bin/env python3
"""Minimal Stable Diffusion API wrapper"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import os
import torch
from PIL import Image
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global pipeline
pipe = None

def load_pipeline():
    global pipe
    if pipe is None:
        logger.info("Loading Stable Diffusion pipeline...")
        
        model_id = os.environ.get("MODEL_ID", "CompVis/stable-diffusion-v1-4")
        device = "cpu"
        
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
            safety_checker=None,
            requires_safety_checker=False
        )
        pipe = pipe.to(device)
        
        # Use faster scheduler
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        
        # Enable memory optimizations
        pipe.enable_attention_slicing()
        pipe.enable_sequential_cpu_offload()
        
        logger.info("Pipeline loaded!")
    return pipe

@app.route('/sdapi/v1/txt2img', methods=['POST'])
def txt2img():
    try:
        data = request.get_json()
        prompt = data.get('prompt', 'a beautiful landscape')
        steps = min(data.get('steps', 20), 30)  # Limit for CPU
        width = min(data.get('width', 512), 512)
        height = min(data.get('height', 512), 512)
        
        pipeline = load_pipeline()
        
        # Generate
        with torch.no_grad():
            image = pipeline(
                prompt,
                num_inference_steps=steps,
                width=width,
                height=height
            ).images[0]
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            "images": [img_str],
            "info": "Generated successfully"
        })
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": pipe is not None})

if __name__ == '__main__':
    load_pipeline()  # Preload
    app.run(host='0.0.0.0', port=7860)