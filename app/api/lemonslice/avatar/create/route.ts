import { NextRequest, NextResponse } from 'next/server'

const LEMONSLICE_API_BASE_URL = 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎭 Received request body:', body)
    
    // Check if API key is configured
    if (!LEMONSLICE_API_KEY) {
      console.error('❌ LemonSlice API key not configured')
      return NextResponse.json({ 
        error: 'LemonSlice API key not configured', 
        details: 'Please set the LEMONSLICE_API_KEY environment variable with your actual API key from lemonslice.com',
        setup_required: true
      }, { status: 500 })
    }
    
    // Validate required fields
    if (!body.image) {
      console.error('❌ Missing image URL in request')
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }
    if (!body.audio) {
      console.error('❌ Missing audio URL in request')
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
    }
    
    // Extract the actual image URL if it's coming through our proxy
    let actualImageUrl = body.image
    console.log('🔍 Original image URL received:', body.image)
    
    if (body.image.includes('/api/proxy-image')) {
      console.log('🔍 Detected proxy URL, extracting original...')
      try {
        // Extract the original URL from the proxy URL
        const url = new URL(body.image, `http://localhost:3000`) // Use localhost for parsing
        const originalUrl = url.searchParams.get('url')
        console.log('🔍 Extracted URL parameter:', originalUrl)
        
        if (originalUrl) {
          actualImageUrl = decodeURIComponent(originalUrl)
          console.log('🔗 Successfully extracted original image URL:', actualImageUrl.substring(0, 80) + '...')
        } else {
          console.error('❌ No URL parameter found in proxy URL')
        }
      } catch (error) {
        console.error('❌ Error parsing proxy URL:', error)
      }
    } else {
      console.log('🔍 Using image URL as-is (not a proxy URL)')
    }

    // Map the old format to new LemonSlice API format
    const lemonSliceRequest = {
      img_url: actualImageUrl, // Now using the actual public URL
      audio_url: body.audio, // This should already be a public URL from Mureka
      model: 'V2.5',
      resolution: '512',
      animation_style: 'autoselect',
      expressiveness: 0.8,
      crop_head: false
    }
    
    // Store title and length locally for our UI (LemonSlice doesn't support custom metadata)
    const songTitle = body.title || null
    const songLength = body.songLength || null
    
    console.log(`🎭 Creating avatar for ${songLength ? `${songLength}s` : 'unknown length'} song: "${songTitle}"`)
    
    console.log('🎭 Sending request to LemonSlice API:', lemonSliceRequest)
    console.log('🔑 Using API key:', LEMONSLICE_API_KEY ? `${LEMONSLICE_API_KEY.substring(0, 10)}...` : 'MISSING')
    
    const response = await fetch(`${LEMONSLICE_API_BASE_URL}/v2/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(lemonSliceRequest),
    })

    console.log('🌐 LemonSlice API response status:', response.status)
    console.log('🌐 LemonSlice API response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ LemonSlice API error response:', errorData)
      console.error('❌ LemonSlice API error status:', response.status)
      console.error('❌ LemonSlice API error headers:', Object.fromEntries(response.headers.entries()))
      
      // Handle specific error cases
      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'LemonSlice API authentication failed', 
            status: response.status,
            details: 'API key may be invalid, expired, or account may not have proper permissions',
            suggestions: [
              'Verify your LEMONSLICE_API_KEY is correct',
              'Check if your LemonSlice account has API access enabled',
              'Ensure you have joined the API waitlist at lemonslice.com',
              'Contact LemonSlice support for API key issues'
            ]
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'LemonSlice API error', 
          status: response.status,
          details: errorData 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ LemonSlice API success response:', data)
    
    // Add our custom metadata to the response
    const responseWithMetadata = {
      ...data,
      songTitle: songTitle, // Include title for local storage
      songLength: songLength // Include length for local storage
    }
    
    return NextResponse.json(responseWithMetadata)

  } catch (error) {
    console.error('❌ LemonSlice avatar creation failed:', error)
    
    // Extract more details from the error
    let errorDetails = 'Unknown error'
    let errorStatus = 500
    
    if (error instanceof Error) {
      errorDetails = error.message
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      
      // Handle network-related errors
      if (error.message.includes('fetch')) {
        errorDetails = 'Network error connecting to LemonSlice API. Please check your internet connection and try again.'
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Avatar creation failed', 
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: errorStatus }
    )
  }
} 