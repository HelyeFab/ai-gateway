# SelfMind Dashboard Theme Guide

This guide documents the theme system used in the SelfMind Dashboard, including colors, typography, and styling patterns.

## Theme Configuration

All theme configuration is centralized in `/dashboard/src/lib/theme.ts`. This file exports:

- Color palettes (light/dark modes)
- Typography settings
- Spacing scale
- Border radius values
- Shadow definitions
- Gradients
- Animation settings
- Z-index scale

## Color System

### Pastel Color Palette

The dashboard uses a soft pastel color scheme with the following brand colors:

#### Light Theme
- **Primary**: Soft Purple `hsl(270 50% 75%)`
- **Secondary**: Soft Blue `hsl(210 50% 80%)`
- **Accent**: Soft Pink `hsl(340 45% 85%)`
- **Success**: Soft Green `hsl(120 40% 75%)`
- **Warning**: Soft Yellow `hsl(45 70% 75%)`
- **Info**: Soft Cyan `hsl(190 50% 75%)`
- **Destructive**: Soft Red `hsl(0 45% 75%)`

#### Dark Theme
- **Primary**: Deep Purple `hsl(270 40% 40%)`
- **Secondary**: Deep Blue `hsl(210 40% 35%)`
- **Accent**: Deep Pink `hsl(340 35% 45%)`
- **Success**: Deep Green `hsl(120 35% 40%)`
- **Warning**: Deep Yellow `hsl(45 60% 45%)`
- **Info**: Deep Cyan `hsl(190 40% 40%)`
- **Destructive**: Deep Red `hsl(0 35% 40%)`

## Typography

- **Font Family**: Manrope (Google Fonts)
- **Font Sizes**: 
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
  - 4xl: 36px

## Gradients

The theme includes pre-defined gradients for visual interest:

- **Primary Gradient**: Purple → Pink
- **Secondary Gradient**: Blue → Purple
- **Accent Gradient**: Pink → Blue
- **Success Gradient**: Green → Cyan
- **Warning Gradient**: Yellow → Pink
- **Info Gradient**: Cyan → Blue

### Usage Example:
```jsx
<h1 className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
  SelfMind Dashboard
</h1>
```

## Utility Classes

### Buttons
- `.btn-primary` - Primary gradient button
- `.btn-secondary` - Secondary gradient button
- `.btn-outline` - Outlined button with hover effect

### Cards
- `.card-base` - Standard card with soft shadow and border

### Inputs
- `.input-base` - Standard input field with focus states

### Status Indicators
- `.status-success` - Green status indicator
- `.status-warning` - Yellow status indicator
- `.status-error` - Red status indicator
- `.status-info` - Cyan status indicator

### Shadows
- `.shadow-soft` - Subtle shadow for cards
- `.shadow-soft-lg` - Larger subtle shadow

### Animations
- `.animate-fade-in` - Fade in animation
- `.animate-slide-up` - Slide up with fade animation

## Using the Theme in Components

### Import Theme Values
```typescript
import { theme, colors, gradients, shadows } from '@/lib/theme'

// Use in styles
const buttonStyle = {
  background: gradients.primary,
  boxShadow: shadows.soft,
}
```

### Using CSS Variables
All theme colors are available as CSS variables:
```css
.custom-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Gradient Text Effect
```jsx
<h1 className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
  Gradient Text
</h1>
```

## Theme Switching

The theme supports light/dark mode switching. CSS variables automatically update based on the `.dark` class on the root element.

```typescript
// Get CSS variables for a specific theme
import { getCSSVariables } from '@/lib/theme'

const lightVars = getCSSVariables('light')
const darkVars = getCSSVariables('dark')
```

## Best Practices

1. **Always use theme values** instead of hardcoded colors
2. **Use utility classes** when possible for consistency
3. **Leverage gradients** for visual interest on important elements
4. **Maintain the pastel aesthetic** when adding new colors
5. **Use soft shadows** to maintain the gentle appearance
6. **Test in both light and dark modes** when styling

## Extending the Theme

To add new colors or modify existing ones:

1. Update `/dashboard/src/lib/theme.ts`
2. Add corresponding CSS variables in `/dashboard/src/app/globals.css`
3. Create utility classes if needed
4. Document the changes in this guide

## Examples

### Card Component
```jsx
<div className="card-base p-6">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content with muted text.</p>
</div>
```

### Primary Button
```jsx
<button className="btn-primary px-6 py-3">
  Click Me
</button>
```

### Status Badge
```jsx
<span className="status-success px-3 py-1 rounded-full text-sm">
  Active
</span>
```