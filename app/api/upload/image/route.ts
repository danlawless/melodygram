import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageUrl = formData.get('imageUrl') as string
    const filename = formData.get('filename') as string || 'avatar-image.png'

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log('🖼️ Fetching image from URL:', imageUrl)

    // Fetch the image from the temporary URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/png'

    console.log(`📦 Image fetched: ${imageBuffer.byteLength} bytes, type: ${contentType}`)

    // For now, we'll convert to base64 and return it
    // In production, you'd want to upload to a permanent storage like AWS S3, Cloudinary, etc.
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64Image}`

    // TODO: Upload to permanent storage here
    // const permanentUrl = await uploadToS3(imageBuffer, filename, contentType)

    console.log('✅ Image processed successfully')

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      dataUrl: dataUrl,
      size: imageBuffer.byteLength,
      contentType: contentType,
      filename: filename
    })

  } catch (error) {
    console.error('❌ Image upload failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 