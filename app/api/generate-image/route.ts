import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, mood, size = '1024x1024', quality = 'standard' } = await request.json()

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: 'Prompt is required and must be at least 5 characters long' },
        { status: 400 }
      )
    }

    // Construct an enhanced prompt for avatar/waist-up generation  
    let enhancedPrompt = `Create a high-quality waist-up image: ${prompt}`
    
    if (style) enhancedPrompt += `. Style: ${style}`
    if (mood) enhancedPrompt += `. Mood: ${mood}`
    
    enhancedPrompt += `. Professional waist-up portrait, business attire, properly clothed, medium shot framing, zoomed out to show upper body, not too close to face, professional lighting, clear features, suitable for avatar use, photorealistic, high detail`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: 'url'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI DALL-E API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Failed to generate image with OpenAI DALL-E' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const generatedImageUrl = data.data?.[0]?.url

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      imageUrl: generatedImageUrl,
      revisedPrompt: data.data?.[0]?.revised_prompt || enhancedPrompt
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during image generation' },
      { status: 500 }
    )
  }
} 