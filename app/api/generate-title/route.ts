import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lyrics, currentTitle, style, mood, genre } = await request.json()

    if (!lyrics || lyrics.trim().length < 10) {
      return NextResponse.json(
        { error: 'Lyrics are required and must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Construct a focused prompt for title generation
    let prompt = `Generate a catchy, memorable song title (5 words or less) based on these lyrics:\n\n"${lyrics}"\n\n`
    
    if (style) prompt += `Style: ${style}\n`
    if (mood) prompt += `Mood: ${mood}\n`
    if (genre) prompt += `Genre: ${genre}\n`
    if (currentTitle) prompt += `Current title: "${currentTitle}" (IMPORTANT: Generate a completely different title - do NOT repeat or reuse this title)\n`
    
    prompt += `\nRequirements:
- Maximum 5 words
- Catchy and memorable
- Captures the essence of the lyrics
- Suitable for the given style/mood
- Return ONLY the title, no quotes or explanation`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative songwriter who specializes in crafting memorable, catchy song titles. Generate titles that are concise, emotional, and capture the essence of the lyrics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 20,
        temperature: 0.8,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Failed to generate title with OpenAI' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const generatedTitle = data.choices?.[0]?.message?.content?.trim()

    if (!generatedTitle) {
      return NextResponse.json(
        { error: 'No title generated' },
        { status: 500 }
      )
    }

    // Clean up the title (remove quotes if present)
    const cleanTitle = generatedTitle.replace(/^["']|["']$/g, '').trim()

    return NextResponse.json({ title: cleanTitle })

  } catch (error) {
    console.error('Title generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during title generation' },
      { status: 500 }
    )
  }
} 