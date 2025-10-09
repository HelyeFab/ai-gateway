# 🌐 Network Setup Summary

This document provides a complete overview of the AI Gateway network configuration, including both public and private access methods.

## Quick Access Guide

### Public Access (via Cloudflare)
- **URL**: https://selfmind.dev
- **Status**: Active (DNS propagation in progress)
- **Use for**: Production APIs, public endpoints

### Private Access (via Tailscale)
- **URL**: http://100.111.118.91:8080 or http://tbbt-sheldon:8080
- **Status**: Active and operational
- **Use for**: Admin access, monitoring, development

### Local Access
- **URL**: http://localhost:8080
- **Status**: Always available on the server

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬───────────────┬────────────────────────┘
                     │               │
                     ▼               ▼
              ┌──────────┐    ┌──────────────┐
              │Cloudflare│    │  Tailscale   │
              │   CDN    │    │     VPN      │
              └────┬─────┘    └──────┬───────┘
                   │                 │
                   ▼                 │
         ┌─────────────────┐         │
         │ Public IP:      │         │
         │ 93.44.82.233    │         │
         └────────┬────────┘         │
                  │                  │
                  ▼                  │
         ┌─────────────────┐         │
         │ FASTGate Router │         │
         │ Port 443 → 443  │         │
         └────────┬────────┘         │
                  │                  │
                  ▼                  ▼
         ┌─────────────────────────────────┐
         │      Caddy (Port 443/80)        │
         │    Self-signed certificates     │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │   API Gateway (Port 8080)       │
         │    Authentication Layer         │
         └────────────┬────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Ollama  │  │Edge-TTS │  │ Stable  │  │ Whisper │
   │ :11434  │  │  :8090  │  │Diffusion│  │  :8091  │
   │         │  │         │  │  :7860  │  │         │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

## Configuration Details

### Domain Configuration
- **Domain**: selfmind.dev
- **Registrar**: Namecheap
- **DNS Provider**: Cloudflare
- **Nameservers**: 
  - novalee.ns.cloudflare.com
  - rommy.ns.cloudflare.com

### Cloudflare Settings
- **SSL/TLS Mode**: Flexible
- **DNS Records**:
  - A Record: selfmind.dev → 93.44.82.233
  - CNAME: www → selfmind.dev
- **Proxy**: Enabled (orange cloud)
- **Benefits**: DDoS protection, SSL termination, caching

### Router Configuration
- **Model**: FASTGate (ISP-provided)
- **Limitations**: Ports 80, 8080 blocked by ISP
- **Port Forwarding**: 443 external → 443 internal
- **Local IP**: 192.168.1.x

### Tailscale Configuration
- **IP Address**: 100.111.118.91
- **Machine Name**: tbbt-sheldon
- **Network**: WireGuard-based mesh VPN
- **Authentication**: Device-based with account login

## Service Endpoints

### Public Endpoints (via Cloudflare)
```bash
# Health Check (no auth)
curl https://selfmind.dev/health

# Chat API
curl -X POST https://selfmind.dev/chat/api/generate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3", "prompt":"Hello"}'

# TTS API
curl -X POST https://selfmind.dev/tts/api/speak \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voice":"en-US-JennyNeural"}' \
  --output speech.mp3

# Image Generation
curl -X POST https://selfmind.dev/image/api/generate/simple \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sunset landscape"}' \
  | jq -r '.image' | base64 -d > image.png
```

### Private Endpoints (via Tailscale)
```bash
# All the same endpoints, but using:
http://100.111.118.91:8080/[endpoint]
# or
http://tbbt-sheldon:8080/[endpoint]

# Monitoring Dashboard
http://100.111.118.91:19999
```

## Security Measures

### Multi-Layer Security
1. **Cloudflare**: DDoS protection, bot filtering
2. **Caddy**: HTTPS enforcement, header validation
3. **API Gateway**: API key authentication, rate limiting
4. **Tailscale**: Device-based authentication, encrypted tunnel

### API Key Management
- Stored in: `/home/sheldon/Documents/Security/caddy_apikeys.json`
- Management script: `generate_apikey.py`
- Audit logs: `./logs/audit.log`

## Troubleshooting Guide

### DNS Issues
```bash
# Check DNS propagation
nslookup selfmind.dev
dig selfmind.dev

# Clear DNS cache
sudo systemd-resolve --flush-caches
```

### Connectivity Tests
```bash
# Test local
curl http://localhost:8080/health

# Test Tailscale
curl http://100.111.118.91:8080/health

# Test Cloudflare (may take 48h for DNS)
curl https://selfmind.dev/health
```

### Service Health
```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart
```

### Common Issues

1. **Cloudflare 522/523 errors**:
   - Ensure services are running
   - Check port 443 forwarding
   - Verify Caddy is listening

2. **Tailscale connection issues**:
   - Run `tailscale status`
   - Ensure `tailscaled` service is running
   - Try `sudo tailscale up`

3. **API authentication failures**:
   - Verify API key is valid
   - Check header format: `X-API-Key: YOUR_KEY`
   - Review audit logs

## Monitoring

### Netdata Dashboard
- **Local**: http://localhost:19999
- **Tailscale**: http://100.111.118.91:19999
- **Metrics**: CPU, memory, network, Docker containers

### Log Files
- **Audit Log**: `./logs/audit.log`
- **Docker Logs**: `docker compose logs [service]`
- **Caddy Logs**: `docker compose logs caddy`

### Health Monitoring Script
```bash
#!/bin/bash
# Quick health check
echo "🔍 AI Gateway Status"
echo "=================="
echo "Docker Services:"
docker compose ps --format "table {{.Service}}\t{{.Status}}"
echo -e "\nEndpoint Health:"
curl -s http://localhost:8080/health | jq .
echo -e "\nTailscale Status:"
tailscale status | grep tbbt-sheldon
```

## Maintenance

### Regular Tasks
1. **Update Docker images**: `docker compose pull`
2. **Rotate API keys**: Monthly using `generate_apikey.py`
3. **Check logs**: Weekly for suspicious activity
4. **Update Tailscale**: `sudo apt update && sudo apt upgrade tailscale`
5. **Monitor Cloudflare**: Check analytics dashboard

### Backup Considerations
- API keys file: `/home/sheldon/Documents/Security/caddy_apikeys.json`
- Audit logs: `./logs/`
- Docker volumes: `caddy_data`, `caddy_config`

## Future Enhancements

1. **Implement rate limiting** in API Gateway
2. **Add Prometheus metrics** export
3. **Setup automated backups** for configurations
4. **Implement webhook notifications** for errors
5. **Add GraphQL endpoint** for unified API access