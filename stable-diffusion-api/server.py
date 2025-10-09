#!/usr/bin/env python3
"""
Lightweight Stable Diffusion API server compatible with AUTOMATIC1111 API
"""

import os
import io
import base64
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model
pipeline = None

def get_pipeline():
    global pipeline
    if pipeline is None:
        logger.info("Loading Stable Diffusion model...")
        
        # Use a smaller model for faster loading
        model_id = "runwayml/stable-diffusion-v1-5"
        
        # Detect if CUDA is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        
        logger.info(f"Using device: {device}")
        
        pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            safety_checker=None,
            requires_safety_checker=False,
            use_safetensors=True
        )
        
        pipeline = pipeline.to(device)
        
        # Optimize for speed
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
            pipeline.scheduler.config
        )
        
        # Enable optimizations
        if device == "cpu":
            pipeline.enable_attention_slicing()
        else:
            # Enable xformers if available for GPU
            try:
                pipeline.enable_xformers_memory_efficient_attention()
                logger.info("Enabled xformers memory efficient attention")
            except:
                logger.info("xformers not available, using default attention")
        
        logger.info("Model loaded successfully!")
    
    return pipeline

@app.route('/sdapi/v1/txt2img', methods=['POST'])
def txt2img():
    """AUTOMATIC1111 compatible text-to-image endpoint"""
    try:
        data = request.get_json()
        
        # Extract parameters with defaults
        prompt = data.get('prompt', '')
        negative_prompt = data.get('negative_prompt', '')
        steps = data.get('steps', 20)
        width = data.get('width', 512)
        height = data.get('height', 512)
        cfg_scale = data.get('cfg_scale', 7.5)
        seed = data.get('seed', -1)
        
        # Limit parameters for performance
        steps = min(steps, 50)
        width = min(width, 768)
        height = min(height, 768)
        
        if seed == -1:
            seed = torch.randint(0, 2**32, (1,)).item()
        
        generator = torch.Generator(device="cuda" if torch.cuda.is_available() else "cpu")
        generator.manual_seed(seed)
        
        # Get pipeline
        pipe = get_pipeline()
        
        logger.info(f"Generating image: {prompt[:50]}...")
        
        # Generate image
        with torch.no_grad():
            image = pipe(
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
        
        logger.info("Image generated successfully")
        
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
            }
        })
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/sdapi/v1/options', methods=['GET'])
def get_options():
    """Get current options"""
    return jsonify({
        "sd_model_checkpoint": "stable-diffusion-v1-5",
        "sd_vae": "auto"
    })

@app.route('/api/v1/progress', methods=['GET'])
def progress():
    """Progress endpoint"""
    return jsonify({
        "progress": 0.0,
        "eta_relative": 0.0,
        "state": {
            "skipped": False,
            "interrupted": False,
            "job": "",
            "job_count": 0,
            "sampling_step": 0,
            "sampling_steps": 0
        }
    })

@app.route('/', methods=['GET'])
def index():
    """Health check"""
    return jsonify({
        "status": "running",
        "model_loaded": pipeline is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    })

if __name__ == '__main__':
    # Preload model
    get_pipeline()
    
    # Run server
    app.run(host='0.0.0.0', port=7860, debug=False)