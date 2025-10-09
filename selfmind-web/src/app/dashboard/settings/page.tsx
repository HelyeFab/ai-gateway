"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { 
  Settings,
  Globe,
  Shield,
  Cpu,
  Database,
  Bell,
  ChevronLeft,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Zap,
  Link
} from "lucide-react";
import toast from "react-hot-toast";

interface ServiceConfig {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  rateLimitPerMinute: number;
}

interface SystemSettings {
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
  };
  security: {
    requireApiKey: boolean;
    ipWhitelist: string[];
    maxRequestsPerMinute: number;
    enableThreatDetection: boolean;
    blockSuspiciousIPs: boolean;
  };
  notifications: {
    emailAlerts: boolean;
    alertEmail: string;
    alertOnServiceDown: boolean;
    alertOnHighErrorRate: boolean;
    errorRateThreshold: number;
  };
  logging: {
    logLevel: "debug" | "info" | "warn" | "error";
    retentionDays: number;
    logToFile: boolean;
    logToConsole: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("services");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [services, setServices] = useState<ServiceConfig[]>([
    {
      id: "ollama",
      name: "Ollama Chat API",
      endpoint: "http://localhost:11434",
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimitPerMinute: 100
    },
    {
      id: "tts",
      name: "Edge TTS",
      endpoint: "http://edge-tts:8090",
      enabled: true,
      timeout: 60000,
      maxRetries: 2,
      rateLimitPerMinute: 50
    },
    {
      id: "image",
      name: "Stable Diffusion",
      endpoint: "http://localhost:7860",
      enabled: true,
      timeout: 120000,
      maxRetries: 1,
      rateLimitPerMinute: 20
    },
    {
      id: "whisper",
      name: "Whisper ASR",
      endpoint: "http://localhost:8092",
      enabled: true,
      timeout: 60000,
      maxRetries: 2,
      rateLimitPerMinute: 30
    }
  ]);

  const [settings, setSettings] = useState<SystemSettings>({
    cors: {
      enabled: true,
      allowedOrigins: ["https://selfmind.dev", "http://localhost:3000"]
    },
    security: {
      requireApiKey: true,
      ipWhitelist: [],
      maxRequestsPerMinute: 1000,
      enableThreatDetection: true,
      blockSuspiciousIPs: true
    },
    notifications: {
      emailAlerts: false,
      alertEmail: "",
      alertOnServiceDown: true,
      alertOnHighErrorRate: true,
      errorRateThreshold: 10
    },
    logging: {
      logLevel: "info",
      retentionDays: 30,
      logToFile: true,
      logToConsole: true
    }
  });

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [isAdmin, authLoading, router]);

  const handleServiceUpdate = (id: string, field: keyof ServiceConfig, value: any) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const handleSettingsUpdate = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      const res = await fetch(service.endpoint, {
        method: "GET",
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        toast.success(`${service.name} is connected`);
      } else {
        toast.error(`${service.name} returned status ${res.status}`);
      }
    } catch (error) {
      toast.error(`Failed to connect to ${service.name}`);
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
                  <span className="gradient-primary text-gradient">Settings</span>
                </h1>
                <p className="text-muted-foreground">Configure your AI Gateway settings</p>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Settings
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {[
              { id: "services", label: "Services", icon: Cpu },
              { id: "security", label: "Security", icon: Shield },
              { id: "cors", label: "CORS", icon: Globe },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "logging", label: "Logging", icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-primary text-white"
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Services Configuration */}
          {activeTab === "services" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-4">Service Configuration</h2>
              
              {services.map((service) => (
                <div key={service.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        service.enabled ? "bg-green-500" : "bg-red-500"
                      }`} />
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestConnection(service.id)}
                        className="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
                      >
                        Test Connection
                      </button>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.enabled}
                          onChange={(e) => handleServiceUpdate(service.id, "enabled", e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Enabled</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                      <input
                        type="text"
                        value={service.endpoint}
                        onChange={(e) => handleServiceUpdate(service.id, "endpoint", e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
                      <input
                        type="number"
                        value={service.timeout}
                        onChange={(e) => handleServiceUpdate(service.id, "timeout", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Retries</label>
                      <input
                        type="number"
                        value={service.maxRetries}
                        onChange={(e) => handleServiceUpdate(service.id, "maxRetries", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Rate Limit (req/min)</label>
                      <input
                        type="number"
                        value={service.rateLimitPerMinute}
                        onChange={(e) => handleServiceUpdate(service.id, "rateLimitPerMinute", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
              
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.requireApiKey}
                    onChange={(e) => handleSettingsUpdate("security", "requireApiKey", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Require API Key</p>
                    <p className="text-sm text-muted-foreground">All requests must include a valid API key</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enableThreatDetection}
                    onChange={(e) => handleSettingsUpdate("security", "enableThreatDetection", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Enable Threat Detection</p>
                    <p className="text-sm text-muted-foreground">Automatically detect and log suspicious activities</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.blockSuspiciousIPs}
                    onChange={(e) => handleSettingsUpdate("security", "blockSuspiciousIPs", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Block Suspicious IPs</p>
                    <p className="text-sm text-muted-foreground">Automatically block IPs with suspicious behavior</p>
                  </div>
                </label>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Global Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={settings.security.maxRequestsPerMinute}
                    onChange={(e) => handleSettingsUpdate("security", "maxRequestsPerMinute", parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">IP Whitelist (one per line)</label>
                  <textarea
                    value={settings.security.ipWhitelist.join("\n")}
                    onChange={(e) => handleSettingsUpdate("security", "ipWhitelist", e.target.value.split("\n").filter(ip => ip.trim()))}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="192.168.1.1&#10;10.0.0.0/16"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* CORS Settings */}
          {activeTab === "cors" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-4">CORS Settings</h2>
              
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cors.enabled}
                    onChange={(e) => handleSettingsUpdate("cors", "enabled", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Enable CORS</p>
                    <p className="text-sm text-muted-foreground">Allow cross-origin requests from specified domains</p>
                  </div>
                </label>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Allowed Origins (one per line)</label>
                  <textarea
                    value={settings.cors.allowedOrigins.join("\n")}
                    onChange={(e) => handleSettingsUpdate("cors", "allowedOrigins", e.target.value.split("\n").filter(origin => origin.trim()))}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={6}
                    placeholder="https://selfmind.dev&#10;http://localhost:3000"
                    disabled={!settings.cors.enabled}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Use * to allow all origins (not recommended for production)
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
              
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => handleSettingsUpdate("notifications", "emailAlerts", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Enable Email Alerts</p>
                    <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                  </div>
                </label>
                
                {settings.notifications.emailAlerts && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Alert Email</label>
                      <input
                        type="email"
                        value={settings.notifications.alertEmail}
                        onChange={(e) => handleSettingsUpdate("notifications", "alertEmail", e.target.value)}
                        className="w-full max-w-md px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="admin@selfmind.ai"
                      />
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.alertOnServiceDown}
                        onChange={(e) => handleSettingsUpdate("notifications", "alertOnServiceDown", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Alert on Service Down</p>
                        <p className="text-sm text-muted-foreground">Send alert when any service goes offline</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.alertOnHighErrorRate}
                        onChange={(e) => handleSettingsUpdate("notifications", "alertOnHighErrorRate", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Alert on High Error Rate</p>
                        <p className="text-sm text-muted-foreground">Send alert when error rate exceeds threshold</p>
                      </div>
                    </label>
                    
                    {settings.notifications.alertOnHighErrorRate && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Error Rate Threshold (%)</label>
                        <input
                          type="number"
                          value={settings.notifications.errorRateThreshold}
                          onChange={(e) => handleSettingsUpdate("notifications", "errorRateThreshold", parseInt(e.target.value))}
                          className="w-full max-w-xs px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="1"
                          max="100"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Logging Settings */}
          {activeTab === "logging" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-4">Logging Settings</h2>
              
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Log Level</label>
                  <select
                    value={settings.logging.logLevel}
                    onChange={(e) => handleSettingsUpdate("logging", "logLevel", e.target.value)}
                    className="w-full max-w-xs px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Log Retention (days)</label>
                  <input
                    type="number"
                    value={settings.logging.retentionDays}
                    onChange={(e) => handleSettingsUpdate("logging", "retentionDays", parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    max="365"
                  />
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.logging.logToFile}
                    onChange={(e) => handleSettingsUpdate("logging", "logToFile", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Log to File</p>
                    <p className="text-sm text-muted-foreground">Save logs to file system</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.logging.logToConsole}
                    onChange={(e) => handleSettingsUpdate("logging", "logToConsole", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Log to Console</p>
                    <p className="text-sm text-muted-foreground">Output logs to console/stdout</p>
                  </div>
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}