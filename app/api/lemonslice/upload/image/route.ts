import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'

const LEMONSLICE_API_BASE_URL = process.env.NEXT_PUBLIC_LEMONSLICE_API_BASE_URL || 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function POST(request: NextRequest) {
  try {
    // Skip API calls during build time to prevent static generation failures
    if (process.env.NODE_ENV === 'production' && !LEMONSLICE_API_KEY.startsWith('sk-')) {
      return NextResponse.json({
        error: 'Image upload API not configured',
        details: 'LemonSlice API key not properly configured for production'
      }, { status: 503 })
    }
    
    const formData = await request.formData()
    
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        // Don't set Content-Type for FormData, let fetch handle it
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('LemonSlice image upload failed:', error)
    return NextResponse.json(
      { 
        error: 'Image upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 