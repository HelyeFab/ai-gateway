# 🚀 SelfMind AI Gateway

A secure, self-hosted API gateway for AI services with enterprise-grade authentication, monitoring, and a beautiful management dashboard.

## ✨ Current System Status

The AI Gateway is fully deployed and operational at [https://selfmind.dev](https://selfmind.dev) with:

- ✅ **Unified Next.js Application** - Single app serving both landing page and admin dashboard
- ✅ **Google OAuth Authentication** - Secure login via NextAuth (admin: emmanuelfabiani23@gmail.com)
- ✅ **Cloudflare Tunnel** - No port forwarding required, automatic SSL/TLS
- ✅ **Custom Typography** - Rubik for headings, Manrope for body text
- ✅ **Glass Morphism Design** - Beautiful effects with animations

## 🎯 Features

- **🤖 Multiple AI Services**: 
  - Ollama LLMs for chat and text generation
  - Edge-TTS for natural voice synthesis
  - Stable Diffusion for image generation
  - Whisper for speech-to-text transcription
- **🔐 Enterprise Security**: 
  - API key authentication with expiration
  - Comprehensive audit logging
  - Google OAuth for admin access
- **📊 Management Dashboard**: 
  - Real-time service monitoring
  - API key management
  - Usage analytics and logs
- **🌐 Multiple Access Methods**: 
  - Public HTTPS via Cloudflare
  - Private VPN via Tailscale
  - Local development access

## 🏗️ Architecture

```
Internet → Cloudflare (SSL) → Cloudflare Tunnel → Caddy (8080) → Flask API Gateway
                                                        ↓
                                                  AI Services:
                                                  - Ollama (11434)
                                                  - Edge-TTS (8090)
                                                  - Stable Diffusion (7860)
                                                  - Whisper (8092)
                                                        ↓
                                                  Dashboard (3000)
```

## 🛠️ Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for dashboard development)
- Domain name (optional, for public access)
- Cloudflare account (for tunnel setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-gateway.git
   cd ai-gateway
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
   # - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   # - ADMIN_API_KEY
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Set up Cloudflare Tunnel** (for public access)
   ```bash
   # Install cloudflared
   curl -fsSL https://pkg.cloudflare.com/cloudflared/install.sh | sh
   
   # Login and create tunnel
   cloudflared tunnel login
   cloudflared tunnel create ai-gateway
   
   # Configure and run
   # See docs/cloudflare-tunnel.md for detailed setup
   ```

5. **Access the services**
   - Public: https://selfmind.dev
   - Local: http://localhost:8080
   - Dashboard: https://selfmind.dev/dashboard (admin only)

## 📚 Documentation

- [Cloudflare Tunnel Guide](docs/cloudflare-tunnel.md) - Complete setup and management
- [Dashboard Setup](docs/DASHBOARD_SETUP.md) - Configuration and customization
- [API Documentation](docs/chat-api.md) - Endpoint reference
- [HTTPS Configuration](docs/HTTPS_SETUP.md) - SSL/TLS setup
- [VPN Setup](docs/VPN_SETUP.md) - Tailscale configuration
- [Monitoring Guide](docs/MONITORING.md) - System monitoring

## 🔑 API Usage

### Get an API Key

1. Login to https://selfmind.dev with Google (admin only)
2. Navigate to Dashboard → API Keys
3. Create a new key with desired permissions

### Example API Calls

```bash
# Chat/LLM Generation
curl -X POST https://selfmind.dev/chat/api/generate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "prompt": "Write a haiku about coding"
  }'

# Text-to-Speech
curl -X POST https://selfmind.dev/tts/api/speak \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "voice": "en-US-JennyNeural"
  }' \
  --output hello.mp3

# Image Generation
curl -X POST https://selfmind.dev/image/api/generate/simple \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "beautiful sunset over mountains"
  }' \
  | jq -r '.image' | base64 -d > sunset.png
```

## 🎨 Dashboard Features

- **Service Monitoring**: Real-time health checks and status
- **API Key Management**: Create, view, expire, and revoke keys
- **Usage Analytics**: Request counts, response times, error rates
- **Audit Logs**: Comprehensive activity tracking
- **Beautiful UI**: Glass morphism design with smooth animations
- **Responsive Design**: Works on desktop and mobile

## 🔒 Security Features

- **Multi-layer Authentication**:
  - API keys for service access
  - Google OAuth for admin dashboard
  - Optional Firebase integration
- **Comprehensive Logging**:
  - All API requests logged with metadata
  - Failed authentication attempts tracked
  - Audit trail for compliance
- **Network Security**:
  - Cloudflare DDoS protection
  - SSL/TLS encryption
  - CORS protection
  - Rate limiting

## 🚀 Deployment

### Production Checklist

1. ✅ Generate secure secrets:
   ```bash
   # NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # ADMIN_API_KEY
   python generate_apikey.py
   ```

2. ✅ Configure Google OAuth:
   - Create project at https://console.cloud.google.com
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

3. ✅ Set up Cloudflare:
   - Add domain to Cloudflare
   - Set SSL/TLS mode to "Full"
   - Configure firewall rules

4. ✅ Deploy services:
   ```bash
   docker compose up -d
   cloudflared tunnel run ai-gateway
   ```

### Monitoring

- System metrics: http://localhost:19999 (Netdata)
- Service logs: `docker compose logs -f`
- Audit logs: `./logs/audit.log`
- Cloudflare analytics: Dashboard → Analytics

## 🔧 Maintenance

### Common Commands

```bash
# View service status
docker compose ps

# Restart services
docker compose restart

# View logs
docker compose logs -f api-gatekeeper

# Analyze audit logs
python analyze_logs.py --log-file ./logs/audit.log

# Generate new API key
python generate_apikey.py generate -u username -s service
```

### Backup

Important files to backup:
- `/home/sheldon/Documents/Security/caddy_apikeys.json` - API keys
- `~/.cloudflared/` - Tunnel credentials
- `./logs/` - Audit logs
- `.env` - Configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Flask, Next.js, Caddy, and Docker
- UI components from shadcn/ui
- Authentication by NextAuth.js
- Powered by open-source AI models
- Protected by Cloudflare