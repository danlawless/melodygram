import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface LyricsGenerationOptions {
  title?: string // Make title optional - generate from lyrics if not provided
  lengthInSeconds: number
  vocalGender?: 'male' | 'female'
  genre?: string
  mood?: string
  customPrompt?: string
  wordCountTarget?: { min: number, max: number }
  lyricsGuideline?: string
  provider?: 'openai' // Only GPT now
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Create length-aware lyrics prompt
 */
function createLyricsPrompt(options: LyricsGenerationOptions): string {
  const {
    title,
    lengthInSeconds,
    vocalGender = 'neutral',
    genre = 'pop',
    mood = 'upbeat',
    customPrompt,
    wordCountTarget,
    lyricsGuideline
  } = options

  let prompt = (title 
    ? `Create song lyrics for a ${lengthInSeconds}-second song titled "${title}".`
    : `Create song lyrics for a ${lengthInSeconds}-second ${genre} song with ${mood} mood.`) + `

CRITICAL REQUIREMENTS:
- Song duration: EXACTLY ${lengthInSeconds} seconds
- Target word count: ${wordCountTarget?.min}-${wordCountTarget?.max} words
- Structure: ${lyricsGuideline}
- Genre: ${genre}
- Mood: ${mood}
- Vocal style: ${vocalGender === 'male' ? 'Male vocals' : vocalGender === 'female' ? 'Female vocals' : 'Any vocals'}

LENGTH-SPECIFIC GUIDELINES:
${lyricsGuideline}

STYLE & MOOD DIRECTION:
- Write in ${genre} style with ${mood} energy
- Match the emotional tone to ${mood} throughout
- Use ${genre}-appropriate language and themes
- Consider ${genre} song structures and conventions

IMPORTANT FORMATTING:
- Use [Verse], [Chorus], [Bridge] markers for structure  
- Keep lines concise and singable for ${genre} style
- Focus on emotional impact that matches ${mood} feeling
- Each line should flow naturally when sung in ${genre} style

${customPrompt ? `\nAdditional creative direction: ${customPrompt}` : ''}

Generate ONLY the lyrics with structure markers. Make them perfect for a ${lengthInSeconds}-second ${genre} song with ${mood} mood.`

  return prompt
}

/**
 * Count words in lyrics (excluding structure markers)
 */
function countWords(lyrics: string): number {
  return lyrics
    .replace(/\[[\w\s]+\]/g, '') // Remove [Verse], [Chorus] etc.
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

/**
 * Generate title from lyrics if needed
 */
async function generateTitleFromLyrics(lyrics: string): Promise<string> {
  const titlePrompt = `Based on these song lyrics, suggest a catchy, memorable song title (just the title, nothing else):

${lyrics}

Title:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: titlePrompt }],
      max_tokens: 20,
      temperature: 0.8,
    })

    const title = response.choices[0]?.message?.content?.trim() || 'Untitled Song'
    // Strip any surrounding quotes that GPT might add
    return title.replace(/^["']|["']$/g, '')
  } catch (error) {
    console.error('Title generation failed:', error)
    return 'Untitled Song'
  }
}

export async function POST(request: NextRequest) {
  try {
    const options: LyricsGenerationOptions = await request.json()
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!options.lengthInSeconds) {
      return NextResponse.json(
        { error: 'lengthInSeconds is required' },
        { status: 400 }
      )
    }

    console.log(`🎵 Generating ${options.lengthInSeconds}s lyrics${options.title ? ` for "${options.title}"` : ''}`)

    const prompt = createLyricsPrompt(options)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional songwriter specializing in creating lyrics perfectly matched to specific song durations. You understand song structure, pacing, and how lyrics timing affects the final song length.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.lengthInSeconds <= 30 ? 200 : options.lengthInSeconds <= 60 ? 400 : 800,
      temperature: 0.8,
    })

    const lyrics = response.choices[0]?.message?.content?.trim() || ''
    
    if (!lyrics) {
      throw new Error('No lyrics generated')
    }

    const wordCount = countWords(lyrics)
    const structure = lyrics.match(/\[[\w\s]+\]/g)?.join(' → ') || 'Custom Structure'
    
    // Generate title from lyrics if not provided
    let finalTitle = options.title
    if (!options.title || options.title.trim() === '' || options.title === 'Untitled') {
      finalTitle = await generateTitleFromLyrics(lyrics)
    }

    console.log(`✅ Generated ${wordCount} words for ${options.lengthInSeconds}s song`)
    
    return NextResponse.json({
      lyrics,
      title: finalTitle,
      wordCount,
      structure,
      estimatedDuration: options.lengthInSeconds
    })

  } catch (error) {
    console.error('Lyrics generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Lyrics generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 