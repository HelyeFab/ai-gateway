import { NextResponse } from 'next/server'

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:8080'
      : 'https://api.selfmind.dev')

  // Test backend connectivity
  let backendStatus = 'unknown'
  try {
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(3000)
    })
    backendStatus = response.ok ? 'reachable' : `error (${response.status})`
  } catch (error: any) {
    backendStatus = `unreachable (${error.message})`
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    backend: {
      url: backendUrl,
      status: backendStatus
    },
    network: {
      hostname: process.env.HOSTNAME || 'unknown',
    }
  })
}
