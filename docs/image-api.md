# 🎨 Image Generation API Documentation

## Prerequisites

Ensure AUTOMATIC1111 Stable Diffusion WebUI is running:
```bash
cd ../stable-diffusion-webui-docker
docker compose --profile auto-cpu up --build
```

The service should be accessible at `http://localhost:7860`

## 🛠️ Endpoints

### 🔹 Direct API Proxy
**POST** `/image/api/generate`

Directly proxies requests to AUTOMATIC1111's txt2img API with full control over parameters.

### 🔹 Simplified API
**POST** `/image/api/generate/simple`

Provides a simpler interface with sensible defaults.

## 🔐 Authentication
All endpoints require a valid API key:
```
X-API-Key: YOUR_VALID_KEY
```

## 📦 Request Formats

### Direct API (`/image/api/generate`)
Full AUTOMATIC1111 txt2img parameters:
```json
{
  "prompt": "a beautiful sunset over mountains, photorealistic",
  "negative_prompt": "ugly, blurry, low quality",
  "steps": 20,
  "width": 512,
  "height": 512,
  "cfg_scale": 7,
  "sampler_name": "Euler a",
  "seed": -1,
  "batch_size": 1,
  "n_iter": 1,
  "restore_faces": false,
  "enable_hr": false,
  "denoising_strength": 0,
  "save_images": false,
  "send_images": true,
  "alwayson_scripts": {}
}
```

### Simplified API (`/image/api/generate/simple`)
Minimal parameters with automatic defaults:
```json
{
  "prompt": "a cute cat wearing a hat",
  "negative_prompt": "blurry, distorted",  // optional
  "width": 512,                            // optional, default: 512
  "height": 512,                           // optional, default: 512
  "steps": 20,                             // optional, default: 20
  "seed": 12345                            // optional, default: -1 (random)
}
```

## 📥 Response Format

### Direct API Response
Returns the full AUTOMATIC1111 response with images array and detailed info.

### Simplified API Response
```json
{
  "image": "iVBORw0KGgoAAAANS...",  // base64 encoded PNG
  "parameters": {
    "prompt": "a cute cat wearing a hat",
    "steps": 20,
    "width": 512,
    "height": 512,
    // ... other parameters used
  },
  "info": {
    "seed": 1234567890,
    "all_prompts": ["a cute cat wearing a hat"],
    // ... additional generation info
  }
}
```

## 🧪 Sample Usage

### Using curl with Direct API:
```bash
curl -X POST http://localhost:8080/image/api/generate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fantasy landscape with castle",
    "steps": 30,
    "width": 768,
    "height": 512
  }'
```

### Using curl with Simplified API:
```bash
curl -X POST http://localhost:8080/image/api/generate/simple \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "cyberpunk city at night"}' \
  -o output.json
```

### Saving the generated image:
```bash
# Extract and decode the base64 image from response
curl -X POST http://localhost:8080/image/api/generate/simple \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "mountain landscape"}' \
  | jq -r '.image' | base64 -d > generated_image.png
```

## 🎨 Prompt Tips

### Positive Prompts
- Be specific and descriptive
- Include style keywords: "photorealistic", "digital art", "oil painting"
- Add quality modifiers: "highly detailed", "4k", "masterpiece"
- Specify lighting: "golden hour", "dramatic lighting", "soft light"

### Negative Prompts
Common negative prompts to improve quality:
- "blurry, low quality, distorted"
- "bad anatomy, wrong proportions"
- "watermark, signature, text"
- "oversaturated, underexposed"

## ⚙️ Parameters Guide

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of desired image |
| `negative_prompt` | string | "" | What to avoid in the image |
| `steps` | integer | 20 | Number of denoising steps (10-150) |
| `width` | integer | 512 | Image width in pixels |
| `height` | integer | 512 | Image height in pixels |
| `cfg_scale` | float | 7 | Classifier-free guidance scale (1-30) |
| `sampler_name` | string | "Euler a" | Sampling method |
| `seed` | integer | -1 | Seed for reproducibility (-1 for random) |

## 🚨 Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Image generated |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 504 | Timeout - Generation took too long |
| 503 | Service Unavailable - SD WebUI not running |

## 📝 Notes

- Image generation typically takes 10-60 seconds depending on parameters
- Higher steps and resolution increase generation time
- The service runs in CPU mode by default (slower but compatible)
- Generated images are returned as base64-encoded PNG data
- Maximum recommended resolution: 768x768 for CPU mode