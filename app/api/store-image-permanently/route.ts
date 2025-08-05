import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for server-side image processing
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Backend: Store image permanently API called')
    
    const body = await request.json()
    const { imageUrl } = body
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }
    
    console.log('🖼️ Backend: Downloading image from OpenAI...')
    console.log('🖼️ Backend: URL:', imageUrl)
    
    // Download the image from OpenAI (no CORS issues on server-side)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    
    const imageBlob = await response.blob()
    console.log('✅ Backend: Image downloaded successfully:', {
      size: imageBlob.size,
      type: imageBlob.type
    })
    
    // Simple storage logic: Local for development, production-ready for deployment
    const isProduction = process.env.VERCEL_ENV === 'production'
    
    if (isProduction) {
      // Production: Use base64 (most reliable, never expires, works everywhere)
      console.log('🖼️ Backend: Production mode - using base64 data URL for permanent storage')
    } else {
      // Development: Save locally and use localhost URL (fast and simple)
      try {
        console.log('🖼️ Backend: Development mode - saving image locally')
        
        const uploadEndpoint = '/api/upload-image-blob'
        const formData = new FormData()
        formData.append('image', imageBlob, 'generated-avatar.png')
        
        const uploadResponse = await fetch(`http://localhost:${process.env.PORT || 3000}${uploadEndpoint}`, {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          if (uploadData.success) {
            // Use localhost URL for local development
            const localUrl = `http://localhost:${process.env.PORT || 3000}/temp-avatars/${uploadData.filename}`
            console.log('✅ Backend: Image stored locally:', localUrl)
            console.log('💡 Backend: For LemonSlice API, you\'ll need ngrok or use dry run mode')
            
            return NextResponse.json({
              success: true,
              permanentUrl: localUrl
            })
          }
        }
        
        console.log('⚠️ Backend: Local storage failed, using base64 fallback...')
      } catch (error) {
        console.log('⚠️ Backend: Local storage error:', error.message, '- using base64 fallback...')
      }
    }
    
    // Fallback: Base64 data URL (works everywhere, never expires)
    {
      // FALLBACK: Use base64 data URL (most reliable, never expires)
      console.log('🖼️ Backend: Using base64 data URL for permanent storage')
      console.log('🌍 Environment:', {
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV,
        hasNgrok: !!process.env.NEXT_PUBLIC_NGROK_URL
      })
      
      // Convert image to base64 data URL (never expires, always accessible)
      const imageArrayBuffer = await imageBlob.arrayBuffer()
      const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64')
      const mimeType = imageBlob.type || 'image/png'
      const dataUrl = `data:${mimeType};base64,${imageBase64}`
      
      console.log('✅ Backend: Image converted to base64 data URL (permanent, never expires)')
      console.log('📊 Backend: Data URL size:', Math.round(dataUrl.length / 1024), 'KB')
      
      return NextResponse.json({
        success: true,
        permanentUrl: dataUrl
      })
    }
    
  } catch (error) {
    console.error('❌ Backend: Failed to store image permanently:', error)
    
    return NextResponse.json({
      error: 'Failed to store image permanently',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}