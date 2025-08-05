import { Metadata } from 'next'
import { ShareData } from '../../../api/share/route'

interface ShareLayoutProps {
  children: React.ReactNode
  params: {
    shareId: string
    slug: string
  }
}

async function getShareData(shareId: string): Promise<ShareData | null> {
  try {
    // In production, this would be a database call
    // For now, we'll make an API call to our own endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/share?id=${shareId}`, {
      cache: 'no-store' // Don't cache for fresh data
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Failed to fetch share data for metadata:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { shareId: string, slug: string } }): Promise<Metadata> {
  const shareData = await getShareData(params.shareId)
  
  if (!shareData) {
    return {
      title: 'MelodyGram - AI Singing Avatars',
      description: 'Transform your photos into singing avatars with AI-generated music',
    }
  }

  const title = `${shareData.title} - MelodyGram`
  const description = shareData.lyrics 
    ? `Watch this amazing AI-generated singing avatar: "${shareData.lyrics.slice(0, 100)}..."`
    : 'Check out this amazing AI-generated singing avatar created with MelodyGram!'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                 'http://localhost:3000'
  
  const shareUrl = `${baseUrl}/share/${params.shareId}/${params.slug}`

  return {
    title,
    description,
    
    // Open Graph tags for social media sharing
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: 'MelodyGram',
      type: 'video.other',
      videos: [
        {
          url: shareData.videoUrl,
          type: 'video/mp4',
          width: 1920,
          height: 1080,
        }
      ],
      images: shareData.thumbnailUrl ? [
        {
          url: shareData.thumbnailUrl,
          width: 1920,
          height: 1080,
          alt: shareData.title,
        }
      ] : [
        {
          url: `${baseUrl}/api/og-image?title=${encodeURIComponent(shareData.title)}`,
          width: 1200,
          height: 630,
          alt: shareData.title,
        }
      ],
    },

    // Twitter Card tags
    twitter: {
      card: 'player',
      title,
      description,
      creator: '@melodygram',
      site: '@melodygram',
      players: [
        {
          playerUrl: shareUrl,
          streamUrl: shareData.videoUrl,
          width: 1920,
          height: 1080,
        }
      ],
      images: shareData.thumbnailUrl ? [shareData.thumbnailUrl] : undefined,
    },

    // Additional SEO tags
    keywords: [
      'AI singing avatar',
      'AI music generation',
      'talking avatar',
      'custom songs',
      'AI video',
      'MelodyGram',
      shareData.genre,
      shareData.mood,
    ].filter(Boolean).join(', '),

    // Schema.org structured data
    other: {
      'og:video:type': 'video/mp4',
      'og:video:width': '1920',
      'og:video:height': '1080',
      'music:duration': shareData.duration?.toString(),
      'music:album': 'MelodyGram Creations',
      'article:author': 'MelodyGram AI',
      'article:published_time': shareData.createdAt,
    },
  }
}

export default function ShareLayout({ children, params }: ShareLayoutProps) {
  return (
    <>
      {children}
      
      {/* JSON-LD structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `Shared MelodyGram - ${params.slug}`,
            description: 'AI-generated singing avatar video created with MelodyGram',
            uploadDate: new Date().toISOString(),
            duration: 'PT30S', // Default duration
            thumbnailUrl: '/api/og-image?title=MelodyGram',
            embedUrl: `/share/${params.shareId}/${params.slug}`,
            publisher: {
              '@type': 'Organization',
              name: 'MelodyGram',
              logo: {
                '@type': 'ImageObject',
                url: '/logo.png'
              }
            }
          })
        }}
      />
    </>
  )
}