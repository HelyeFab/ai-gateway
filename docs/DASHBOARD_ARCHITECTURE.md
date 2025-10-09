# 🎯 AI Gateway Dashboard Architecture

## Overview

The AI Gateway Dashboard is a Next.js-based web application that provides a comprehensive interface for managing and monitoring all AI services. It includes both a stunning public landing page and a secure admin dashboard.

## Project Structure

```
ai-gateway/
├── dashboard/                    # Next.js Dashboard Application
│   ├── src/
│   │   ├── app/                 # App Router (Next.js 13+)
│   │   │   ├── (landing)/       # Public landing page
│   │   │   │   ├── page.tsx     # Main landing page
│   │   │   │   └── layout.tsx   # Landing page layout
│   │   │   ├── dashboard/       # Protected dashboard routes
│   │   │   │   ├── page.tsx     # Dashboard home
│   │   │   │   ├── api-keys/    # API key management
│   │   │   │   ├── monitoring/  # Service monitoring
│   │   │   │   ├── analytics/   # Usage analytics
│   │   │   │   ├── logs/        # Log viewer
│   │   │   │   └── settings/    # Configuration
│   │   │   ├── api/            # API routes
│   │   │   │   ├── auth/       # Authentication endpoints
│   │   │   │   └── admin/      # Admin API endpoints
│   │   │   └── layout.tsx      # Root layout
│   │   ├── components/         # Reusable components
│   │   │   ├── landing/        # Landing page components
│   │   │   │   ├── Hero.tsx    # Animated hero section
│   │   │   │   ├── Features.tsx
│   │   │   │   └── ...
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ...
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── lib/               # Utilities and helpers
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── package.json
│   └── next.config.js
│
└── api-gatekeeper/           # Flask backend updates
    └── dashboard_api.py      # New dashboard-specific endpoints
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form + Zod

### Backend Integration
- **API Gateway**: Existing Flask application
- **New Endpoints**: Dashboard-specific management APIs
- **WebSocket**: Socket.io for real-time updates
- **Metrics**: Prometheus integration

## Features

### 1. Landing Page (Public)
- **Hero Section**: Animated particles or wave effect showcasing AI capabilities
- **Services Overview**: Interactive cards for each AI service
- **API Documentation**: Quick access to API docs
- **Pricing/Plans**: Future monetization options
- **Contact/Support**: Help and contact forms

### 2. Dashboard (Protected)

#### Authentication
- Email/password login
- Two-factor authentication (TOTP)
- Session management
- Role-based access control

#### API Key Management
- Create new keys with metadata
- Set expiration dates
- Define service permissions
- View usage per key
- Revoke/disable keys
- Export key list

#### Service Monitoring
- Real-time service status
- Docker container health
- Resource usage graphs
- Request/response metrics
- Error tracking

#### Analytics Dashboard
- Request volume charts
- Popular endpoints
- User activity
- Response time trends
- Error rate analysis
- Cost tracking (future)

#### Log Viewer
- Real-time log streaming
- Filter by service/level
- Search functionality
- Export capabilities

#### Configuration
- Service settings
- Model management
- Rate limit controls
- Webhook configuration

## API Endpoints (New)

### Dashboard Management APIs
```python
# In api-gatekeeper/dashboard_api.py

@app.route("/api/dashboard/stats", methods=["GET"])
@require_dashboard_auth
def get_dashboard_stats():
    """Get overview statistics for dashboard home."""
    
@app.route("/api/dashboard/services", methods=["GET"])
@require_dashboard_auth
def get_service_status():
    """Get real-time status of all services."""
    
@app.route("/api/dashboard/keys", methods=["GET", "POST", "DELETE"])
@require_dashboard_auth
def manage_api_keys():
    """CRUD operations for API keys."""
    
@app.route("/api/dashboard/logs", methods=["GET"])
@require_dashboard_auth
def get_logs():
    """Stream logs with filtering."""
    
@app.route("/api/dashboard/metrics", methods=["GET"])
@require_dashboard_auth
def get_metrics():
    """Get Prometheus metrics for charts."""
```

## Security Considerations

### Authentication Flow
1. User logs in via NextAuth.js
2. JWT token issued with admin claims
3. Token validated on each request
4. Separate auth from API keys
5. Rate limiting on auth endpoints

### Access Control
- Dashboard requires separate authentication
- API keys cannot access dashboard
- Admin roles for different permissions
- Audit logging for all actions

## Deployment Architecture

```
Internet
    │
    ▼
Cloudflare
    │
    ├─> selfmind.dev (Landing Page)
    │   └─> Next.js App (Port 3000)
    │
    ├─> selfmind.dev/dashboard/* (Dashboard)
    │   └─> Next.js App (Port 3000)
    │
    └─> selfmind.dev/[api-routes] (API Gateway)
        └─> Flask App (Port 8080)
```

### Caddy Configuration Update
```caddy
# Landing page and dashboard
handle / {
    reverse_proxy localhost:3000
}

handle /dashboard* {
    reverse_proxy localhost:3000
}

# Existing API routes remain unchanged
```

## Development Workflow

### Initial Setup
```bash
# Create Next.js app
cd /home/sheldon/ai-gateway
npx create-next-app@latest dashboard --typescript --tailwind --app

# Install dependencies
cd dashboard
npm install @radix-ui/react-* tailwind-merge class-variance-authority
npm install framer-motion recharts zustand
npm install next-auth socket.io-client
npm install react-hook-form @hookform/resolvers zod
```

### Environment Variables
```env
# .env.local
NEXTAUTH_URL=https://selfmind.dev
NEXTAUTH_SECRET=your-secret-key
API_GATEWAY_URL=http://localhost:8080
SOCKET_URL=http://localhost:8081
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Project setup and structure
- [ ] Landing page with animations
- [ ] Basic authentication
- [ ] Dashboard layout

### Phase 2: Core Features (Week 2)
- [ ] API key management UI
- [ ] Service monitoring
- [ ] Basic analytics
- [ ] Real-time updates

### Phase 3: Advanced Features (Week 3)
- [ ] Log viewer
- [ ] Configuration management
- [ ] Advanced analytics
- [ ] Export functionality

### Phase 4: Polish (Week 4)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Documentation
- [ ] Testing

## Monitoring the Dashboard

- **Uptime**: Monitor via Netdata
- **Performance**: Lighthouse CI
- **Errors**: Sentry integration
- **Analytics**: Plausible or Umami