import { Header } from "@/components/header";
import { HeroSection } from "@/components/landing/hero-section";
import { ServicesSection } from "@/components/landing/services-section";
import { DemoSection } from "@/components/landing/demo-section";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <DemoSection />
    </main>
  );
}