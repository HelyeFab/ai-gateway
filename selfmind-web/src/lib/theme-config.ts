export const themeConfig = {
  hero: {
    // Text colors for hero section
    light: {
      heading: "text-white", // White text on gradient background
      subheading: "text-white/90", // Slightly transparent white
      navLink: "text-white hover:text-white/80",
      navLinkScrolled: "text-foreground hover:text-primary",
      primaryButton: "bg-white text-primary hover:bg-white/90 shadow-lg",
      secondaryButton: "border-white/50 text-white hover:bg-white/10",
      scrollIndicator: "text-white/70",
    },
    dark: {
      heading: "text-white",
      subheading: "text-white/80",
      navLink: "text-white hover:text-white/80",
      navLinkScrolled: "text-foreground hover:text-primary",
      primaryButton: "bg-gradient-primary text-white hover:opacity-90 shadow-lg glow-primary",
      secondaryButton: "border-border text-white hover:bg-muted",
      scrollIndicator: "text-muted-foreground",
    }
  },
  navbar: {
    light: {
      // When not scrolled (transparent background)
      transparent: {
        logo: "text-white",
        link: "text-white hover:text-white/80",
        button: "bg-white/20 text-white border-white/30 hover:bg-white/30",
      },
      // When scrolled (solid background)
      solid: {
        logo: "text-foreground",
        link: "text-foreground hover:text-primary",
        button: "bg-gradient-primary text-white hover:opacity-90",
      }
    },
    dark: {
      transparent: {
        logo: "text-white",
        link: "text-white hover:text-white/80",
        button: "bg-white/10 text-white border-white/20 hover:bg-white/20",
      },
      solid: {
        logo: "text-foreground",
        link: "text-foreground hover:text-primary",
        button: "bg-gradient-primary text-white hover:opacity-90",
      }
    }
  }
};

// Helper hook to get theme-aware classes
export function useThemeClasses() {
  // This will be implemented in the components
  return themeConfig;
}