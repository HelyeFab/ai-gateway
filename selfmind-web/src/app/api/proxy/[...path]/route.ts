import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'POST')
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      console.log('[Proxy] Request rejected: Missing API key')
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Reconstruct the target URL
    const targetPath = path.join('/')
    // Use localhost for development, production for deployed
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : 'https://api.selfmind.dev')
    const targetUrl = `${baseUrl}/${targetPath}`

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl

    console.log(`[Proxy] ${method} ${fullUrl}`)
    console.log(`[Proxy] API Key: ${apiKey.substring(0, 8)}...`)

    // Prepare headers
    const headers: HeadersInit = {
      'X-API-Key': apiKey,
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    }

    // For POST requests, handle the body
    if (method === 'POST') {
      const contentType = request.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        const body = await request.json()
        options.body = JSON.stringify(body)
        headers['Content-Type'] = 'application/json'
      } else if (contentType?.includes('multipart/form-data')) {
        // For file uploads, pass the FormData directly
        const formData = await request.formData()
        options.body = formData
        // Don't set Content-Type for FormData - let the browser set it with boundary
      } else {
        const body = await request.text()
        options.body = body
        if (contentType) {
          headers['Content-Type'] = contentType
        }
      }
    }

    // Make the request to the actual API
    const response = await fetch(fullUrl, options)

    console.log(`[Proxy] Response: ${response.status} ${response.statusText}`)

    // Get response body
    const responseContentType = response.headers.get('content-type')

    let responseBody
    if (responseContentType?.includes('application/json')) {
      responseBody = await response.json()
    } else if (responseContentType?.includes('audio/')) {
      // For audio responses (like TTS), return as blob
      const blob = await response.blob()
      return new NextResponse(blob, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
          'Content-Length': response.headers.get('content-length') || '',
        },
      })
    } else {
      responseBody = await response.text()
    }

    // Return the proxied response
    return NextResponse.json(responseBody, {
      status: response.status,
    })
  } catch (error: any) {
    console.error('[Proxy] Error:', {
      message: error.message,
      cause: error.cause,
      code: error.code
    })
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        details: error.message,
        hint: 'Check if backend server is running at ' +
          (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080')
      },
      { status: 500 }
    )
  }
}
