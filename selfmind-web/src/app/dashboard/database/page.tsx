"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { 
  Database,
  Table,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  FileJson,
  FileText,
  Copy,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

interface TableData {
  name: string;
  rowCount: number;
  size: string;
  lastModified: string;
}

interface TableRow {
  [key: string]: any;
}

export default function DatabasePage() {
  const router = useRouter();
  const { isAdmin, authLoading } = useAuthStore();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(25);

  useEffect(() => {
    // Wait for auth to load before checking admin status
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchTables();
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      // Mock data for demonstration
      const mockTables: TableData[] = [
        {
          name: "api_keys",
          rowCount: 45,
          size: "128 KB",
          lastModified: new Date().toISOString()
        },
        {
          name: "users",
          rowCount: 156,
          size: "512 KB",
          lastModified: new Date(Date.now() - 3600000).toISOString()
        },
        {
          name: "audit_logs",
          rowCount: 12847,
          size: "45.6 MB",
          lastModified: new Date().toISOString()
        },
        {
          name: "service_metrics",
          rowCount: 98234,
          size: "128.3 MB",
          lastModified: new Date().toISOString()
        },
        {
          name: "rate_limits",
          rowCount: 234,
          size: "64 KB",
          lastModified: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      setTables(mockTables);
      if (mockTables.length > 0) {
        setSelectedTable(mockTables[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to load database tables");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      // Mock data based on table name
      let mockData: TableRow[] = [];
      let columns: string[] = [];

      switch (tableName) {
        case "api_keys":
          columns = ["id", "key", "user_email", "service", "enabled", "created_at", "expires_at"];
          mockData = Array(45).fill(null).map((_, i) => ({
            id: i + 1,
            key: `sk_${Math.random().toString(36).substring(7)}`,
            user_email: `user${i}@example.com`,
            service: ["all", "chat", "tts", "image"][Math.floor(Math.random() * 4)],
            enabled: Math.random() > 0.2,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : null
          }));
          break;

        case "users":
          columns = ["id", "email", "display_name", "role", "status", "created_at", "last_login"];
          mockData = Array(156).fill(null).map((_, i) => ({
            id: i + 1,
            email: `user${i}@example.com`,
            display_name: `User ${i}`,
            role: i === 0 ? "admin" : "user",
            status: ["active", "suspended", "banned"][Math.floor(Math.random() * 3)],
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          }));
          break;

        case "audit_logs":
          columns = ["id", "timestamp", "user", "action", "service", "status", "ip_address", "user_agent"];
          mockData = Array(50).fill(null).map((_, i) => ({
            id: i + 1,
            timestamp: new Date(Date.now() - i * 60 * 1000).toISOString(),
            user: `user${Math.floor(Math.random() * 50)}@example.com`,
            action: ["api_call", "login", "key_created", "key_deleted"][Math.floor(Math.random() * 4)],
            service: ["chat", "tts", "image", "whisper"][Math.floor(Math.random() * 4)],
            status: ["success", "error"][Math.floor(Math.random() * 2)],
            ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }));
          break;

        default:
          columns = ["id", "data", "created_at"];
          mockData = Array(10).fill(null).map((_, i) => ({
            id: i + 1,
            data: `Sample data ${i}`,
            created_at: new Date().toISOString()
          }));
      }

      setTableColumns(columns);
      setTableData(mockData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch table data:", error);
      toast.error("Failed to load table data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = [...tableData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    if (typeof aVal === "boolean") {
      return sortDirection === "asc" ? (aVal ? -1 : 1) : (aVal ? 1 : -1);
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const exportData = (format: "json" | "csv") => {
    if (format === "json") {
      const dataStr = JSON.stringify(filteredData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const link = document.createElement("a");
      link.href = dataUri;
      link.download = `${selectedTable}_export.json`;
      link.click();
    } else {
      // CSV export
      const headers = tableColumns.join(",");
      const rows = filteredData.map(row => 
        tableColumns.map(col => JSON.stringify(row[col] ?? "")).join(",")
      );
      const csv = [headers, ...rows].join("\n");
      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
      const link = document.createElement("a");
      link.href = dataUri;
      link.download = `${selectedTable}_export.csv`;
      link.click();
    }
    toast.success(`Data exported as ${format.toUpperCase()}`);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "boolean") return value ? "✓" : "✗";
    if (value instanceof Date || !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    return String(value);
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
                  <span className="gradient-accent text-gradient">Database Viewer</span>
                </h1>
                <p className="text-muted-foreground">Browse and manage database tables</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTableData(selectedTable!)}
                  disabled={!selectedTable || loading}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-accent text-white rounded-lg hover:opacity-90">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => exportData("json")}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <FileJson className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => exportData("csv")}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Tables Sidebar */}
            <div className="w-64 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Tables</h3>
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedTable === table.name
                      ? "bg-gradient-primary text-white"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Table className="w-4 h-4" />
                    <span className="font-medium">{table.name}</span>
                  </div>
                  <div className="text-xs opacity-80">
                    {table.rowCount.toLocaleString()} rows • {table.size}
                  </div>
                </button>
              ))}
            </div>

            {/* Data View */}
            <div className="flex-1">
              {selectedTable && (
                <>
                  {/* Search Bar */}
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={`Search in ${selectedTable}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Data Table */}
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            {tableColumns.map((column) => (
                              <th
                                key={column}
                                onClick={() => handleSort(column)}
                                className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  {column}
                                  {sortColumn === column && (
                                    sortDirection === "asc" ? 
                                      <ChevronUp className="w-4 h-4" /> : 
                                      <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={tableColumns.length} className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              </td>
                            </tr>
                          ) : paginatedData.length === 0 ? (
                            <tr>
                              <td colSpan={tableColumns.length} className="text-center py-8 text-muted-foreground">
                                No data found
                              </td>
                            </tr>
                          ) : (
                            paginatedData.map((row, i) => (
                              <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                                {tableColumns.map((column) => (
                                  <td key={column} className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className={`${
                                        typeof row[column] === "boolean" 
                                          ? row[column] ? "text-green-500" : "text-red-500"
                                          : ""
                                      }`}>
                                        {formatValue(row[column])}
                                      </span>
                                      {row[column] && typeof row[column] === "string" && row[column].length > 20 && (
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(row[column]);
                                            toast.success("Copied to clipboard");
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Copy className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} results
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-gradient-primary text-white"
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}