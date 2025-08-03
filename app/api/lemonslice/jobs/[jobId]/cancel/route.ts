import { NextRequest, NextResponse } from 'next/server'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }
    
    console.log('🛑 Attempting to cancel LemonSlice job:', jobId)
    
    // Try different possible endpoints for canceling jobs
    const endpoints = [
      `/v2/generations/${jobId}/cancel`,
      `/generations/${jobId}/cancel`,
      `/avatar/jobs/${jobId}/cancel`,
      `/jobs/${jobId}/cancel`,
      `/v2/jobs/${jobId}/cancel`
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🛑 Trying cancel endpoint: ${endpoint}`)
        
        const response = await fetch(`${LEMONSLICE_API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })

        console.log(`🛑 Cancel API response status for ${endpoint}:`, response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`🛑 Job ${jobId} cancelled via ${endpoint}:`, data)
          return NextResponse.json({
            success: true,
            message: `Job ${jobId} cancelled successfully`,
            data,
            _endpoint: endpoint
          })
        } else {
          const errorData = await response.text()
          console.log(`🛑 Cancel API error for ${endpoint}:`, response.status, errorData)
          
          // If it's a 404, the job might already be done or not exist
          if (response.status === 404) {
            return NextResponse.json({
              success: false,
              message: `Job ${jobId} not found (may already be completed or cancelled)`,
              status: 404,
              _endpoint: endpoint
            })
          }
        }
        
      } catch (endpointError) {
        console.log(`🛑 Cancel endpoint ${endpoint} failed:`, endpointError)
      }
    }
    
    // Try DELETE method as alternative
    for (const endpoint of endpoints.map(e => e.replace('/cancel', ''))) {
      try {
        console.log(`🛑 Trying DELETE method for: ${endpoint}`)
        
        const response = await fetch(`${LEMONSLICE_API_BASE_URL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          console.log(`🛑 Job ${jobId} deleted via ${endpoint}`)
          return NextResponse.json({
            success: true,
            message: `Job ${jobId} deleted successfully`,
            data,
            _endpoint: endpoint,
            _method: 'DELETE'
          })
        }
        
      } catch (deleteError) {
        console.log(`🛑 DELETE method failed for ${endpoint}:`, deleteError)
      }
    }
    
    // If all cancel attempts failed
    return NextResponse.json({
      success: false,
      error: 'All job cancellation endpoints failed',
      attempted_endpoints: endpoints,
      jobId: jobId,
      suggestion: 'LemonSlice API may not support job cancellation, or job may already be completed'
    }, { status: 404 })

  } catch (error) {
    console.error('🛑 Job cancellation failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Job cancellation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 