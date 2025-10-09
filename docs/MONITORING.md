# 📊 Monitoring Setup for AI Gateway

This guide covers setting up monitoring for your AI Gateway to track performance, resource usage, and service health.

## Monitoring Options

### Option 1: Netdata (Recommended for Simplicity)

Netdata provides real-time monitoring with minimal configuration.

#### Installation

```bash
# Install Netdata with one-line installer
wget -O /tmp/netdata-kickstart.sh https://my-netdata.io/kickstart.sh && sh /tmp/netdata-kickstart.sh

# Or using package manager
sudo apt-get install netdata
```

#### Configuration

1. **Edit Netdata config**:
   ```bash
   sudo nano /etc/netdata/netdata.conf
   ```

2. **Bind to VPN interface only** (for security):
   ```ini
   [web]
       bind to = 127.0.0.1 100.64.0.1  # Localhost and Tailscale IP
   ```

3. **Restart Netdata**:
   ```bash
   sudo systemctl restart netdata
   ```

#### Access Dashboard

- Local: `http://localhost:19999`
- VPN: `http://[vpn-ip]:19999`

#### Monitor Docker Containers

Netdata automatically detects Docker containers. To see container metrics:
1. Navigate to the dashboard
2. Look for "Docker Containers" section
3. View metrics for ai-gateway-caddy, api-gatekeeper, etc.

### Option 2: Prometheus + Grafana (Advanced)

For more advanced monitoring and historical data.

#### Docker Compose Addition

Add to your `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: ai-gateway-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: ai-gateway-grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

#### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Docker metrics
  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']

  # Caddy metrics (if enabled)
  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:2019']

  # Node exporter for system metrics
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

## Key Metrics to Monitor

### System Metrics
- **CPU Usage**: Watch for sustained high usage
- **Memory Usage**: Ensure adequate free memory
- **Disk I/O**: Monitor for bottlenecks
- **Network Traffic**: Track API request volume

### Docker Container Metrics
- **Container CPU/Memory**: Per-service resource usage
- **Container restarts**: Indicates stability issues
- **Container network I/O**: API traffic patterns

### Application Metrics
- **Request rate**: Via audit logs analysis
- **Response times**: From Caddy logs
- **Error rates**: 4xx/5xx responses
- **Active API keys**: From audit logs

## Log Aggregation

### Using Loki (Lightweight)

Add to docker-compose.yml:

```yaml
  loki:
    image: grafana/loki:latest
    container_name: ai-gateway-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:latest
    container_name: ai-gateway-promtail
    volumes:
      - /var/log:/var/log:ro
      - ./logs:/logs/ai-gateway:ro
      - ./monitoring/promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped

volumes:
  loki_data:
```

### Audit Log Dashboard

Create a Grafana dashboard for audit logs:

1. Add Loki as data source in Grafana
2. Create panels for:
   - Requests per minute
   - Top users by request count
   - Failed authentication attempts
   - API endpoint usage

Example LogQL queries:
```
# Request rate
rate({job="ai-gateway"} |= "AUTHORIZED"[5m])

# Failed auth attempts
{job="ai-gateway"} |= "UNAUTHORIZED"

# Requests by user
{job="ai-gateway"} |= "AUTHORIZED" | regexp "User: (?P<user>\\S+)" | user != ""
```

## Alerting

### Netdata Alerts

Configure in `/etc/netdata/health.d/ai-gateway.conf`:

```yaml
alarm: ai_gateway_high_cpu
on: apps.cpu
lookup: average -5m unaligned of ai-gateway
units: %
every: 1m
warn: $this > 80
crit: $this > 95
info: AI Gateway CPU usage is high
```

### Prometheus Alerts

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: ai_gateway
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected

      - alert: ContainerDown
        expr: up{job="docker"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Container is down
```

## Quick Health Check Script

Create `monitoring/health_check.sh`:

```bash
#!/bin/bash
# AI Gateway Health Check Script

echo "🔍 AI Gateway Health Check"
echo "=========================="

# Check Docker containers
echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ai-gateway

# Check endpoints
echo -e "\n🌐 Endpoint Health:"
curl -s http://localhost:8080/health | jq .

# Check disk space
echo -e "\n💾 Disk Usage:"
df -h | grep -E "/$|/var/lib/docker"

# Check recent errors in logs
echo -e "\n❌ Recent Errors (last 10):"
grep "ERROR\|UNAUTHORIZED" ./logs/audit.log | tail -10

# API request stats
echo -e "\n📊 Request Stats (last hour):"
python analyze_logs.py --log-file ./logs/audit.log --hours 1 --json | jq '.summary.events'
```

Make it executable:
```bash
chmod +x monitoring/health_check.sh
```

## Best Practices

1. **Regular Reviews**: Check monitoring dashboards daily
2. **Set Up Alerts**: Configure alerts for critical metrics
3. **Log Rotation**: Ensure logs don't fill disk
4. **Backup Metrics**: Export important metrics regularly
5. **Security**: Don't expose monitoring endpoints publicly

## Resource Requirements

- **Netdata**: ~100MB RAM, minimal CPU
- **Prometheus**: ~500MB RAM, scales with metrics
- **Grafana**: ~200MB RAM
- **Loki**: ~200MB RAM, scales with log volume

Choose based on your available resources and monitoring needs.