"use client";

import { motion } from "framer-motion";
import { SparkleAnimation } from "@/components/sparkle-animation";
import { useState, useEffect } from "react";
import { LoginModal } from "@/components/login-modal";
import { useAuthStore } from "@/lib/auth-store";
import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { themeConfig } from "@/lib/theme-config";

export function HeroSection() {
  const [loginOpen, setLoginOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get theme-specific classes for hero section
  const currentTheme = mounted ? (resolvedTheme === 'light' ? 'light' : 'dark') : 'dark';
  const heroTheme = themeConfig.hero[currentTheme];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-hero animate-gradient" />
      
      {/* Sparkle Animation */}
      <SparkleAnimation />
      
      {/* Parallax Layers */}
      <div className="parallax-container absolute inset-0">
        <motion.div
          className="parallax-layer absolute inset-0"
          style={{ transform: "translateZ(-50px) scale(1.5)" }}
        >
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </motion.div>
        
        <motion.div
          className="parallax-layer absolute inset-0"
          style={{ transform: "translateZ(-25px) scale(1.25)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          <span className="gradient-hero text-gradient">
            Your Personal AI Universe
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${heroTheme.subheading}`}
        >
          Self-hosted AI services with enterprise-grade security. 
          Chat, generate images, convert text to speech, and more.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {user ? (
            <a
              href="#demo"
              className={`px-8 py-4 rounded-full font-medium transition-all ${heroTheme.primaryButton}`}
            >
              Try Demo
            </a>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className={`px-8 py-4 rounded-full font-medium transition-all ${heroTheme.primaryButton}`}
            >
              Get Started
            </button>
          )}
          
          <a
            href="#services"
            className={`px-8 py-4 border rounded-full font-medium transition-colors ${heroTheme.secondaryButton}`}
          >
            Explore Services
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`flex flex-col items-center gap-2 ${heroTheme.scrollIndicator}`}
        >
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}