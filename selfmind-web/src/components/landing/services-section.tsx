"use client";

import { motion } from "framer-motion";
import { ParallaxSection } from "@/components/parallax-section";
import { 
  MessageSquare, 
  Mic, 
  Image, 
  AudioLines,
  Sparkles,
  Zap
} from "lucide-react";

const services = [
  {
    id: "chat",
    title: "Language Models",
    description: "Ollama-powered LLMs for intelligent conversations",
    icon: MessageSquare,
    color: "primary",
    endpoint: "/chat/api",
    features: ["Multiple models", "Context retention", "Fast responses"]
  },
  {
    id: "tts",
    title: "Text to Speech",
    description: "Natural voice synthesis with multiple languages",
    icon: AudioLines,
    color: "secondary",
    endpoint: "/tts/api",
    features: ["40+ voices", "Multiple languages", "Adjustable speed"]
  },
  {
    id: "image",
    title: "Image Generation",
    description: "Create stunning visuals with Stable Diffusion",
    icon: Image,
    color: "accent",
    endpoint: "/image/api",
    features: ["High quality", "Custom styles", "Fast generation"]
  },
  {
    id: "stt",
    title: "Speech to Text",
    description: "Accurate transcription powered by Whisper",
    icon: Mic,
    color: "primary",
    endpoint: "/whisper/api",
    features: ["Multi-language", "High accuracy", "Real-time"]
  }
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-4">
        <ParallaxSection offset={30} className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-secondary text-gradient">
              AI Services at Your Command
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Powerful AI capabilities, self-hosted and secure. No cloud dependencies.
          </motion.p>
        </ParallaxSection>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-6xl mx-auto mb-24">
          {services.map((service, index) => (
            <ParallaxSection key={service.id} offset={20 + index * 10}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-${service.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur-xl`} />
                
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <code className="px-2 py-1 bg-muted rounded">{service.endpoint}</code>
                  </div>
                  
                  <div className="space-y-2">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </motion.div>
            </ParallaxSection>
          ))}
        </div>
      </div>
    </section>
  );
}