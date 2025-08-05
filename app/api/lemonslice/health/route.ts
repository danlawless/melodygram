import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'
// Force dynamic rendering since we make external API calls
export const dynamic = 'force-dynamic'

const LEMONSLICE_API_BASE_URL = process.env.NEXT_PUBLIC_LEMONSLICE_API_BASE_URL || 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function GET() {
  try {
    // Only skip API calls in preview environments (not production!)
    if (process.env.VERCEL_ENV === 'preview') {
      return NextResponse.json({
        status: 'healthy',
        message: 'Preview environment - API calls disabled'
      }, { status: 200 })
    }
    
    // Additional check for missing API key
    if (!LEMONSLICE_API_KEY || !LEMONSLICE_API_KEY.startsWith('sk-')) {
      return NextResponse.json({
        status: 'unconfigured',
        message: 'LemonSlice API key not properly configured'
      }, { status: 503 })
    }
    
    // LemonSlice API doesn't have a dedicated health endpoint
    // Test connectivity by checking a real endpoint (lightweight generations call)
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/v2/generations?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        'Accept': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    // Return health status based on successful API response
    return NextResponse.json({
      status: 'healthy',
      lemonslice_api: 'connected',
      message: 'LemonSlice API is accessible',
      test_endpoint: '/v2/generations',
      response_status: response.status
    })

  } catch (error) {
    console.error('LemonSlice health check failed:', error)
    return NextResponse.json(
      { error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 