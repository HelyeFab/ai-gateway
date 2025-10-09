# Cloudflare Tunnel Setup and Management Guide

This guide covers everything you need to know about using Cloudflare Tunnel (cloudflared) for the AI Gateway.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [Managing the Tunnel](#managing-the-tunnel)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

Cloudflare Tunnel provides a secure way to expose your AI Gateway to the internet without opening ports on your router. It creates an encrypted tunnel between your server and Cloudflare's network.

### Benefits
- No port forwarding required
- DDoS protection from Cloudflare
- SSL/TLS encryption handled automatically
- Works behind restrictive firewalls
- Zero-trust security model

## Installation

### Ubuntu/Debian
```bash
# Add Cloudflare's package repository
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Update and install
sudo apt update
sudo apt install cloudflared
```

### Quick Install (Alternative)
```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

## Initial Setup

### 1. Authenticate with Cloudflare
```bash
cloudflared tunnel login
```
This opens a browser where you'll select your domain.

### 2. Create a Tunnel
```bash
cloudflared tunnel create ai-gateway
```
This creates tunnel credentials at `~/.cloudflared/<TUNNEL_ID>.json`

### 3. Configure the Tunnel

Create or edit `~/.cloudflared/config.yml`:
```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/sheldon/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Main domain
  - hostname: selfmind.dev
    service: http://localhost:8080
  # www subdomain
  - hostname: www.selfmind.dev
    service: http://localhost:8080
  # Catch-all rule (required)
  - service: http_status:404
```

### 4. Route DNS
```bash
# Route your domain through the tunnel
cloudflared tunnel route dns ai-gateway selfmind.dev
cloudflared tunnel route dns ai-gateway www.selfmind.dev
```

### 5. Start the Tunnel
```bash
# Run once to test
cloudflared tunnel run ai-gateway

# Install as a service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Managing the Tunnel

### Starting and Stopping

```bash
# Start the tunnel
sudo systemctl start cloudflared

# Stop the tunnel
sudo systemctl stop cloudflared

# Restart the tunnel
sudo systemctl restart cloudflared

# Check status
sudo systemctl status cloudflared
```

### Viewing Logs

```bash
# View recent logs
sudo journalctl -u cloudflared -n 50

# Follow logs in real-time
sudo journalctl -u cloudflared -f

# View logs for debugging
sudo journalctl -u cloudflared --since "1 hour ago"
```

### Updating Configuration

1. Edit the config file:
```bash
nano ~/.cloudflared/config.yml
```

2. Restart the service:
```bash
sudo systemctl restart cloudflared
```

### Managing Multiple Tunnels

```bash
# List all tunnels
cloudflared tunnel list

# Delete a tunnel
cloudflared tunnel delete ai-gateway

# Get tunnel info
cloudflared tunnel info ai-gateway
```

## Troubleshooting

### Common Issues

#### 1. Tunnel Won't Start
```bash
# Check for existing processes
ps aux | grep cloudflared

# Kill existing processes
sudo pkill cloudflared

# Check configuration
cloudflared tunnel ingress validate
```

#### 2. DNS Not Resolving
```bash
# Check DNS records in Cloudflare dashboard
# Ensure proxy is enabled (orange cloud)

# Verify tunnel routes
cloudflared tunnel route list
```

#### 3. 502 Bad Gateway Errors
- Ensure the local service (port 8080) is running
- Check Docker containers: `docker compose ps`
- Verify the service URL in config.yml

#### 4. Certificate Errors
- Make sure Cloudflare SSL mode is set to "Full" (not "Full (strict)")
- Local service should use HTTP, not HTTPS

### Debug Mode

Run cloudflared with debug logging:
```bash
cloudflared tunnel --loglevel debug run ai-gateway
```

### Testing Connectivity

```bash
# Test from inside the server
curl http://localhost:8080/health

# Test through the tunnel
curl https://selfmind.dev/health
```

## Security Considerations

### 1. Protect Tunnel Credentials
```bash
# Set proper permissions
chmod 600 ~/.cloudflared/*.json
chmod 600 ~/.cloudflared/config.yml
```

### 2. Use Cloudflare Access (Optional)
Add an extra layer of authentication:
```yaml
# In config.yml
ingress:
  - hostname: selfmind.dev
    service: http://localhost:8080
    originRequest:
      noTLSVerify: true
```

### 3. Monitor Access
- Enable Cloudflare Analytics
- Set up Cloudflare Firewall Rules
- Use Cloudflare Rate Limiting

### 4. Backup Tunnel Credentials
```bash
# Backup tunnel credentials
cp ~/.cloudflared/*.json ~/backup/cloudflared/

# Backup config
cp ~/.cloudflared/config.yml ~/backup/cloudflared/
```

## Advanced Configuration

### Load Balancing
```yaml
ingress:
  - hostname: selfmind.dev
    service: http://localhost:8080
    originRequest:
      connectTimeout: 30s
      keepAliveTimeout: 90s
```

### Multiple Services
```yaml
ingress:
  - hostname: api.selfmind.dev
    service: http://localhost:8080
  - hostname: dashboard.selfmind.dev
    service: http://localhost:3000
  - hostname: selfmind.dev
    service: http://localhost:8080
  - service: http_status:404
```

### Health Checks
```yaml
ingress:
  - hostname: selfmind.dev
    service: http://localhost:8080
    originRequest:
      noHappyEyeballs: true
      retries: 5
```

## Quick Reference

### Essential Commands
```bash
# Start tunnel
sudo systemctl start cloudflared

# Stop tunnel
sudo systemctl stop cloudflared

# View status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Restart after config change
sudo systemctl restart cloudflared

# Test configuration
cloudflared tunnel ingress validate

# List tunnels
cloudflared tunnel list
```

### File Locations
- Config: `~/.cloudflared/config.yml`
- Credentials: `~/.cloudflared/<TUNNEL_ID>.json`
- Service: `/etc/systemd/system/cloudflared.service`
- Logs: `journalctl -u cloudflared`

## Current Setup for AI Gateway

The AI Gateway uses Cloudflare Tunnel with the following configuration:
- Tunnel ID: `c325864b-4c4c-4e02-a77e-d90c01873020`
- Domain: `selfmind.dev`
- Local service: `http://localhost:8080`
- SSL Mode: Full (Cloudflare to origin)

To manage the current tunnel:
```bash
# Check if running
sudo systemctl status cloudflared

# View current config
cat ~/.cloudflared/config.yml

# Monitor traffic
sudo journalctl -u cloudflared -f
```