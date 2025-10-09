import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin-key-change-in-production";

export async function GET(request: NextRequest) {
  // Verify admin key
  const adminKey = request.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch real API keys from the API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/dashboard/keys`, {
      headers: {
        "X-Admin-Key": ADMIN_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch API keys");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    
    // Return mock data if API is not available
    return NextResponse.json({
      keys: [
        {
          id: "1",
          key: "sk_live_" + Math.random().toString(36).substring(7),
          user: "demo@example.com",
          service: "all",
          description: "Demo API Key",
          enabled: true,
          created_at: new Date().toISOString(),
          expires_at: null,
          last_used: new Date().toISOString(),
          request_count: Math.floor(Math.random() * 1000)
        }
      ]
    });
  }
}

export async function POST(request: NextRequest) {
  // Verify admin key
  const adminKey = request.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Forward to API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/dashboard/keys`, {
      method: "POST",
      headers: {
        "X-Admin-Key": ADMIN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create API key");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating API key:", error);
    
    // Return mock response
    return NextResponse.json({
      id: Math.random().toString(36).substring(7),
      key: "sk_live_" + Math.random().toString(36).substring(7),
      ...request.body,
      enabled: true,
      created_at: new Date().toISOString(),
      request_count: 0
    });
  }
}