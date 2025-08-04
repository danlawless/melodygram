import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lyrics, currentTitle, style, mood, genre, selectedGender } = await request.json()

    if (!lyrics || lyrics.trim().length < 10) {
      return NextResponse.json(
        { error: 'Lyrics are required and must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Construct a focused prompt for title generation that emphasizes lyrics analysis
    let prompt = `Please carefully read and analyze these song lyrics to create the perfect title:\n\n"${lyrics}"\n\n`
    
    prompt += `ANALYSIS INSTRUCTIONS:
1. Read through the entire lyrics carefully
2. Identify the main themes, emotions, and story
3. Find the key phrases or concepts that stand out
4. Consider the overall message and feeling of the song
5. Create a title that captures the essence of what you analyzed\n\n`
    
    if (style) prompt += `Musical Style: ${style}\n`
    if (mood) prompt += `Intended Mood: ${mood}\n`
    if (genre) prompt += `Genre: ${genre}\n`
    if (selectedGender) {
      if (selectedGender === 'male') {
        prompt += `Vocal Perspective: Male voice - consider masculine themes and perspectives from the lyrics\n`
      } else if (selectedGender === 'female') {
        prompt += `Vocal Perspective: Female voice - consider feminine themes and perspectives from the lyrics\n`
      }
    }
    if (currentTitle) prompt += `Current title: "${currentTitle}" (IMPORTANT: Create a completely different title - do NOT repeat or reuse this title)\n`
    
    prompt += `\nTITLE REQUIREMENTS:
- Maximum 5 words
- Must be based on your analysis of the provided lyrics
- Catchy and memorable
- Captures the core essence of what you found in the lyrics
- Suitable for the given musical context
- Return ONLY the title, no quotes or explanation

Based on your analysis of the lyrics above, generate the perfect title:`

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
            content: 'You are a creative songwriter who specializes in analyzing lyrics and crafting memorable, catchy song titles. Your job is to carefully read and analyze the provided lyrics to understand their themes, emotions, story, and key messages, then create a perfect title that captures the essence of those lyrics.'
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