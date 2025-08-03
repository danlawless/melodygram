import { NextRequest, NextResponse } from 'next/server'

const LEMONSLICE_API_BASE_URL = process.env.NEXT_PUBLIC_LEMONSLICE_API_BASE_URL || 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/avatar/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('LemonSlice avatar creation failed:', error)
    return NextResponse.json(
      { 
        error: 'Avatar creation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 