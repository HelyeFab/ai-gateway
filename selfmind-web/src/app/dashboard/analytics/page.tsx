"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { 
  BarChart,
  ChevronLeft,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Filter
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("7d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchAnalytics();
  }, [isAdmin, authLoading, router, timeframe]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/dashboard/analytics?timeframe=${timeframe}`, {
        headers: {
          "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setChartData(data.chart_data || []);
        setTotals(data.totals || {});
      } else {
        // Mock data
        const mockData = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          mockData.push({
            timestamp: date.toISOString(),
            requests: Math.floor(Math.random() * 300) + 100,
            errors: Math.floor(Math.random() * 10),
            chat: Math.floor(Math.random() * 150) + 50,
            tts: Math.floor(Math.random() * 80) + 20,
            image: Math.floor(Math.random() * 50) + 10,
            whisper: Math.floor(Math.random() * 30) + 5
          });
        }
        setChartData(mockData);
        setTotals({
          total_requests: mockData.reduce((sum, d) => sum + d.requests, 0),
          total_errors: mockData.reduce((sum, d) => sum + d.errors, 0),
          by_service: {
            chat: mockData.reduce((sum, d) => sum + d.chat, 0),
            tts: mockData.reduce((sum, d) => sum + d.tts, 0),
            image: mockData.reduce((sum, d) => sum + d.image, 0),
            whisper: mockData.reduce((sum, d) => sum + d.whisper, 0)
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeframe === "24h") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const pieData = totals.by_service ? [
    { name: 'Chat', value: totals.by_service.chat, color: '#9333ea' },
    { name: 'TTS', value: totals.by_service.tts, color: '#3b82f6' },
    { name: 'Image', value: totals.by_service.image, color: '#f43f5e' },
    { name: 'Whisper', value: totals.by_service.whisper, color: '#f59e0b' }
  ].filter(d => d.value > 0) : [];

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
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <span className="gradient-primary text-gradient">Analytics</span>
                </h1>
                <p className="text-muted-foreground">Real-time usage insights and statistics</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{totals.total_requests?.toLocaleString() || 0}</p>
                  <p className="text-xs text-green-500 mt-2">
                    <TrendingUp className="w-4 h-4 inline" /> +12.5% from last period
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-3xl font-bold">
                    {totals.total_requests > 0 
                      ? ((totals.total_errors / totals.total_requests) * 100).toFixed(2) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totals.total_errors} errors total
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <p className="text-3xl font-bold">89ms</p>
                  <p className="text-xs text-green-500 mt-2">
                    -5ms from last period
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Most Used Service</p>
                    <BarChart className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-3xl font-bold">Chat API</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totals.by_service?.chat || 0} requests
                  </p>
                </motion.div>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Request Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Request Timeline</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatXAxis}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#9333ea" 
                        fillOpacity={1} 
                        fill="url(#colorRequests)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Service Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Service Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Service Usage Over Time */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-card border border-border rounded-lg p-6 lg:col-span-2"
                >
                  <h3 className="text-lg font-semibold mb-4">Service Usage Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatXAxis}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="chat" 
                        stroke="#9333ea" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tts" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="image" 
                        stroke="#f43f5e" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="whisper" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}