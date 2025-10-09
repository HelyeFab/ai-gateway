"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Power,
  Clock,
  Shield,
  ChevronLeft,
  Search,
  Filter,
  Download
} from "lucide-react";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  key: string;
  user: string;
  service: string;
  description: string;
  enabled: boolean;
  created_at: string;
  expires_at: string | null;
  last_used: string | null;
  request_count: number;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState("all");

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchApiKeys();
  }, [isAdmin, authLoading, router]);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/dashboard/keys", {
        headers: {
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      } else {
        // Mock data for now
        setApiKeys([
          {
            id: "1",
            key: "sk_live_" + Math.random().toString(36).substring(7),
            user: "john.doe@example.com",
            service: "all",
            description: "Production API Key",
            enabled: true,
            created_at: new Date().toISOString(),
            expires_at: null,
            last_used: new Date().toISOString(),
            request_count: 1247
          },
          {
            id: "2",
            key: "sk_test_" + Math.random().toString(36).substring(7),
            user: "jane.smith@example.com",
            service: "chat",
            description: "Test key for chat API",
            enabled: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
            last_used: new Date().toISOString(),
            request_count: 523
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (formData: any) => {
    try {
      const res = await fetch("/api/dashboard/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newKey = await res.json();
        setApiKeys([newKey, ...apiKeys]);
        toast.success("API key created successfully");
        setShowCreateModal(false);
      } else {
        toast.error("Failed to create API key");
      }
    } catch (error) {
      toast.error("Failed to create API key");
    }
  };

  const handleToggleKey = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/keys/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        setApiKeys(apiKeys.map(key => 
          key.id === id ? { ...key, enabled } : key
        ));
        toast.success(`API key ${enabled ? "enabled" : "disabled"}`);
      }
    } catch (error) {
      toast.error("Failed to update API key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const res = await fetch(`/api/dashboard/keys/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
      });

      if (res.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== id));
        toast.success("API key deleted");
      }
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterService === "all" || key.service === filterService;
    return matchesSearch && matchesFilter;
  });

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
                  <span className="gradient-primary text-gradient">API Key Management</span>
                </h1>
                <p className="text-muted-foreground">Create and manage API keys for your services</p>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Create New Key
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by user or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Services</option>
                <option value="chat">Chat API</option>
                <option value="tts">TTS API</option>
                <option value="image">Image API</option>
                <option value="whisper">Whisper API</option>
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

          {/* API Keys List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No API keys found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKeys.map((apiKey) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="font-mono text-sm bg-muted px-3 py-1 rounded">
                          {apiKey.key}
                        </code>
                        <button
                          onClick={() => handleCopyKey(apiKey.key)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          apiKey.enabled 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}>
                          {apiKey.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {apiKey.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>User: {apiKey.user}</span>
                        <span>Service: {apiKey.service}</span>
                        <span>Requests: {apiKey.request_count}</span>
                        {apiKey.expires_at && (
                          <span>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleKey(apiKey.id, !apiKey.enabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          apiKey.enabled 
                            ? "bg-muted hover:bg-red-500/20 hover:text-red-500" 
                            : "bg-muted hover:bg-green-500/20 hover:text-green-500"
                        }`}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteKey(apiKey.id)}
                        className="p-2 bg-muted hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateKeyModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateKey}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function CreateKeyModal({ onClose, onCreate }: { 
  onClose: () => void; 
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    user: "",
    service: "all",
    description: "",
    expires_in: "0"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Create API Key</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User Email</label>
            <input
              type="email"
              required
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Service</label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Services</option>
              <option value="chat">Chat API Only</option>
              <option value="tts">TTS API Only</option>
              <option value="image">Image API Only</option>
              <option value="whisper">Whisper API Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Production API key for mobile app"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Expiration</label>
            <select
              value={formData.expires_in}
              onChange={(e) => setFormData({ ...formData, expires_in: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="0">Never</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Key
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}