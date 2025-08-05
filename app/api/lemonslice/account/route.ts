import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'
// Force dynamic rendering since we make external API calls
export const dynamic = 'force-dynamic'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function GET() {
  try {
    // Only skip API calls in preview environments (not production!)  
    if (process.env.VERCEL_ENV === 'preview') {
      return NextResponse.json({
        success: true,
        account: {
          credits: 0,
          plan: 'free',
          status: 'preview-mock'
        },
        message: 'Preview environment - API calls disabled'
      }, { status: 200 })
    }
    
    // LemonSlice API doesn't have an account endpoint
    // Return mock account data for compatibility with existing UI
    return NextResponse.json({
      success: true,
      account: {
        balance: 10.0,
        currency: 'USD',
        plan: 'developer',
        status: 'no-account-endpoint',
        usage_today: 0,
        usage_month: 0,
        email: 'developer@lemonslice.com'
      },
      message: 'LemonSlice API has no account endpoint. Use /v2/generations to check usage.',
      suggestion: 'Query recent generations to estimate usage'
    }, { status: 200 })

  } catch (error) {
    console.error('💳 Account mock failed:', error)
    return NextResponse.json(
      { 
        error: 'Account mock failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 