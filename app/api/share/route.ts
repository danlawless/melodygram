import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export interface ShareData {
  id: string
  videoUrl: string
  title: string
  lyrics?: string
  thumbnailUrl?: string
  duration?: number
  genre?: string
  mood?: string
  createdAt: string
  expiresAt?: string
  views: number
  isPublic: boolean
}

// In-memory storage for demo (in production, use a database)
const shareStorage = new Map<string, ShareData>()

// Generate a unique share ID
function generateShareId(): string {
  return randomBytes(16).toString('hex')
}

// Clean filename for better SEO
function createSEOFriendlySlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl, title, lyrics, thumbnailUrl, duration, genre, mood, jobId } = body

    if (!videoUrl || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl and title' },
        { status: 400 }
      )
    }

    // Generate unique share ID
    const shareId = generateShareId()
    const seoSlug = createSEOFriendlySlug(title)
    
    // Create share data
    const shareData: ShareData = {
      id: shareId,
      videoUrl,
      title,
      lyrics,
      thumbnailUrl,
      duration,
      genre,
      mood,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      views: 0,
      isPublic: true
    }

    // Store the share data
    shareStorage.set(shareId, shareData)

    // Create the shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    
    const shareUrl = `${baseUrl}/share/${shareId}/${seoSlug}`

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      expiresAt: shareData.expiresAt
    })

  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('id')

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      )
    }

    const shareData = shareStorage.get(shareId)

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      )
    }

    // Check if expired
    if (shareData.expiresAt && new Date() > new Date(shareData.expiresAt)) {
      shareStorage.delete(shareId)
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Increment view count
    shareData.views += 1
    shareStorage.set(shareId, shareData)

    return NextResponse.json({
      success: true,
      data: shareData
    })

  } catch (error) {
    console.error('Share retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve share data' },
      { status: 500 }
    )
  }
}

// Delete/expire share
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('id')

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      )
    }

    const deleted = shareStorage.delete(shareId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Share deleted successfully'
    })

  } catch (error) {
    console.error('Share deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    )
  }
}