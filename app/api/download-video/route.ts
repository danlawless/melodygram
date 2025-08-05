import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, filename } = await request.json()
    
    if (!videoUrl || !filename) {
      return NextResponse.json(
        { error: 'Missing videoUrl or filename' },
        { status: 400 }
      )
    }

    // Validate URL to prevent SSRF attacks
    try {
      const url = new URL(videoUrl)
      // Only allow HTTPS URLs from trusted domains
      if (url.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed')
      }
      
      // Add trusted domains here (e.g., LemonSlice, your CDN, etc.)
      const trustedDomains = [
        'lemonslice.com',
        'cdn.lemonslice.com',
        // Add more trusted domains as needed
      ]
      
      // For development, you might want to allow localhost
      if (process.env.NODE_ENV === 'development') {
        trustedDomains.push('localhost')
      }
      
      const isDomainTrusted = trustedDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      )
      
      if (!isDomainTrusted) {
        console.warn(`Untrusted domain attempted: ${url.hostname}`)
        // For now, allow all domains but log the warning
        // In production, you might want to be more restrictive
        // throw new Error('Domain not in trusted list')
      }
      
    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400 }
      )
    }

    // Fetch the video
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MelodyGram/1.0)',
        'Accept': 'video/mp4,video/*,*/*'
      }
    })

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch video: ${response.status}` },
        { status: response.status }
      )
    }

    // Get the content type and size
    const contentType = response.headers.get('content-type') || 'video/mp4'
    const contentLength = response.headers.get('content-length')
    
    // Stream the response back to the client with download headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
    
    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    return new NextResponse(response.body, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Download proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}