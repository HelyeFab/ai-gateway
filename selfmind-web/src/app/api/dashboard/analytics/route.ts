import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin-key-change-in-production";

export async function GET(request: NextRequest) {
  // Verify admin key
  const adminKey = request.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "7d";

  try {
    // Fetch real analytics from the API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/dashboard/analytics?timeframe=${timeframe}`, {
      headers: {
        "X-Admin-Key": ADMIN_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analytics");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    
    // Return mock data if API is not available
    const mockData = [];
    const now = new Date();
    const days = timeframe === "24h" ? 1 : timeframe === "30d" ? 30 : 7;
    
    for (let i = days - 1; i >= 0; i--) {
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
    
    return NextResponse.json({
      chart_data: mockData,
      totals: {
        total_requests: mockData.reduce((sum, d) => sum + d.requests, 0),
        total_errors: mockData.reduce((sum, d) => sum + d.errors, 0),
        by_service: {
          chat: mockData.reduce((sum, d) => sum + d.chat, 0),
          tts: mockData.reduce((sum, d) => sum + d.tts, 0),
          image: mockData.reduce((sum, d) => sum + d.image, 0),
          whisper: mockData.reduce((sum, d) => sum + d.whisper, 0)
        }
      }
    });
  }
}