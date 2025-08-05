import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export async function POST(request: NextRequest) {
  let gender, style, mood
  
  try {
    const requestData = await request.json()
    gender = requestData.gender
    style = requestData.style
    mood = requestData.mood

    // Create a prompt for GPT-4o-mini to generate creative avatar descriptions
    const systemPrompt = `You are a creative AI avatar prompt generator. Generate imaginative, diverse, and appealing waist-up descriptions for DALL-E 3 avatar generation.

Guidelines:
- Create prompts for professional, artistic, or creative waist-up shots
- Focus on facial expressions, body language, lighting, and overall aesthetic
- Include diverse ethnicities, ages, and styles naturally
- Keep descriptions concise but vivid (1-2 sentences max)
- Avoid specifying exact physical features unless it's about artistic style
- Make it suitable for profile pictures/avatars with waist-up framing
- Use medium shot framing showing upper body in professional attire - NOT close-up on face
- Ensure the person is properly clothed in business or casual wear, zoomed out enough to show from waist up, not tight facial crops
- Be inclusive and avoid stereotypes
- When gender is specified, use appropriate terms (man/woman) naturally in the description

Generate ONE creative avatar prompt that would result in an appealing waist-up profile picture.`

    let userPrompt = `Generate a creative avatar prompt`
    
    if (gender || style || mood) {
      userPrompt += ` with`
      if (gender) {
        const genderTerm = gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person'
        userPrompt += ` a ${genderTerm}`
      }
      if (gender && (style || mood)) userPrompt += `,`
      if (style) userPrompt += ` ${style} style`
      if (style && mood) userPrompt += ` and`
      if (mood) userPrompt += ` ${mood} mood`
    }
    
    userPrompt += `. Return ONLY the prompt text, no explanations or quotes.`

    const openaiClient = getOpenAIClient()
    if (!openaiClient) {
      throw new Error('OpenAI client not available')
    }

    const completion = await openaiClient.chat.completions.create({
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
      gender,
      style,
      mood
    })

  } catch (error) {
    console.error('Avatar prompt generation error:', error)
    
    // Return a fallback prompt instead of erroring
    const fallbackPrompts = [
      "Warm and approachable waist-up portrait, properly clothed in business attire, soft natural lighting, genuine smile",
      "Professional medium shot from waist up, wearing formal business clothing, confident expression, modern studio lighting",
      "Artistic waist-up composition, dressed in professional attire, creative framing, inspiring expression",
      "Friendly medium shot from waist up, wearing casual professional clothing, natural smile, warm welcoming atmosphere",
      "Contemporary waist-up view, properly dressed in business wear, clean aesthetic, engaging expression"
    ]
    
    const fallbackPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]
    
    return NextResponse.json({ 
      prompt: fallbackPrompt,
      gender: gender || '',
      style: style || '',
      mood: mood || '',
      fallback: true
    })
  }
} 