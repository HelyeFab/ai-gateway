# 🔒 Secure Remote Access with VPN

This guide documents the completed Tailscale VPN setup for secure remote access to your AI Gateway.

## Current Setup: Tailscale VPN

Tailscale is installed and operational, providing secure remote access without exposing services to the public internet.

### Access Information
- **Tailscale IP**: 100.111.118.91
- **Machine Name**: tbbt-sheldon
- **Access URL**: http://tbbt-sheldon:8080 or http://100.111.118.91:8080

### Installation (Completed)

The quick install method was used:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

### Using Tailscale

1. **Connect to Tailscale** (if not already connected):
   ```bash
   sudo tailscale up
   ```

2. **Check connection status**:
   ```bash
   tailscale status
   ```

3. **View your Tailscale IP**:
   ```bash
   tailscale ip -4
   ```

### Accessing Services

From any device with Tailscale installed and connected to the same account:

```bash
# Access AI Gateway health check
curl http://100.111.118.91:8080/health

# Access with machine name (MagicDNS)
curl http://tbbt-sheldon:8080/health

# API endpoints with authentication
curl -X POST http://100.111.118.91:8080/chat/api/generate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3", "prompt":"Hello"}'

# Access monitoring (Netdata)
# Browse to: http://100.111.118.91:19999
```

### Mobile/Remote Access

1. **Install Tailscale** on your device:
   - iOS: Download from App Store
   - Android: Download from Google Play
   - Windows/Mac/Linux: https://tailscale.com/download

2. **Log in** with the same account used on the server

3. **Access services** using the URLs above

### Advanced Configuration

#### Share Access with Others
```bash
# Generate a sharing link (expires in 1 hour by default)
tailscale serve https 8080

# Or create a funnel for public access (requires approval)
tailscale funnel 8080
```

#### Advertise Local Network Routes
If you want to access other devices on your home network through Tailscale:
```bash
# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p /etc/sysctl.conf

# Advertise your local subnet
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-routes
```

Then approve the route in the Tailscale admin console.

## Security Benefits

1. **End-to-end encryption**: All traffic is encrypted with WireGuard
2. **No open ports**: Router remains secure with no port forwarding
3. **Identity-based access**: Only authorized devices can connect
4. **Audit logs**: Track all connections in Tailscale admin console
5. **MFA support**: Enable 2FA on your Tailscale account

## Comparison: Tailscale vs Cloudflare Access

| Feature | Tailscale (Current) | Cloudflare (Also Active) |
|---------|-------------------|------------------------|
| **Use Case** | Private/admin access | Public API access |
| **Setup** | ✅ Simple, instant | ✅ DNS configuration |
| **Port Forwarding** | ❌ Not required | ❌ Not required |
| **Speed** | ⚡ Direct connection | 🌐 Through CDN |
| **Authentication** | Device-based | API keys |
| **Best For** | Admin, monitoring, testing | Production APIs |

## Monitoring via Tailscale

Netdata is configured to be accessible through Tailscale:

```bash
# View system metrics
http://100.111.118.91:19999

# The Netdata configuration binds to:
# - 127.0.0.1 (localhost)
# - 100.111.118.91 (Tailscale IP)
```

## Troubleshooting

### Connection Issues
```bash
# Check if Tailscale is running
sudo systemctl status tailscaled

# Reconnect if needed
sudo tailscale down
sudo tailscale up

# Test connectivity to other devices
tailscale ping [device-name]
```

### Can't Access Services
1. Ensure the service is running: `docker compose ps`
2. Check if Tailscale is connected: `tailscale status`
3. Verify the correct IP: `tailscale ip -4`
4. Try using the IP instead of hostname

### Performance Issues
```bash
# Check Tailscale's connection type
tailscale netcheck

# For best performance, ensure direct connections
# Look for "Direct" in the output of:
tailscale status
```

## Best Practices

1. **Use Tailscale for**:
   - Administrative tasks
   - Monitoring and logs
   - Development and testing
   - Sensitive operations

2. **Use Cloudflare for**:
   - Public API endpoints
   - Production traffic
   - High-volume requests

3. **Security**:
   - Enable 2FA on Tailscale account
   - Regularly review connected devices
   - Use ACLs for fine-grained access control
   - Keep Tailscale updated: `sudo apt update && sudo apt upgrade tailscale`

## Quick Reference

```bash
# Start Tailscale
sudo tailscale up

# Check status
tailscale status

# View IP
tailscale ip -4

# Access Gateway
curl http://100.111.118.91:8080/health

# Access Monitoring
firefox http://100.111.118.91:19999

# Disconnect (if needed)
sudo tailscale down
```