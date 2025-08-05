import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'
// Force dynamic rendering since we make external API calls
export const dynamic = 'force-dynamic'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    
    console.log('🔍 Checking LemonSlice job status for:', taskId)
    console.log('🔑 Using API key:', LEMONSLICE_API_KEY ? `${LEMONSLICE_API_KEY.substring(0, 10)}...` : 'MISSING')
    
    // Check if API key is configured
    if (!LEMONSLICE_API_KEY) {
      console.error('❌ LemonSlice API key not configured')
      return NextResponse.json({ 
        error: 'LemonSlice API key not configured', 
        details: 'Please set the LEMONSLICE_API_KEY environment variable'
      }, { status: 500 })
    }
    
    // Get specific generation by ID from LemonSlice API
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/v2/generations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        'Accept': 'application/json'
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LemonSlice generation API error:', errorData)
      
      if (response.status === 404) {
        return NextResponse.json({
          error: 'Generation not found',
          job_id: taskId,
          details: 'Job ID not found in LemonSlice API'
        }, { status: 404 })
      }
      
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`)
    }

    const job = await response.json()
    console.log('✅ Job found:', job.job_id, 'Status:', job.status)
    return NextResponse.json(job)

  } catch (error) {
    console.error('❌ LemonSlice task status fetch failed:', error)
    return NextResponse.json(
      { 
        error: 'Task status fetch failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 