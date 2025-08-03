import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { style, mood } = await request.json()

    // Create a prompt for GPT-4o-mini to generate creative avatar descriptions
    const systemPrompt = `You are a creative AI avatar prompt generator. Generate imaginative, diverse, and appealing portrait descriptions for DALL-E 3 avatar generation.

Guidelines:
- Create prompts for professional, artistic, or creative portraits
- Focus on facial expressions, lighting, and overall aesthetic
- Include diverse ethnicities, ages, and styles naturally
- Keep descriptions concise but vivid (1-2 sentences max)
- Avoid specifying exact physical features unless it's about artistic style
- Make it suitable for profile pictures/avatars
- Be inclusive and avoid stereotypes

Generate ONE creative avatar prompt that would result in an appealing profile picture.`

    let userPrompt = `Generate a creative avatar prompt`
    
    if (style || mood) {
      userPrompt += ` with`
      if (style) userPrompt += ` ${style} style`
      if (style && mood) userPrompt += ` and`
      if (mood) userPrompt += ` ${mood} mood`
    }
    
    userPrompt += `. Return ONLY the prompt text, no explanations or quotes.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.8, // Higher creativity
    })

    const prompt = completion.choices[0]?.message?.content?.trim()

    if (!prompt) {
      throw new Error('No prompt generated')
    }

    // Clean up the prompt (remove quotes if present)
    const cleanPrompt = prompt.replace(/^["']|["']$/g, '').trim()

    return NextResponse.json({ 
      prompt: cleanPrompt,
      style,
      mood
    })

  } catch (error) {
    console.error('Avatar prompt generation error:', error)
    
    // Return a fallback prompt instead of erroring
    const fallbackPrompts = [
      "A warm and approachable portrait with soft natural lighting and genuine smile",
      "Professional headshot with confident expression and modern studio lighting",
      "Artistic portrait with creative composition and inspiring expression",
      "Friendly portrait with natural smile and warm, welcoming atmosphere",
      "Contemporary portrait with clean aesthetic and engaging expression"
    ]
    
    const fallbackPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]
    
    return NextResponse.json({ 
      prompt: fallbackPrompt,
      style: '',
      mood: '',
      fallback: true
    })
  }
} 