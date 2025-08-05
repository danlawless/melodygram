import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function GET(request: NextRequest) {
  try {
    // Skip API calls during build time to prevent static generation failures
    if (process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'development') {
      // Don't make external API calls during build or in preview environments
      return NextResponse.json({
        success: true,
        jobs: [],
        message: 'Build-time placeholder response'
      }, { status: 200 })
    }
    
    // Additional check for missing API key
    if (!LEMONSLICE_API_KEY || !LEMONSLICE_API_KEY.startsWith('sk-')) {
      return NextResponse.json({
        error: 'Jobs API not configured',
        message: 'LemonSlice API key not properly configured',
        jobs: []
      }, { status: 503 })
    }
    
    const { searchParams } = request.nextUrl
    const limit = searchParams.get('limit') || '50'
    const status = searchParams.get('status') // pending, processing, completed, failed
    
    console.log('📋 Fetching LemonSlice jobs list...')
    console.log('📋 Limit:', limit, 'Status filter:', status)
    
    // Try different possible endpoints for listing jobs
    const endpoints = [
      `/v2/generations?limit=${limit}${status ? `&status=${status}` : ''}`,
      `/generations?limit=${limit}${status ? `&status=${status}` : ''}`,
      `/avatar/jobs?limit=${limit}${status ? `&status=${status}` : ''}`,
      `/jobs?limit=${limit}${status ? `&status=${status}` : ''}`,
      `/v2/jobs?limit=${limit}${status ? `&status=${status}` : ''}`
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📋 Trying endpoint: ${endpoint}`)
        
        const response = await fetch(`${LEMONSLICE_API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
            'Accept': 'application/json'
          },
        })

        console.log(`📋 Jobs API response status for ${endpoint}:`, response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`📋 Jobs data received from ${endpoint}:`, data)
          return NextResponse.json({
            ...data,
            _endpoint: endpoint,
            _success: true
          })
        } else {
          const errorData = await response.text()
          console.log(`📋 Jobs API error for ${endpoint}:`, response.status, errorData)
        }
        
      } catch (endpointError) {
        console.log(`📋 Endpoint ${endpoint} failed:`, endpointError)
      }
    }
    
    // If all endpoints failed, return error summary
    return NextResponse.json({
      error: 'All job listing endpoints failed',
      attempted_endpoints: endpoints,
      suggestion: 'LemonSlice API may not support job listing, or different authentication required'
    }, { status: 404 })

  } catch (error) {
    console.error('📋 Jobs fetch failed:', error)
    return NextResponse.json(
      { 
        error: 'Jobs fetch failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 