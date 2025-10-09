"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { 
  Activity, 
  Check, 
  X, 
  RefreshCw, 
  Clock,
  Cpu,
  MemoryStick,
  Network,
  ChevronLeft,
  AlertCircle,
  Zap
} from "lucide-react";
import toast from "react-hot-toast";

interface ServiceStatus {
  name: string;
  endpoint: string;
  status: "online" | "offline" | "degraded";
  responseTime: number;
  uptime: number;
  requestsPerMinute: number;
  errorRate: number;
  lastChecked: Date;
  details?: {
    version?: string;
    model?: string;
    cpu?: number;
    memory?: number;
  };
}

export default function ServiceMonitorPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    checkServices();
    
    // Auto-refresh every 10 seconds
    const interval = autoRefresh ? setInterval(checkServices, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdmin, router, autoRefresh]);

  const checkServices = async () => {
    try {
      // Check each service
      const serviceChecks = [
        { name: "Chat AI (Ollama)", endpoint: "http://localhost:11434", path: "/api/tags" },
        { name: "Text to Speech", endpoint: "http://localhost:8090", path: "/" },
        { name: "Image Generation", endpoint: "http://localhost:7860", path: "/" },
        { name: "Speech to Text", endpoint: "http://localhost:8092", path: "/" },
      ];

      const results = await Promise.all(
        serviceChecks.map(async (service) => {
          const startTime = Date.now();
          try {
            const res = await fetch(service.endpoint + service.path, {
              method: "GET",
              signal: AbortSignal.timeout(5000),
            });
            
            const responseTime = Date.now() - startTime;
            const status = res.ok ? "online" : "degraded";
            
            return {
              name: service.name,
              endpoint: service.endpoint,
              status,
              responseTime,
              uptime: 99.9, // Mock data
              requestsPerMinute: Math.floor(Math.random() * 100) + 20,
              errorRate: Math.random() * 2,
              lastChecked: new Date(),
              details: {
                version: "1.0.0",
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
              }
            };
          } catch (error) {
            return {
              name: service.name,
              endpoint: service.endpoint,
              status: "offline" as const,
              responseTime: 0,
              uptime: 0,
              requestsPerMinute: 0,
              errorRate: 100,
              lastChecked: new Date(),
            };
          }
        })
      );

      setServices(results);
    } catch (error) {
      console.error("Failed to check services:", error);
      toast.error("Failed to check service status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "offline": return "text-red-500";
      case "degraded": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <Check className="w-5 h-5" />;
      case "offline": return <X className="w-5 h-5" />;
      case "degraded": return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <span className="gradient-accent text-gradient">Service Monitor</span>
                </h1>
                <p className="text-muted-foreground">Real-time health status of AI services</p>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">Auto-refresh</span>
                </label>
                
                <button
                  onClick={checkServices}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Services</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{services.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Online</span>
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">
                {services.filter(s => s.status === "online").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Response</span>
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">
                {services.length > 0 
                  ? Math.round(services.reduce((acc, s) => acc + s.responseTime, 0) / services.length)
                  : 0}ms
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total RPM</span>
                <Network className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">
                {services.reduce((acc, s) => acc + s.requestsPerMinute, 0)}
              </p>
            </motion.div>
          </div>

          {/* Services List */}
          {loading && services.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          service.status === "online" ? "bg-green-500/20" :
                          service.status === "offline" ? "bg-red-500/20" :
                          "bg-yellow-500/20"
                        }`}>
                          <span className={getStatusColor(service.status)}>
                            {getStatusIcon(service.status)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.endpoint}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className={`font-medium capitalize ${getStatusColor(service.status)}`}>
                            {service.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="font-medium">{service.responseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                          <p className="font-medium">{service.uptime}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Requests/min</p>
                          <p className="font-medium">{service.requestsPerMinute}</p>
                        </div>
                      </div>

                      {service.details && (
                        <div className="flex items-center gap-6 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-muted-foreground" />
                            <span>CPU: {service.details.cpu?.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MemoryStick className="w-4 h-4 text-muted-foreground" />
                            <span>Memory: {service.details.memory?.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Checked: {service.lastChecked.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}