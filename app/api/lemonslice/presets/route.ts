import { NextRequest, NextResponse } from 'next/server'

const LEMONSLICE_API_BASE_URL = process.env.NEXT_PUBLIC_LEMONSLICE_API_BASE_URL || 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function GET() {
  try {
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/avatar/presets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('LemonSlice presets fetch failed:', error)
    
    // Return fallback presets if API fails
    const fallbackPresets = {
      presets: [
        {
          id: 'natural',
          name: 'Natural',
          description: 'Natural speaking animation with subtle movements',
          animation_type: 'natural'
        },
        {
          id: 'expressive',
          name: 'Expressive',
          description: 'More animated with expressive gestures and movements',
          animation_type: 'expressive'
        },
        {
          id: 'subtle',
          name: 'Subtle',
          description: 'Minimal animation focusing on lip sync',
          animation_type: 'subtle'
        }
      ]
    }

    return NextResponse.json(fallbackPresets)
  }
} 