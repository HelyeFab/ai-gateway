"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Key,
  MoreVertical,
  Mail,
  Calendar,
  Activity,
  ChevronLeft,
  Ban,
  Edit
} from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  lastLogin: string;
  apiKeyCount: number;
  totalRequests: number;
  photoURL?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [isAdmin, authLoading, router]);

  const fetchUsers = async () => {
    try {
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          id: "1",
          email: "admin@selfmind.ai",
          displayName: "System Admin",
          role: "admin",
          status: "active",
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date().toISOString(),
          apiKeyCount: 5,
          totalRequests: 15234,
          photoURL: "https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff"
        },
        {
          id: "2",
          email: "john.doe@example.com",
          displayName: "John Doe",
          role: "user",
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          apiKeyCount: 2,
          totalRequests: 1247,
          photoURL: "https://ui-avatars.com/api/?name=John+Doe&background=10B981&color=fff"
        },
        {
          id: "3",
          email: "jane.smith@example.com",
          displayName: "Jane Smith",
          role: "user",
          status: "active",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          apiKeyCount: 1,
          totalRequests: 523,
          photoURL: "https://ui-avatars.com/api/?name=Jane+Smith&background=8B5CF6&color=fff"
        },
        {
          id: "4",
          email: "suspicious@hacker.com",
          displayName: "Suspicious User",
          role: "user",
          status: "suspended",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          apiKeyCount: 0,
          totalRequests: 10523,
          photoURL: "https://ui-avatars.com/api/?name=Suspicious+User&background=EF4444&color=fff"
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: "suspend" | "ban" | "activate" | "makeAdmin") => {
    try {
      // In production, this would call the API
      toast.success(`User ${action} successful`);
      
      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          switch (action) {
            case "suspend":
              return { ...user, status: "suspended" as const };
            case "ban":
              return { ...user, status: "banned" as const };
            case "activate":
              return { ...user, status: "active" as const };
            case "makeAdmin":
              return { ...user, role: "admin" as const };
            default:
              return user;
          }
        }
        return user;
      }));
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-500";
      case "suspended": return "bg-yellow-500/20 text-yellow-500";
      case "banned": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getRoleColor = (role: string) => {
    return role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";
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
                  <span className="gradient-secondary text-gradient">User Management</span>
                </h1>
                <p className="text-muted-foreground">Manage users and their permissions</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <UserCheck className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">
                {users.filter(u => u.status === "active").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Admins</span>
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === "admin").length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total API Keys</span>
                <Key className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-2xl font-bold">
                {users.reduce((acc, u) => acc + u.apiKeyCount, 0)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Requests</span>
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold">
                {users.reduce((acc, u) => acc + u.totalRequests, 0).toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{user.displayName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Key className="w-4 h-4" />
                        <span>{user.apiKeyCount} keys</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span>{user.totalRequests.toLocaleString()} requests</span>
                      </div>
                      
                      <div className="relative group">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            View Details
                          </button>
                          
                          {user.role !== "admin" && (
                            <button
                              onClick={() => handleUserAction(user.id, "makeAdmin")}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Make Admin
                            </button>
                          )}
                          
                          {user.status === "active" && (
                            <button
                              onClick={() => handleUserAction(user.id, "suspend")}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-yellow-500"
                            >
                              <UserX className="w-4 h-4" />
                              Suspend User
                            </button>
                          )}
                          
                          {user.status === "suspended" && (
                            <button
                              onClick={() => handleUserAction(user.id, "activate")}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-green-500"
                            >
                              <UserCheck className="w-4 h-4" />
                              Activate User
                            </button>
                          )}
                          
                          {user.status !== "banned" && (
                            <button
                              onClick={() => handleUserAction(user.id, "ban")}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-red-500"
                            >
                              <Ban className="w-4 h-4" />
                              Ban User
                            </button>
                          )}
                        </div>
                      </div>
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