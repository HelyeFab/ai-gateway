
# 🧠 Open WebUI Integration Guide for Self-Hosted AI, TTS, and Image Generation

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your server:

- **Docker**: For containerized deployment.
- **Ollama**: To run local Large Language Models (LLMs).
- **AUTOMATIC1111 or ComfyUI**: For image generation.
- **Python 3.11+**: If you prefer manual installation over Docker.

---

## 🚀 Step 1: Deploy Open WebUI

### Option A: Docker Deployment (Recommended)

Run the following command to deploy Open WebUI using Docker:

```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

Access Open WebUI at: [http://localhost:3000](http://localhost:3000)

---

### Option B: Docker with Ollama Integration

If you plan to use Ollama for running LLMs:

```bash
docker run -d -p 3000:8080 \
  --gpus=all \
  -v ollama:/root/.ollama \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:ollama
```

This setup bundles Open WebUI with Ollama.

---

## 🧠 Step 2: Configure AI Models with Ollama

1. **Install Ollama**: [https://ollama.com/download](https://ollama.com/download)

2. **Pull Desired Models**:

```bash
ollama pull llama2
```

3. **Configure Open WebUI**:

- Navigate to Admin Panel in Open WebUI.
- Go to **Settings > Models**.
- Add a new model:
  - **Name**: `LLaMA 2`
  - **Model ID**: `llama2`
  - **Base URL**: `http://host.docker.internal:11434`

---

## 🖼️ Step 3: Integrate Image Generation

### Option A: AUTOMATIC1111 (Stable Diffusion WebUI)

1. Clone the repo:

```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
```

2. Run with API:

```bash
./webui.sh --api --listen
```

3. Configure Open WebUI:
- **Settings > Images**
- Set engine to `AUTOMATIC1111`
- URL: `http://host.docker.internal:7860/`

---

### Option B: ComfyUI

1. Clone the repo:

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
```

2. Run:

```bash
python main.py
```

3. Configure in WebUI:
- Engine: `ComfyUI`
- URL: `http://host.docker.internal:8188/`

4. Import Workflow:
- Export from ComfyUI (API format)
- Upload `workflow_api.json` in WebUI
- Map nodes accordingly

---

## 🔊 Step 4: Enable Text-to-Speech (TTS)

1. Get a TTS API Key from:
   - OpenAI TTS
   - ElevenLabs
   - Amazon Polly

2. Go to **Settings > Audio** in WebUI and input key and preferences.

---

## 🔐 Step 5: Manage Security and Access

### API Key Management:

- Go to **Admin Panel > API Keys**
- Generate keys for users/services
- Assign expiration/permissions

### Role-Based Access Control (RBAC):

- Assign roles (`admin`, `user`, `pending`)
- Manage feature access per role

---

## 📁 Step 6: Utilize Retrieval-Augmented Generation (RAG)

### Add Documents:

```bash
docker cp your_document.pdf open-webui:/app/backend/data/docs/
```

### Index in WebUI:

- Go to **Settings > Documents**
- Click **Scan**

### Use in Chat:

- Use `#` to select indexed documents
- Ask questions — AI will reference docs

---

## 🛠️ Step 7: Advanced Configurations

- **System Prompts**: Set defaults per user or model
- **Custom Models**: Clone/import and configure
- **Knowledge Bases**: Group docs for specialized response

---

## 📚 Additional Resources

- [Official Documentation](https://docs.openwebui.com/)
- [GitHub Repository](https://github.com/open-webui/open-webui)
- Community Support via Discord and GitHub Discussions

---

Feel free to adapt this to your setup. If you need help, just ask!

