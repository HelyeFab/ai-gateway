# 🚀 Dashboard Deployment Guide

## Overview

This guide covers deploying the SelfMind Dashboard alongside your AI Gateway services.

## Deployment Methods

### Method 1: Docker Compose (Recommended)

The dashboard is fully integrated into the docker-compose.yml file.

#### 1. Build and Deploy

```bash
# Navigate to project root
cd /home/sheldon/ai-gateway

# Build and start all services including dashboard
docker compose up -d --build

# Or just the dashboard
docker compose up -d --build dashboard
```

#### 2. Verify Deployment

```bash
# Check if dashboard is running
docker compose ps dashboard

# View dashboard logs
docker compose logs -f dashboard
```

#### 3. Access Dashboard

- **Local**: http://localhost:3000
- **Via Tailscale**: http://100.111.118.91:3000/dashboard
- **Via Cloudflare**: https://selfmind.dev/dashboard

### Method 2: Standalone Deployment

If you prefer to run the dashboard separately:

#### 1. Build for Production

```bash
cd /home/sheldon/ai-gateway/dashboard
npm run build
```

#### 2. Run with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start dashboard
pm2 start npm --name "selfmind-dashboard" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Configure Nginx/Caddy

If not using Docker, add to your web server:

```nginx
location /dashboard {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Environment Configuration

### Required Environment Variables

```bash
# .env file in project root
NEXTAUTH_SECRET=generate-a-32-character-secret-here
JWT_SECRET=your-jwt-secret-for-api-gateway
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Production Settings

For production deployment, update these in docker-compose.yml:

```yaml
environment:
  - NEXTAUTH_URL=https://selfmind.dev
  - NEXT_PUBLIC_API_URL=https://selfmind.dev
  - API_GATEWAY_INTERNAL_URL=http://api-gatekeeper:8080
```

## Security Considerations

### 1. HTTPS Only

In production, always use HTTPS:

```yaml
# docker-compose.yml
environment:
  - NEXTAUTH_URL=https://selfmind.dev
```

### 2. Secure Secrets

Never commit real secrets. Use environment variables:

```bash
# Create .env file (gitignored)
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

### 3. Network Isolation

Dashboard communicates with API Gateway internally:

```yaml
# Uses internal Docker network
API_GATEWAY_INTERNAL_URL=http://api-gatekeeper:8080
```

### 4. Authentication

Default admin credentials:
- Email: admin@selfmind.dev
- Password: admin

**IMPORTANT**: Change the default password immediately!

## Updating the Dashboard

### With Docker Compose

```bash
# Pull latest changes
git pull

# Rebuild and restart dashboard
docker compose up -d --build dashboard
```

### With PM2

```bash
# Navigate to dashboard
cd /home/sheldon/ai-gateway/dashboard

# Pull latest changes
git pull

# Install dependencies
npm install

# Build production version
npm run build

# Restart PM2 process
pm2 restart selfmind-dashboard
```

## Troubleshooting

### Dashboard Not Loading

1. **Check container status**:
   ```bash
   docker compose ps dashboard
   ```

2. **View logs**:
   ```bash
   docker compose logs dashboard --tail=50
   ```

3. **Verify API Gateway is running**:
   ```bash
   docker compose ps api-gatekeeper
   ```

### Authentication Issues

1. **Verify environment variables**:
   ```bash
   docker compose exec dashboard env | grep -E "NEXTAUTH|API_GATEWAY"
   ```

2. **Check API Gateway logs**:
   ```bash
   docker compose logs api-gatekeeper --tail=50
   ```

3. **Ensure JWT secrets match** between dashboard and API gateway

### API Connection Errors

1. **Test internal connectivity**:
   ```bash
   docker compose exec dashboard curl http://api-gatekeeper:8080/health
   ```

2. **Check CORS settings** if accessing from different domain

3. **Verify network**:
   ```bash
   docker network ls
   docker compose exec dashboard ping api-gatekeeper
   ```

## Performance Optimization

### 1. Enable Caching

Add to next.config.js:
```javascript
module.exports = {
  // ... other config
  headers: async () => [
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

### 2. Resource Limits

Add to docker-compose.yml:
```yaml
dashboard:
  # ... other config
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

### 3. Health Checks

Add health check to docker-compose.yml:
```yaml
dashboard:
  # ... other config
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Monitoring

### 1. Container Metrics

```bash
# Real-time stats
docker stats dashboard

# Via Netdata
http://100.111.118.91:19999
```

### 2. Application Logs

```bash
# Follow logs
docker compose logs -f dashboard

# Export logs
docker compose logs dashboard > dashboard.log
```

### 3. Error Tracking

Consider adding Sentry for production:

```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Backup and Recovery

### Backup Configuration

```bash
# Backup dashboard config
tar -czf dashboard-backup-$(date +%Y%m%d).tar.gz \
  dashboard/.env.local \
  dashboard/next.config.js
```

### Restore Process

```bash
# Stop dashboard
docker compose stop dashboard

# Restore files
tar -xzf dashboard-backup-20240131.tar.gz

# Restart
docker compose up -d dashboard
```

## Next Steps

1. **Change default admin password**
2. **Configure monitoring alerts**
3. **Set up automated backups**
4. **Enable analytics tracking**
5. **Customize branding**

The dashboard is now ready for production use!