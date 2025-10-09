"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  // Don't render anything if not admin
  if (!isAdmin) {
    return null;
  }

  // Render children if admin
  return <>{children}</>;
}