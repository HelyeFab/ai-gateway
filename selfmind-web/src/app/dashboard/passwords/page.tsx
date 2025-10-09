"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Plus, 
  Copy, 
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ChevronLeft,
  Search,
  Key,
  Shield,
  AlertCircle,
  RefreshCw,
  Check
} from "lucide-react";
import toast from "react-hot-toast";

interface ServicePassword {
  id: string;
  service: string;
  username: string;
  password: string;
  description: string;
  lastUpdated: string;
  category: "database" | "api" | "service" | "admin";
  strength: "weak" | "medium" | "strong";
}

export default function PasswordsPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [passwords, setPasswords] = useState<ServicePassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<ServicePassword | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchPasswords();
  }, [isAdmin, authLoading, router]);

  const fetchPasswords = async () => {
    try {
      // Mock data for demonstration
      const mockPasswords: ServicePassword[] = [
        {
          id: "1",
          service: "PostgreSQL Database",
          username: "postgres",
          password: "super_secure_password_123!",
          description: "Main database for AI Gateway",
          lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: "database",
          strength: "strong"
        },
        {
          id: "2",
          service: "Redis Cache",
          username: "default",
          password: "redis_auth_token_456",
          description: "Session and cache storage",
          lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          category: "database",
          strength: "medium"
        },
        {
          id: "3",
          service: "Ollama API",
          username: "api_user",
          password: "ollama_secret_key_789",
          description: "Authentication for Ollama service",
          lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: "api",
          strength: "strong"
        },
        {
          id: "4",
          service: "Admin Portal",
          username: "admin@selfmind.ai",
          password: "admin_portal_pass_2024",
          description: "Main admin account",
          lastUpdated: new Date().toISOString(),
          category: "admin",
          strength: "strong"
        },
        {
          id: "5",
          service: "Docker Registry",
          username: "docker_user",
          password: "weak_password",
          description: "Private Docker registry access",
          lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          category: "service",
          strength: "weak"
        }
      ];
      
      setPasswords(mockPasswords);
    } catch (error) {
      console.error("Failed to fetch passwords:", error);
      toast.error("Failed to load passwords");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (formData: Partial<ServicePassword>) => {
    try {
      const newPassword: ServicePassword = {
        id: Date.now().toString(),
        service: formData.service!,
        username: formData.username!,
        password: formData.password!,
        description: formData.description!,
        category: formData.category!,
        lastUpdated: new Date().toISOString(),
        strength: calculatePasswordStrength(formData.password!)
      };
      
      setPasswords([newPassword, ...passwords]);
      toast.success("Password saved successfully");
      setShowCreateModal(false);
    } catch (error) {
      toast.error("Failed to save password");
    }
  };

  const handleUpdatePassword = async (id: string, formData: Partial<ServicePassword>) => {
    try {
      setPasswords(passwords.map(pass => 
        pass.id === id 
          ? { 
              ...pass, 
              ...formData, 
              lastUpdated: new Date().toISOString(),
              strength: formData.password ? calculatePasswordStrength(formData.password) : pass.strength
            } 
          : pass
      ));
      toast.success("Password updated successfully");
      setShowEditModal(false);
    } catch (error) {
      toast.error("Failed to update password");
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (!confirm("Are you sure you want to delete this password?")) return;
    
    try {
      setPasswords(passwords.filter(pass => pass.id !== id));
      toast.success("Password deleted");
    } catch (error) {
      toast.error("Failed to delete password");
    }
  };

  const calculatePasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (password.length < 8) return "weak";
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (strength >= 3 && password.length >= 12) return "strong";
    if (strength >= 2 && password.length >= 8) return "medium";
    return "weak";
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords({ ...showPasswords, [id]: !showPasswords[id] });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const filteredPasswords = passwords.filter(pass => {
    const matchesSearch = pass.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pass.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pass.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || pass.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "weak": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "database": return "🗄️";
      case "api": return "🔌";
      case "service": return "⚙️";
      case "admin": return "👤";
      default: return "🔑";
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
                  <span className="gradient-secondary text-gradient">Password Manager</span>
                </h1>
                <p className="text-muted-foreground">Securely manage service passwords and credentials</p>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Add Password
              </button>
            </div>
          </div>

          {/* Security Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">Security Notice</p>
              <p className="text-muted-foreground">
                {passwords.filter(p => p.strength === "weak").length} passwords need to be updated. 
                Consider using strong passwords with at least 12 characters, including uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="service">Service</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Passwords List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPasswords.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No passwords found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPasswords.map((password, index) => (
                <motion.div
                  key={password.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(password.category)}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{password.service}</h3>
                          <p className="text-sm text-muted-foreground">{password.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Username:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{password.username}</code>
                          <button
                            onClick={() => copyToClipboard(password.username, "Username")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Password:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {showPasswords[password.id] ? password.password : "••••••••••••"}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(password.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords[password.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(password.password, "Password")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Strength: <span className={getStrengthColor(password.strength)}>{password.strength}</span></span>
                          <span>Updated: {new Date(password.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPassword(password);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-muted hover:bg-primary/20 hover:text-primary rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeletePassword(password.id)}
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <PasswordModal
            password={selectedPassword}
            onClose={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedPassword(null);
            }}
            onSave={(data) => {
              if (showEditModal && selectedPassword) {
                handleUpdatePassword(selectedPassword.id, data);
              } else {
                handleCreatePassword(data);
              }
            }}
            generatePassword={generatePassword}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function PasswordModal({ 
  password, 
  onClose, 
  onSave,
  generatePassword 
}: { 
  password?: ServicePassword | null;
  onClose: () => void; 
  onSave: (data: Partial<ServicePassword>) => void;
  generatePassword: () => string;
}) {
  const [formData, setFormData] = useState({
    service: password?.service || "",
    username: password?.username || "",
    password: password?.password || "",
    description: password?.description || "",
    category: password?.category || "service" as ServicePassword["category"]
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true);
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
        <h2 className="text-2xl font-bold mb-4">
          {password ? "Edit Password" : "Add New Password"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Service Name</label>
            <input
              type="text"
              required
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="PostgreSQL Database"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ServicePassword["category"] })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="service">Service</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 pr-20 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••••••"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-muted rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="p-1 hover:bg-muted rounded"
                  title="Generate password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Main database for production environment"
            />
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
              className="flex-1 px-4 py-2 bg-gradient-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {password ? "Update" : "Save"} Password
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}