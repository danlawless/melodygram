import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }
    
    // Create unique filename with proper extension
    const fileId = uuidv4().substring(0, 8)
    const fileExtension = audioFile.name.endsWith('.mp3') ? 'mp3' : 'wav'
    const fileName = `clipped_${fileId}.${fileExtension}`
    
    // Create public uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'temp-audio')
    await mkdir(uploadsDir, { recursive: true })
    
    // Save file
    const filePath = join(uploadsDir, fileName)
    const arrayBuffer = await audioFile.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))
    
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
    return NextResponse.json({
      error: 'Failed to upload audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}