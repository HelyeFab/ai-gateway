"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function SparkleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Create particles
    const createParticle = (): Particle => {
      const maxLife = 150 + Math.random() * 150;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.5,
        size: Math.random() * 2 + 1,
        opacity: 0,
        life: 0,
        maxLife,
      };
    };

    // Initialize particles
    const particleCount = Math.floor((canvas.width * canvas.height) / 10000);
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        particle.life++;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Calculate opacity based on life
        if (particle.life < 30) {
          particle.opacity = particle.life / 30;
        } else if (particle.life > particle.maxLife - 30) {
          particle.opacity = (particle.maxLife - particle.life) / 30;
        } else {
          particle.opacity = 1;
        }

        // Sparkle effect
        const sparkle = Math.sin((particle.life / particle.maxLife) * Math.PI * 8) * 0.5 + 0.5;
        particle.opacity *= sparkle;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity * 0.8;
        
        // Create gradient for sparkle effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
        
        ctx.restore();

        // Reset particle if it goes off screen or dies
        if (
          particle.x < -10 || particle.x > canvas.width + 10 ||
          particle.y < -10 || particle.y > canvas.height + 10 ||
          particle.life > particle.maxLife
        ) {
          particlesRef.current[index] = createParticle();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 1,
        opacity: 0.6,
        mixBlendMode: "screen"
      }}
    />
  );
}