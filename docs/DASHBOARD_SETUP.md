# 🚀 Dashboard Setup Guide

## Overview

The SelfMind Dashboard is a Next.js application that provides a web interface for managing your AI Gateway. This guide covers setting up the development environment and deploying the dashboard.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose running
- AI Gateway services operational

## Quick Setup

### 1. Install Dashboard

```bash
cd /home/sheldon/ai-gateway/dashboard
chmod +x setup.sh
./setup.sh
```

This script will:
- Create a Next.js app with TypeScript and Tailwind CSS
- Install UI components (shadcn/ui)
- Install animation libraries (Framer Motion, Three.js)
- Install authentication (NextAuth.js)
- Install data visualization (Recharts)

### 2. Manual Setup (Alternative)

If the setup script doesn't work, use these commands:

```bash
cd /home/sheldon/ai-gateway
npx create-next-app@latest dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd dashboard

# Core dependencies
npm install lucide-react framer-motion
npm install @radix-ui/react-dialog @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install tailwindcss-animate

# Dashboard specific
npm install recharts react-hook-form zod @hookform/resolvers
npm install next-auth zustand socket.io-client

# 3D animations (optional)
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

### 3. Environment Configuration

Create `.env.local`:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-here

# API Gateway
NEXT_PUBLIC_API_URL=http://localhost:8080
API_GATEWAY_INTERNAL_URL=http://localhost:8080

# Production URLs (when deployed)
# NEXTAUTH_URL=https://selfmind.dev
# NEXT_PUBLIC_API_URL=https://selfmind.dev
```

### 4. Start Development Server

```bash
npm run dev
```

Dashboard will be available at http://localhost:3000

## Project Structure

```
dashboard/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Dashboard pages (protected)
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── api-keys/      # API key management
│   │   │   ├── monitoring/    # Service monitoring
│   │   │   ├── analytics/     # Usage analytics
│   │   │   └── settings/      # Configuration
│   │   ├── api/              # API routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── admin/        # Admin endpoints
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page (redirects)
│   ├── components/           # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── auth/           # Auth components
│   ├── lib/                # Utilities
│   │   ├── auth.ts         # NextAuth config
│   │   ├── api.ts          # API client
│   │   └── utils.ts        # Helper functions
│   └── styles/             # Global styles
└── public/                 # Static assets
```

## Key Features Implementation

### 1. Authentication Setup

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Validate against your user database
        // For now, using a demo user
        if (credentials?.email === "admin@selfmind.dev" && 
            credentials?.password === "admin") {
          return { id: "1", email: "admin@selfmind.dev", name: "Admin" }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
```

### 2. API Client Setup

Create `src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

// Dashboard-specific endpoints
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => fetchWithAuth('/api/dashboard/stats'),
  
  // API Key management
  getApiKeys: () => fetchWithAuth('/api/dashboard/keys'),
  createApiKey: (data: any) => fetchWithAuth('/api/dashboard/keys', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteApiKey: (id: string) => fetchWithAuth(`/api/dashboard/keys/${id}`, {
    method: 'DELETE'
  }),
  
  // Service monitoring
  getServices: () => fetchWithAuth('/api/dashboard/services'),
  
  // Logs
  getLogs: (params?: any) => fetchWithAuth('/api/dashboard/logs?' + new URLSearchParams(params)),
  
  // Analytics
  getAnalytics: (timeframe: string) => fetchWithAuth(`/api/dashboard/analytics?timeframe=${timeframe}`)
}
```

### 3. Dashboard Layout

Create `src/app/(dashboard)/layout.tsx`:

```typescript
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Deployment

### Development Deployment

For development alongside your AI Gateway:

1. **Update Caddy** to proxy dashboard:

```caddy
# In Caddyfile
@dashboard {
    path /dashboard /dashboard/*
}

handle @dashboard {
    reverse_proxy localhost:3000
}
```

2. **Run dashboard**:
```bash
npm run dev
```

### Production Deployment

1. **Build the dashboard**:
```bash
npm run build
```

2. **Run with PM2**:
```bash
npm install -g pm2
pm2 start npm --name "dashboard" -- start
pm2 save
pm2 startup
```

3. **Or use Docker**:

Create `dashboard/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000
CMD ["npm", "start"]
```

Add to `docker-compose.yml`:

```yaml
dashboard:
  build: ./dashboard
  container_name: ai-gateway-dashboard
  restart: unless-stopped
  ports:
    - "3000:3000"
  environment:
    - NEXTAUTH_URL=https://selfmind.dev
    - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    - API_GATEWAY_URL=http://api-gatekeeper:8080
  depends_on:
    - api-gatekeeper
```

## Security Considerations

1. **Authentication**: Always use HTTPS in production
2. **API Keys**: Dashboard auth is separate from API keys
3. **CORS**: Configure CORS if dashboard is on different domain
4. **Rate Limiting**: Implement rate limiting for dashboard endpoints
5. **Audit Logging**: Log all dashboard admin actions

## Troubleshooting

### Common Issues

1. **"Cannot connect to API Gateway"**
   - Check if API Gateway is running: `docker compose ps`
   - Verify API_GATEWAY_URL in .env.local
   - Check CORS settings if different domain

2. **"Authentication not working"**
   - Ensure NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Verify user credentials

3. **"Dashboard not loading"**
   - Check Node version: `node --version` (should be 18+)
   - Clear .next cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

1. **Customize UI**: Modify components in `src/components/ui`
2. **Add Features**: Implement pending features from todo list
3. **Testing**: Add tests with Jest and React Testing Library
4. **Monitoring**: Integrate with your monitoring solution
5. **CI/CD**: Set up automated deployment pipeline