# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The AI Gateway is a secure API gateway for self-hosted AI services built with Flask (Python) and Caddy. It provides authenticated access to multiple AI services including LLMs (Ollama), Text-to-Speech (Edge-TTS), Image Generation (Stable Diffusion), and Speech-to-Text (Whisper).

## Architecture

The system uses a two-layer security model:
1. **Caddy** - Reverse proxy handling routing and initial API key validation
2. **Flask API Gatekeeper** - Authentication, audit logging, and request proxying

Services communicate via Docker networking with containers:
- `ai-gateway-caddy` - Port 80/443
- `ai-gateway-api-gatekeeper` - Port 8080 
- `edge-tts` - Port 8090
- Ollama runs on host at port 11434
- Image generation planned for port 8091

## Key Commands

### Development & Testing

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart api-gatekeeper

# Test endpoints
# Chat API
curl -X POST http://localhost:8080/chat/api/generate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3", "prompt":"Hello"}'

# TTS API  
curl -X POST http://localhost:8080/tts/api/speak \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voice":"en-US-JennyNeural"}' \
  --output test.mp3

# Image Generation API (simple)
curl -X POST http://localhost:8080/image/api/generate/simple \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a beautiful sunset"}' \
  | jq -r '.image' | base64 -d > image.png
```

### API Key Management

```bash
# Generate new key (interactive)
python generate_apikey.py

# Generate key (CLI)
python generate_apikey.py generate -u username -s service -d "Description" -e 30

# List keys
python generate_apikey.py list

# Disable key
python generate_apikey.py disable KEY_ID

# Validate key
python generate_apikey.py validate KEY_ID
```

### Log Analysis

```bash
# Analyze all logs
python analyze_logs.py --log-file ./logs/audit.log

# Last 24 hours
python analyze_logs.py --log-file ./logs/audit.log --hours 24

# Detect threats
python analyze_logs.py --log-file ./logs/audit.log --suspicious

# User report
python analyze_logs.py --log-file ./logs/audit.log --users
```

## Adding New Services

To add a new protected endpoint:

1. Add Caddy route in `caddy/Caddyfile`:
```caddy
@yourservice {
    path /yourservice/api/*
    method POST
}

handle @yourservice {
    @hasKey header X-API-Key *
    
    handle @hasKey {
        reverse_proxy ai-gateway-api-gatekeeper:8080
    }
    
    handle {
        respond "Unauthorized - API Key Required" 401
    }
}
```

2. Add Flask route in `api-gatekeeper/app.py`:
```python
@app.route("/yourservice/api/endpoint", methods=["POST"])
@require_api_key
def your_service():
    """Your service description."""
    return proxy_request("http://your-service:PORT/endpoint")
```

## Important Files & Locations

- **API Keys**: `/home/sheldon/Documents/Security/caddy_apikeys.json`
- **Audit Logs**: `./logs/audit.log`
- **Flask App**: `api-gatekeeper/app.py`
- **Caddy Config**: `caddy/Caddyfile`
- **Docker Config**: `docker-compose.yml`

## Testing & Validation

Before committing changes:
1. Test the specific endpoint with curl
2. Check logs with `docker compose logs api-gatekeeper`
3. Verify audit logging is working
4. Run log analyzer to check for errors

## Security Considerations

- API keys are stored outside the project directory for security
- All requests are logged with user/service information
- Failed auth attempts are tracked for threat detection
- Use the `@require_api_key` decorator for all protected routes
- Never log or expose API keys in responses

## Common Issues

1. **Connection refused**: Check if target service is running
2. **401 Unauthorized**: Verify API key is valid and has correct header
3. **503 Service Unavailable**: Target service may be down or unreachable
4. **Timeout errors**: Increase timeout in `proxy_request()` function

## System Configuration

### Sudo Password
When sudo access is needed, read the password from `/home/sheldon/.env.local.txt` and use it with `echo 'password' | sudo -S command`.

## Environment Variables

The Flask app uses these environment variables:
- `API_KEYS_FILE`: Path to API keys JSON (default: `caddy_apikeys.json`)
- `AUDIT_LOG_FILE`: Path to audit log (default: `/var/log/ai-gateway/audit.log`)
- `LOG_LEVEL`: Logging level (default: `INFO`)

## Access Methods

### Public Access (via Cloudflare)
- Domain: https://selfmind.dev
- Cloudflare proxy provides DDoS protection and SSL termination
- No port forwarding required on router
- Nameservers: novalee.ns.cloudflare.com, rommy.ns.cloudflare.com

### Private Access (via Tailscale VPN)
- Install Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh`
- Access via: http://tbbt-sheldon:8080 or http://100.111.118.91:8080
- Provides secure remote access without exposing services publicly

## Network Configuration

### Current Setup
- Public IP: 93.44.82.233
- Router: FASTGate with restricted ports (80, 8080 blocked)
- Port 443 forwarded to internal services
- Caddy using self-signed certificates internally
- Cloudflare handling external SSL/TLS

### Monitoring Access
- Netdata installed for system monitoring
- Access locally: http://localhost:19999
- Access via Tailscale: http://100.111.118.91:19999
- Configured to bind only to localhost and Tailscale interface for security

## Completed Tasks

### ✅ High Priority
1. **HTTPS Setup with selfmind.dev**
   - Configured DNS with Namecheap
   - Migrated to Cloudflare for proxy and SSL
   - Caddy configured with self-signed certificates

2. **Image Generation API Integration**
   - Added `/image/api/generate` endpoints to Flask app
   - Integrated with AUTOMATIC1111 on localhost:7860
   - Applied authentication pattern

### ✅ Medium Priority
3. **Port Forwarding Configuration**
   - Port 443 forwarded (router limitations prevent 80/8080)
   - Using Cloudflare proxy to bypass limitations

4. **Secure Remote Access**
   - Tailscale VPN configured and operational
   - Provides secure access without port forwarding

### ✅ Low Priority
5. **Monitoring Setup**
   - Netdata installed and configured
   - Accessible via localhost and Tailscale VPN
   - Monitoring Docker containers and system resources