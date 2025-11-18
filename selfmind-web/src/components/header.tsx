"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginModal } from "@/components/login-modal";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { themeConfig } from "@/lib/theme-config";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get theme-specific classes - use resolvedTheme to avoid hydration issues
  const currentTheme = mounted ? (resolvedTheme === 'light' ? 'light' : 'dark') : 'dark';
  const navbarTheme = themeConfig.navbar[currentTheme];
  const themeClasses = scrolled ? navbarTheme.solid : navbarTheme.transparent;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${themeClasses.logo}`}>SelfMind</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#services" className={`transition-colors ${themeClasses.link}`}>
                Services
              </Link>
              <Link href="#demo" className={`transition-colors ${themeClasses.link}`}>
                Demo
              </Link>
              <Link href="#features" className={`transition-colors ${themeClasses.link}`}>
                Features
              </Link>
              <Link href="/docs" className={`transition-colors ${themeClasses.link}`}>
                Docs
              </Link>
              <Link href="/playground" className={`transition-colors ${themeClasses.link}`}>
                Playground
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${themeClasses.button}`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
