#!/usr/bin/env python3
"""
Simple Stable Diffusion API compatible with AUTOMATIC1111 WebUI API
Designed to run on CPU with reasonable performance
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import os
import time
from PIL import Image
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global pipeline variable
pipe = None

def load_model():
    """Load the Stable Diffusion model"""
    global pipe
    if pipe is None:
        logger.info("Loading Stable Diffusion model...")
        model_id = os.environ.get("MODEL_ID", "stabilityai/stable-diffusion-2-1-base")
        
        # Use CPU and optimize for memory
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
            use_safetensors=True,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        # Move to CPU
        pipe = pipe.to("cpu")
        
        # Use faster scheduler
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        
        # Enable memory efficient attention
        pipe.enable_attention_slicing()
        
        logger.info("Model loaded successfully!")
    return pipe

@app.route('/sdapi/v1/txt2img', methods=['POST'])
def txt2img():
    """
    Text to image endpoint compatible with AUTOMATIC1111 API
    """
    try:
        data = request.get_json()
        
        # Extract parameters
        prompt = data.get('prompt', '')
        negative_prompt = data.get('negative_prompt', '')
        steps = min(data.get('steps', 20), 30)  # Limit steps for CPU
        width = min(data.get('width', 512), 512)  # Limit size for CPU
        height = min(data.get('height', 512), 512)
        cfg_scale = data.get('cfg_scale', 7.5)
        seed = data.get('seed', -1)
        
        if seed == -1:
            seed = int(time.time())
        
        # Load model if not already loaded
        pipeline = load_model()
        
        # Set seed for reproducibility
        generator = torch.manual_seed(seed)
        
        logger.info(f"Generating image: {prompt[:50]}...")
        
        # Generate image
        with torch.no_grad():
            image = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                width=width,
                height=height,
                generator=generator
            ).images[0]
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Return in AUTOMATIC1111 format
        return jsonify({
            "images": [img_base64],
            "parameters": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": steps,
                "width": width,
                "height": height,
                "cfg_scale": cfg_scale,
                "seed": seed
            },
            "info": f"Generated with Stable Diffusion on CPU"
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/progress', methods=['GET'])
def progress():
    """Progress endpoint (stub for compatibility)"""
    return jsonify({
        "progress": 0,
        "eta_relative": 0,
        "state": {
            "skipped": False,
            "interrupted": False,
            "job": "",
            "job_count": 0
        }
    })

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "model_loaded": pipe is not None
    })

if __name__ == '__main__':
    # Pre-load model
    load_model()
    
    # Run server
    app.run(host='0.0.0.0', port=7860, debug=False)