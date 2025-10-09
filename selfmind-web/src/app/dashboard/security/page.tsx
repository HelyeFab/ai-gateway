"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Search,
  Filter,
  Download,
  XCircle
} from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: string;
  event: string;
  details: string;
  user?: string;
  ip?: string;
  service?: string;
}

export default function SecurityPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchLogs();
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/dashboard/logs?limit=200&level=${filterLevel}`, {
        headers: {
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        // Mock data
        setLogs([
          {
            timestamp: new Date().toISOString(),
            level: "INFO",
            event: "API_REQUEST",
            details: "User authenticated successfully | Service: chat | Path: /chat/api/generate"
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: "ERROR",
            event: "AUTH_FAILED",
            details: "Invalid API key attempted | IP: 192.168.1.100 | Key: sk_test_xxx..."
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: "WARNING",
            event: "RATE_LIMIT",
            details: "Rate limit exceeded | User: john@example.com | Limit: 100/hour"
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "WARNING":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "SUCCESS":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const threatSummary = {
    failed_auth: logs.filter(log => log.event === "AUTH_FAILED").length,
    rate_limits: logs.filter(log => log.event === "RATE_LIMIT").length,
    errors: logs.filter(log => log.level === "ERROR").length,
    suspicious: logs.filter(log => 
      log.event === "AUTH_FAILED" || 
      log.event === "RATE_LIMIT" || 
      log.event === "INVALID_REQUEST"
    ).length
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
                  <span className="gradient-primary text-gradient">Security Center</span>
                </h1>
                <p className="text-muted-foreground">Monitor security events and audit logs</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? "bg-primary text-white" 
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
                  Auto Refresh
                </button>
                
                <button
                  onClick={fetchLogs}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Threat Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed Auth</p>
                  <p className="text-2xl font-bold">{threatSummary.failed_auth}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limits</p>
                  <p className="text-2xl font-bold">{threatSummary.rate_limits}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold">{threatSummary.errors}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suspicious</p>
                  <p className="text-2xl font-bold">{threatSummary.suspicious}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Levels</option>
                <option value="ERROR">Errors Only</option>
                <option value="WARNING">Warnings</option>
                <option value="INFO">Info</option>
              </select>
            </div>
            
            <button
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>

          {/* Logs */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No security events found</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={`${log.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className={`bg-card border rounded-lg p-4 ${getLogColor(log.level).split(' ')[2]}`}
                  >
                    <div className="flex items-start gap-3">
                      {getLogIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getLogColor(log.level)}`}>
                            {log.level}
                          </span>
                          <span className="text-sm font-medium">{log.event}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}