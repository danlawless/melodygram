import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering since we handle file uploads and environment variables
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload audio endpoint called')
    console.log('📤 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    const formData = await request.formData()
    console.log('📤 FormData received')
    
    const audioFile = formData.get('audio') as File
    console.log('📤 Audio file extracted:', {
      name: audioFile?.name,
      size: audioFile?.size,
      type: audioFile?.type
    })
    
    if (!audioFile) {
      console.error('❌ No audio file in request')
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }
    
    // Create unique filename with proper extension
    const fileId = uuidv4().substring(0, 8)
    const fileExtension = audioFile.name.endsWith('.mp3') ? 'mp3' : 'wav'
    const fileName = `clipped_${fileId}.${fileExtension}`
    
    // Create public uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'temp-audio')
    console.log('📤 Creating directory:', uploadsDir)
    await mkdir(uploadsDir, { recursive: true })
    console.log('✅ Directory created/verified')
    
    // Save file
    const filePath = join(uploadsDir, fileName)
    console.log('📤 Saving file to:', filePath)
    const arrayBuffer = await audioFile.arrayBuffer()
    console.log('📤 Converting to buffer, size:', arrayBuffer.byteLength)
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
      console.log('⚠️ WARNING: Using localhost URL - LemonSlice API cannot access this!')
      console.log('💡 For local development, set NGROK_URL environment variable')
    }
    
    const publicUrl = `${baseUrl}/temp-audio/${fileName}`
    console.log('🌍 Final audio URL for external access:', publicUrl)
    
    console.log('✅ Uploaded clipped audio:', publicUrl)
    
    // Schedule cleanup after 1 hour
    setTimeout(async () => {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(filePath)
        console.log('🧹 Cleaned up temp audio file:', fileName)
      } catch (error) {
        console.warn('Could not clean up file:', fileName)
      }
    }, 60 * 60 * 1000) // 1 hour
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName
    })
    
  } catch (error) {
    console.error('❌ Audio upload error:', error)
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    return NextResponse.json({
      error: 'Failed to upload audio',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    }, { status: 500 })
  }
}