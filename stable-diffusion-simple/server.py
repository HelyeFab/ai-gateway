#!/usr/bin/env python3
"""Ultra-simple Stable Diffusion API server that actually works"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image, ImageDraw, ImageFont
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def generate_placeholder_image(prompt, width=512, height=512):
    """Generate a placeholder image with the prompt text"""
    # Create a gradient background
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Random gradient colors based on prompt hash
    seed = hash(prompt) % 1000
    random.seed(seed)
    color1 = (random.randint(50, 200), random.randint(50, 200), random.randint(50, 200))
    color2 = (random.randint(100, 255), random.randint(100, 255), random.randint(100, 255))
    
    # Draw gradient
    for i in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * i / height)
        g = int(color1[1] + (color2[1] - color1[1]) * i / height)
        b = int(color1[2] + (color2[2] - color1[2]) * i / height)
        draw.rectangle([(0, i), (width, i + 1)], fill=(r, g, b))
    
    # Add text
    try:
        font = ImageFont.load_default()
    except:
        font = None
    
    # Wrap text
    words = prompt.split()
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        if len(' '.join(current_line)) > 30:
            lines.append(' '.join(current_line[:-1]))
            current_line = [word]
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw text
    y_offset = height // 2 - (len(lines) * 20) // 2
    for line in lines[:5]:  # Max 5 lines
        text_bbox = draw.textbbox((0, 0), line, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        x = (width - text_width) // 2
        draw.text((x, y_offset), line, fill=(255, 255, 255), font=font)
        y_offset += 25
    
    # Add watermark
    draw.text((10, height - 30), "AI Generated (Demo)", fill=(255, 255, 255, 128), font=font)
    
    return img

@app.route('/sdapi/v1/txt2img', methods=['POST'])
def txt2img():
    """Generate image from text - placeholder version"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', 'A beautiful landscape')
        width = min(data.get('width', 512), 1024)
        height = min(data.get('height', 512), 1024)
        steps = data.get('steps', 20)
        
        logger.info(f"Generating placeholder for: {prompt}")
        
        # Generate placeholder image
        image = generate_placeholder_image(prompt, width, height)
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            "images": [img_base64],
            "parameters": {
                "prompt": prompt,
                "steps": steps,
                "width": width,
                "height": height
            },
            "info": "Placeholder image - Real SD model not loaded"
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
        "info": "This is a placeholder service. For real image generation, install Stable Diffusion models."
    })

if __name__ == '__main__':
    logger.info("Starting Stable Diffusion placeholder API server...")
    app.run(host='0.0.0.0', port=7860)