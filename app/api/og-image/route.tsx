import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'MelodyGram'
    const subtitle = searchParams.get('subtitle') || 'AI Singing Avatar'
    const views = searchParams.get('views') || '0'
    const duration = searchParams.get('duration') || '30s'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)',
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '800px',
              textAlign: 'center',
              padding: '60px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '24px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Logo/Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                fontSize: '40px',
              }}
            >
              🎵
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 16px 0',
                lineHeight: '1.2',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '24px',
                color: 'rgba(255,255,255,0.9)',
                margin: '0 0 32px 0',
                fontWeight: '500',
              }}
            >
              {subtitle}
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                }}
              >
                <span>👁️</span>
                <span>{views} views</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                }}
              >
                <span>⏱️</span>
                <span>{duration}</span>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                padding: '16px 32px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              ✨ Create Your Own MelodyGram
            </div>
          </div>

          {/* Brand Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              🎵
            </div>
            <span>MelodyGram</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error('OG Image generation error:', e.message)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}