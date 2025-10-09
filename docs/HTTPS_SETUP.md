# 🔒 HTTPS Setup Guide for AI Gateway

This guide documents the completed HTTPS setup for the AI Gateway using multiple access methods.

## Current Configuration

The AI Gateway is accessible through two methods:

### 1. Public Access (via Cloudflare)
- **URL**: https://selfmind.dev
- **Method**: Cloudflare proxy (no port forwarding required)
- **Benefits**: DDoS protection, SSL termination, bypasses ISP restrictions
- **Status**: Active (DNS propagation may take up to 48 hours)

### 2. Private Access (via Tailscale VPN)
- **URL**: http://tbbt-sheldon:8080 or http://100.111.118.91:8080
- **Method**: VPN tunnel
- **Benefits**: Secure, no public exposure, instant access
- **Status**: Active and operational

## Network Architecture

```
Internet → Cloudflare → Your Public IP (93.44.82.233) → Router (Port 443) → Caddy → Services
    ↓
Tailscale VPN → Direct access to services (bypassing public internet)
```

## DNS Configuration

### Namecheap Settings
- **Nameservers**: Changed to Cloudflare
  - novalee.ns.cloudflare.com
  - rommy.ns.cloudflare.com

### Cloudflare Settings
- **A Record**: selfmind.dev → 93.44.82.233
- **CNAME Record**: www → selfmind.dev
- **Proxy Status**: Enabled (orange cloud)
- **SSL/TLS Mode**: Flexible (recommended)

## Router Configuration

### FASTGate Limitations
- Ports 80 and 8080 are blocked by ISP
- Only port 443 is available for forwarding
- Current forwarding: External 443 → Internal 443

## Caddy Configuration

The Caddyfile is configured with:
- Self-signed certificates for internal use
- Support for both HTTP (local) and HTTPS (production)
- API key authentication via headers
- Reverse proxy to Flask API Gateway

## Testing Access

### Via Cloudflare (Public)
```bash
# Health check (no auth required)
curl https://selfmind.dev/health

# Status check (requires API key)
curl -H "X-API-Key: YOUR_KEY" https://selfmind.dev/status

# API endpoints
curl -X POST https://selfmind.dev/chat/api/generate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3", "prompt":"Hello"}'
```

### Via Tailscale (Private)
```bash
# First, ensure Tailscale is connected
tailscale status

# Access services
curl http://tbbt-sheldon:8080/health
curl -H "X-API-Key: YOUR_KEY" http://100.111.118.91:8080/status
```

## Troubleshooting

### Cloudflare Issues
1. **Site not accessible**: Wait for DNS propagation (up to 48 hours)
2. **SSL errors**: Ensure Cloudflare SSL mode is set to "Flexible"
3. **525 errors**: Check if local server is running

### Tailscale Issues
1. **Cannot connect**: Run `tailscale up` to connect
2. **Device not found**: Check `tailscale status` for device list
3. **Permission denied**: Run with sudo for initial setup

### General Issues
1. **503 errors**: Check if Docker containers are running
2. **401 errors**: Verify API key is valid
3. **Timeout errors**: Check firewall and port forwarding

## Security Best Practices

1. **Use Tailscale for sensitive operations**: Admin tasks, monitoring, etc.
2. **Cloudflare for public APIs**: Benefits from DDoS protection
3. **Regular key rotation**: Update API keys monthly
4. **Monitor access logs**: Check for suspicious patterns
5. **Keep services updated**: Regular Docker image updates

## Monitoring

- **Local**: http://localhost:19999 (Netdata)
- **Via Tailscale**: http://100.111.118.91:19999
- **Logs**: `docker compose logs -f`

## Certificate Management

- **Cloudflare**: Handles all SSL certificates automatically
- **Internal Caddy**: Uses self-signed certificates (no external validation needed)
- **No manual renewal required**: Both systems auto-renew

## Quick Reference

```bash
# Check service status
docker compose ps

# View recent logs
docker compose logs --tail=50

# Restart services
docker compose restart

# Check Tailscale status
tailscale status

# Test internal connectivity
curl http://localhost:8080/health

# Test Tailscale connectivity
curl http://100.111.118.91:8080/health

# Test Cloudflare connectivity
curl https://selfmind.dev/health
```