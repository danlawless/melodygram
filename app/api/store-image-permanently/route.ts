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
    
    // Check if we're in production or development environment
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    const hasNgrokAccess = process.env.NEXT_PUBLIC_NGROK_URL && !isProduction
    
    if (hasNgrokAccess) {
      // DEVELOPMENT: Upload to ngrok for permanent storage
      console.log('🖼️ Backend: Development mode - using ngrok for permanent storage')
      
      const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL
      const uploadEndpoint = `${ngrokUrl}/api/upload-image-blob`
      
      console.log('🖼️ Backend: Uploading to ngrok:', uploadEndpoint)
      
      const formData = new FormData()
      formData.append('image', imageBlob, 'generated-avatar.png')
      
      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text()
        throw new Error(`Failed to upload image: ${uploadResponse.statusText} - ${uploadError}`)
      }
      
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success) {
        throw new Error(`Upload failed: ${uploadData.error}`)
      }
      
      console.log('✅ Backend: Image stored permanently via ngrok:', uploadData.url)
      
      return NextResponse.json({
        success: true,
        permanentUrl: uploadData.url
      })
      
    } else {
      // PRODUCTION: Use base64 data URL (most reliable, never expires)
      console.log('🖼️ Backend: Production mode - using base64 data URL for permanent storage')
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