# 🎨 Landing Page Design Specification

## Vision

Create a stunning, modern landing page for selfmind.dev that showcases the power of self-hosted AI services with beautiful animations and an intuitive user experience.

## Design Concept

### Theme: "Neural Network Garden"
A visual metaphor combining organic growth with AI neural networks, representing the convergence of natural intelligence and artificial intelligence.

## Hero Section

### Animation Concepts

#### Option 1: Particle Neural Network
```typescript
// Animated particles that form neural connections
- Floating particles that connect when near each other
- Glowing lines form between particles creating a neural network
- Particles respond to mouse movement
- Colors: Gradient from deep purple to electric blue
```

#### Option 2: Morphing Blob with Code Rain
```typescript
// Organic blob that morphs with code/data flowing through it
- Large gradient blob that continuously morphs
- Matrix-style code rain inside the blob
- Blob responds to scroll and mouse position
- Colors: Dark background with neon accents
```

#### Option 3: 3D Wave Field (Recommended)
```typescript
// Three.js powered wave field representing data flow
- Undulating 3D mesh with vertex displacement
- Particles flowing along the waves
- Interactive: waves respond to mouse
- Colors: Deep space blue with cyan highlights
```

### Hero Content
```
Headline: "Your Personal AI Universe"
Subheadline: "Self-hosted AI services with enterprise-grade security"
CTA Buttons: [Get API Key] [View Documentation]
```

## Page Sections

### 1. Hero Section (100vh)
```jsx
<Hero>
  <AnimatedBackground />
  <Content>
    <Title>Your Personal AI Universe</Title>
    <Subtitle>Self-hosted AI services with enterprise-grade security</Subtitle>
    <CTAButtons>
      <PrimaryButton>Get Started</PrimaryButton>
      <SecondaryButton>Documentation</SecondaryButton>
    </CTAButtons>
  </Content>
  <ScrollIndicator />
</Hero>
```

### 2. Services Showcase
Interactive cards with hover animations showing each AI service:

```jsx
<ServicesGrid>
  <ServiceCard 
    icon={<BrainIcon />}
    title="Language Models"
    description="Ollama-powered LLMs"
    endpoint="/chat/api"
    glowColor="purple"
  />
  <ServiceCard 
    icon={<SpeakerIcon />}
    title="Text to Speech"
    description="Natural voice synthesis"
    endpoint="/tts/api"
    glowColor="blue"
  />
  <ServiceCard 
    icon={<ImageIcon />}
    title="Image Generation"
    description="Stable Diffusion creativity"
    endpoint="/image/api"
    glowColor="green"
  />
  <ServiceCard 
    icon={<MicIcon />}
    title="Speech to Text"
    description="Whisper transcription"
    endpoint="/whisper/api"
    glowColor="orange"
  />
</ServicesGrid>
```

### 3. Live Demo Section
Interactive playground to test APIs directly:

```jsx
<DemoSection>
  <TabPanel>
    <Tab>Chat</Tab>
    <Tab>TTS</Tab>
    <Tab>Image</Tab>
  </TabPanel>
  <DemoContent>
    {/* Live API testing interface */}
  </DemoContent>
</DemoSection>
```

### 4. Security Features
Animated shield with features orbiting around it:

```jsx
<SecuritySection>
  <AnimatedShield>
    <OrbitingFeature>API Key Auth</OrbitingFeature>
    <OrbitingFeature>Rate Limiting</OrbitingFeature>
    <OrbitingFeature>Audit Logging</OrbitingFeature>
    <OrbitingFeature>VPN Support</OrbitingFeature>
  </AnimatedShield>
</SecuritySection>
```

### 5. Metrics Dashboard Preview
Animated charts showing system performance:

```jsx
<MetricsPreview>
  <AnimatedChart type="requests" />
  <AnimatedChart type="uptime" />
  <AnimatedChart type="response-time" />
</MetricsPreview>
```

### 6. Getting Started
Step-by-step guide with progress animation:

```jsx
<GettingStarted>
  <Step number={1} title="Get API Key">
    Request your secure API key
  </Step>
  <Step number={2} title="Choose Service">
    Select from our AI services
  </Step>
  <Step number={3} title="Make Request">
    Start building with our APIs
  </Step>
</GettingStarted>
```

### 7. Footer
Minimal footer with essential links:

```jsx
<Footer>
  <Links>
    <Link>Documentation</Link>
    <Link>API Reference</Link>
    <Link>Dashboard</Link>
    <Link>GitHub</Link>
  </Links>
  <Copyright>© 2025 SelfMind AI Gateway</Copyright>
</Footer>
```

## Color Palette

### Primary Colors
```css
--primary-dark: #0a0a0a;      /* Deep space black */
--primary-light: #1a1a2e;     /* Dark blue */
--accent-1: #16213e;          /* Navy blue */
--accent-2: #0f3460;          /* Ocean blue */
```

### Gradient Accents
```css
--gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--gradient-glow: linear-gradient(135deg, #00ff88 0%, #00ffff 100%);
```

### Neon Effects
```css
--neon-blue: #00d4ff;
--neon-purple: #bd00ff;
--neon-green: #00ff88;
--glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
```

## Typography

### Font Stack
```css
--font-heading: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes
```css
--text-hero: clamp(3rem, 8vw, 6rem);
--text-h1: clamp(2rem, 5vw, 3.5rem);
--text-h2: clamp(1.5rem, 4vw, 2.5rem);
--text-body: 1.125rem;
```

## Animations

### Micro-interactions
- Buttons: Magnetic hover effect
- Cards: 3D tilt on hover
- Links: Underline reveal animation
- Icons: Subtle rotation on hover

### Page Transitions
- Sections: Fade in on scroll with parallax
- Elements: Stagger animation for lists
- Loading: Skeleton screens with shimmer

### Performance Considerations
- Use CSS transforms over position changes
- Implement lazy loading for heavy animations
- Provide reduced motion alternatives
- Optimize Three.js scenes for mobile

## Responsive Design

### Breakpoints
```css
--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### Mobile Optimizations
- Simplified hero animation
- Stack service cards vertically
- Reduce particle count
- Touch-friendly interactions

## Implementation Technologies

### Core Stack
- **Next.js 14**: React framework
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Three.js**: 3D graphics
- **GSAP**: Complex animations

### Animation Libraries
```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.96.0",
    "framer-motion": "^11.0.0",
    "gsap": "^3.12.0",
    "lottie-react": "^2.4.0"
  }
}
```

## Accessibility

### Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Reduced motion option
- High contrast mode

### Implementation
```jsx
// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Provide motion toggle
<MotionToggle />
```

## SEO Optimization

### Meta Tags
```jsx
<Head>
  <title>SelfMind AI Gateway - Self-Hosted AI Services</title>
  <meta name="description" content="Enterprise-grade self-hosted AI services including LLMs, TTS, image generation, and speech recognition with secure API access." />
  <meta property="og:image" content="/og-image.png" />
  {/* Schema.org markup for API service */}
</Head>
```

### Performance Targets
- Lighthouse Score: 95+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## Content Guidelines

### Tone of Voice
- Professional yet approachable
- Technical but accessible
- Confident and innovative
- Security-focused

### Key Messages
1. "Your AI, Your Control"
2. "Enterprise Security, Personal Freedom"
3. "All Your AI Services, One Gateway"
4. "Self-Hosted, Professionally Managed"

## Future Enhancements

### Phase 2 Features
- Dark/light mode toggle
- Internationalization
- Blog/updates section
- Community showcase
- Pricing calculator

### Phase 3 Features
- Interactive tutorials
- Video backgrounds
- AR/VR demos
- Voice-controlled navigation