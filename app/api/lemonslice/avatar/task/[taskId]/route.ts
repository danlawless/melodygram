import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime to avoid static generation issues
export const runtime = 'nodejs'

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
    
    // Get jobs list from LemonSlice API
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/v2/generations?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        'Accept': 'application/json'
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LemonSlice jobs list API error:', errorData)
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`)
    }

    const data = await response.json()
    console.log('🔍 LemonSlice jobs list response received')
    
    // Find the specific job in the list
    const jobs = data.jobs || data.generations || []
    console.log('📋 Total jobs found:', jobs.length)
    console.log('📋 Looking for job ID:', taskId)
    
    // Debug: show first few job IDs
    console.log('📋 First few job IDs:')
    jobs.slice(0, 10).forEach((j: any, i: number) => {
      console.log(`  ${i + 1}. ${j.job_id} (${j.status})`)
      if (j.job_id === taskId) {
        console.log('    ✅ FOUND MATCH!')
      }
    })
    
    const job = jobs.find((j: any) => j.job_id === taskId)
    
    if (!job) {
      console.log('❌ Job not found after detailed search')
      // Return debug info
      return NextResponse.json({
        error: 'Job not found',
        debug: {
          searchingFor: taskId,
          totalJobs: jobs.length,
          firstFewJobIds: jobs.slice(0, 5).map((j: any) => ({
            id: j.job_id,
            status: j.status
          }))
        }
      }, { status: 404 })
    }
    
    console.log('✅ Found job:', job.job_id, 'Status:', job.status)
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