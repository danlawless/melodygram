import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering since we handle file uploads and environment variables
export const dynamic = 'force-dynamic'

// Add CORS headers for cross-origin requests (ngrok to localhost)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Upload image endpoint called')
    console.log('🖼️ Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    const formData = await request.formData()
    console.log('🖼️ FormData received')
    
    const imageFile = formData.get('image') as File
    console.log('🖼️ Image file extracted:', {
      name: imageFile?.name,
      size: imageFile?.size,
      type: imageFile?.type
    })
    
    if (!imageFile) {
      console.error('❌ No image file in request')
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }
    
    // Create unique filename with proper extension
    const fileId = uuidv4().substring(0, 8)
    const fileExtension = imageFile.type.includes('jpeg') ? 'jpg' : 'png'
    const fileName = `avatar_${fileId}.${fileExtension}`
    
    // Create public uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'temp-avatars')
    console.log('🖼️ Creating directory:', uploadsDir)
    await mkdir(uploadsDir, { recursive: true })
    console.log('✅ Directory created/verified')
    
    // Save file
    const filePath = join(uploadsDir, fileName)
    console.log('🖼️ Saving file to:', filePath)
    const arrayBuffer = await imageFile.arrayBuffer()
    console.log('🖼️ Converting to buffer, size:', arrayBuffer.byteLength)
    await writeFile(filePath, Buffer.from(arrayBuffer))
    console.log('✅ File written successfully')
    
    // Return public URL that LemonSlice API can access
    let baseUrl: string
    
    // Priority order: Explicit base URL > Vercel URL > ngrok URL > localhost (with warning)
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      console.log('🌍 Using explicit base URL from NEXT_PUBLIC_BASE_URL')
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
      console.log('🌍 Using Vercel URL for production')
    } else if (process.env.NGROK_URL) {
      baseUrl = process.env.NGROK_URL
      console.log('🌍 Using ngrok URL for local development')
    } else {
      baseUrl = 'http://localhost:3000'
      console.log('⚠️ WARNING: Using localhost URL - external services cannot access this!')
      console.log('💡 For local development, set NEXT_PUBLIC_BASE_URL with your ngrok URL')
    }
    
    const publicUrl = `${baseUrl}/temp-avatars/${fileName}`
    console.log('🌍 Final image URL for external access:', publicUrl)
    
    console.log('✅ Uploaded avatar image:', publicUrl)
    
    // Schedule cleanup after 24 hours (images can stay longer than audio)
    setTimeout(async () => {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(filePath)
        console.log('🧹 Cleaned up temp avatar file:', fileName)
      } catch (error) {
        console.warn('Could not clean up file:', fileName)
      }
    }, 24 * 60 * 60 * 1000) // 24 hours
    
    const response = NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName
    })
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
    
  } catch (error) {
    console.error('❌ Image upload error:', error)
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    const errorResponse = NextResponse.json({
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    }, { status: 500 })
    
    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value)
    })
    
    return errorResponse
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  console.log('🖼️ CORS preflight request received')
  
  const response = new NextResponse(null, { status: 200 })
  
  // Add CORS headers to preflight response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}