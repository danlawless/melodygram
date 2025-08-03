import { NextRequest, NextResponse } from 'next/server'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function GET() {
  try {
    console.log('💳 Fetching LemonSlice account info...')
    
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        'Accept': 'application/json'
      },
    })

    console.log('💳 Account API response status:', response.status)
    console.log('💳 Account API response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('💳 Account API error response:', errorData)
      
      // Try alternative endpoint
      const altResponse = await fetch(`${LEMONSLICE_API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
          'Accept': 'application/json'
        },
      })
      
      if (!altResponse.ok) {
        const altErrorData = await altResponse.text()
        return NextResponse.json({
          error: 'Failed to fetch account info',
          status: response.status,
          details: errorData,
          altStatus: altResponse.status,
          altDetails: altErrorData
        }, { status: response.status })
      }
      
      const altData = await altResponse.json()
      return NextResponse.json(altData)
    }

    const data = await response.json()
    console.log('💳 Account data received:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('💳 Account fetch failed:', error)
    return NextResponse.json(
      { 
        error: 'Account fetch failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 