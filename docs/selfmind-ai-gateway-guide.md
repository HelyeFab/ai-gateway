# 🧠 Selfmind AI Gateway - Developer Onboarding Guide

Welcome to the **Selfmind AI Gateway Project**, a self-hosted, API-driven infrastructure that enables local access to advanced AI capabilities, including LLMs, Text-to-Speech (TTS), and Image Generation.

---

## 🌐 Philosophy and Guiding Principles

This project is driven by these key values:

- 🛠️ **Self-Sufficiency**: Run powerful AI models locally without relying on cloud vendors.
- 🔐 **Security-First**: Use robust API key management and audit logging for access control.
- 🧩 **Modularity**: Each service (Chat, TTS, Image Generation) is containerized and isolated.
- 🚪 **Accessibility**: API endpoints are designed to be easily accessed by local apps or securely exposed via HTTPS.
- ⚡ **Performance**: Services use efficient models and caching mechanisms where possible.

---

## ✅ What We've Achieved

### 1. **AI Gateway Core**
- Built with Flask and Caddy reverse proxy
- Uses `api-gatekeeper` for API key validation and security auditing
- Fully dockerized with persistent logs
- Running on port `8080` (internal) and proxied to ports `80/443` via Caddy

### 2. **Chat (LLM) Integration**
- Integrated with **Ollama** models via `/chat/api/generate` and `/chat/api/chat`
- Secure access using API keys
- Confirmed working with `curl` and Postman

### 3. **Text-to-Speech (Edge TTS)**
- Fully operational `edge-tts` service on port `8090`
- Supports multiple voices and tweakable parameters like rate and pitch
- Proxied at `/tts/api/speak`
- Streams back MP3 audio via proxy layer

### 4. **Image Generation (Stable Diffusion)**
- Deployed locally using **AUTOMATIC1111** (CPU-only mode for AMD GPU support)
- Uses a custom Docker build to resolve compatibility issues
- Available at `localhost:7860`
- Not yet integrated into AI Gateway proxy (work in progress)

---

## 🧩 Current Stack

| Component      | Tech Used                        | Notes                                     |
|----------------|----------------------------------|-------------------------------------------|
| Gateway Proxy  | Caddy                            | Handles routing and SSL                   |
| API Core       | Flask                            | Validates API Keys, logs access           |
| TTS            | edge-tts                         | Microsoft Edge-based voice synthesis      |
| Chat           | Ollama (LLaMA3, etc.)            | Local inference via HTTP API              |
| Image Gen      | Automatic1111 + SD 1.5           | Manual boot via Docker Compose            |

---

## 🔧 What Still Needs to Be Done

### 1. 🔐 Install HTTPS with selfmind.dev
- Setup Caddy for automatic HTTPS
- Update DNS A record for `selfmind.dev` to point to static IP
- Allow external access to port `443` via router

### 2. 🌐 Port Forwarding on Home Router
- Expose ports `80` and `443` (and any custom API ports if needed)
- Restrict access using Caddy's IP filtering or client certs if desired

### 3. 🛜 Secure Remote Access (VCN)
- Recommend **Tailscale** or **ZeroTier** for secure VPN access
- This will allow safe management while away from home
- Setup remote SSH/VNC via this network

### 4. 🖼️ Finalize Image Gen API Integration
- Add `/image/api/generate` proxy endpoint to Flask app
- Apply API key protection and logging like other services

### 5. 📈 Monitoring and Logging
- Set up basic monitoring (e.g. Netdata or Prometheus)
- Optionally push logs to a remote dashboard

---

## 👤 User Access and API Keys

Example API keys stored at `/home/sheldon/Documents/Security/caddy_apikeys.json`:

```json
{
  "717e8b46-f212-400a-b521-db184327a7a0": {
    "user": "beano",
    "service": "chat"
  },
  "ed7f9108-5c0f-41ad-9942-9d0456667992": {
    "user": "emmanuel",
    "service": "tts"
  }
}
```

---

## 🧪 Testing Endpoints

### Test Chat:
```bash
curl -X POST http://localhost:8080/chat/api/generate \
  -H "X-API-Key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3", "prompt":"What is the capital of France?"}'
```

### Test TTS:
```bash
curl -X POST http://localhost:8080/tts/api/speak \
  -H "X-API-Key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"en-US-JennyNeural"}' \
  --output hello.mp3
```

---

## 🧭 Getting Started for New Developers

1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/selfmind.git
   cd selfmind
   ```

2. Ensure Docker and Docker Compose are installed.

3. Copy `.env.example` to `.env` if needed.

4. Launch core stack:
   ```bash
   docker compose up -d
   ```

5. Run the image generation service separately if needed:
   ```bash
   cd ../stable-diffusion-webui-docker
   docker compose --profile auto-cpu up --build
   ```

---

## 📬 Final Thoughts

This project is your personal **AI API stack**, private, fast, and hackable. As we continue improving it, you are in full control of models, access, and hosting. Feel free to contribute ideas or integrations (like Whisper or RVC audio cloning in the future). Welcome aboard!