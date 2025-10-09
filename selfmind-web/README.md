# SelfMind Web - Landing Page & Dashboard

A stunning web interface for the SelfMind AI Gateway featuring:
- 🎨 Beautiful landing page with parallax effects and sparkle animations
- 🔐 Firebase authentication with Google sign-in
- 👤 User profiles with avatar support
- 🛡️ Admin dashboard (restricted to emmanuelfabiani23@gmail.com)
- 🌓 Dark/light theme support
- 🔑 Temporary API key generation for demos

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Copy your Firebase config to `.env.local`
   - Add your Firebase service account JSON to the API gateway

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Features

### Landing Page
- Stunning hero section with animated gradients and sparkles
- Parallax scrolling effects
- Interactive service showcase
- Live API demos with temporary keys
- Responsive design

### Authentication
- Email/password authentication
- Google OAuth integration
- Automatic admin detection
- Secure session management

### User Experience
- User menu with avatar display
- Theme toggle (light/dark)
- Smooth animations
- Toast notifications

### Admin Dashboard
- Visible only to admin email
- Full AI Gateway management
- Password management
- Service configuration

## Environment Variables

Create `.env.local` with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Firebase Auth
- Zustand
- React Hot Toast