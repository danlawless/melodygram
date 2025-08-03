// Enhanced lyrics generation with length awareness
export interface LyricsGenerationOptions {
  title?: string // Make title optional - will be generated from lyrics
  lengthInSeconds: number // New: Required song length
  vocalGender?: 'male' | 'female'
  genre?: string // Renamed from style for clarity
  mood?: string
  customPrompt?: string
}

export interface LyricsGenerationResult {
  lyrics: string
  title: string // Always returned - either provided or generated from lyrics
  wordCount: number
  structure: string
  estimatedDuration: number // Estimated duration based on lyrics
}

// Length-based lyrics guidelines
const getLyricsGuideline = (seconds: number): string => {
  if (seconds <= 15) {
    return "Create a very short, impactful verse (1-2 lines, hook only). Focus on a single powerful message or emotion."
  } else if (seconds <= 30) {
    return "Create a short verse with hook (3-4 lines total). Include a catchy hook and one supporting line."
  } else if (seconds <= 60) {
    return "Create a verse-chorus structure (8-12 lines). Include verse, hook/chorus, and optional bridge."
  } else if (seconds <= 120) {
    return "Create a full song structure (16-24 lines). Include verse, chorus, second verse, chorus, and optional bridge."
  } else {
    return "Create an extended song with multiple verses and choruses (24-32 lines). Include intro, verses, choruses, bridge, and outro."
  }
}

const getWordCountTarget = (seconds: number): { min: number, max: number } => {
  // Rough estimate: 2-3 words per second of vocals
  const wordsPerSecond = 2.5
  const targetWords = Math.floor(seconds * wordsPerSecond)
  
  return {
    min: Math.max(1, targetWords - 10),  
    max: targetWords + 10
  }
}

class LyricsGenerationService {
  /**
   * Generate lyrics using GPT with length awareness
   */
  async generateWithGPT(options: LyricsGenerationOptions): Promise<LyricsGenerationResult> {
    try {
      const wordCountTarget = getWordCountTarget(options.lengthInSeconds)
      const lyricsGuideline = getLyricsGuideline(options.lengthInSeconds)
      
      const response = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          wordCountTarget,
          lyricsGuideline,
          provider: 'openai' // Force GPT only
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to generate lyrics: ${response.status}`)
      }

      const result = await response.json()
      return {
        lyrics: result.lyrics,
        title: result.title,
        wordCount: result.wordCount,
        structure: result.structure,
        estimatedDuration: options.lengthInSeconds
      }
    } catch (error) {
      console.error('GPT lyrics generation failed:', error)
      throw error
    }
  }

  /**
   * Main generation method - now only uses GPT with length control
   */
  async generateLyrics(options: LyricsGenerationOptions): Promise<LyricsGenerationResult> {
    console.log(`🎵 Generating ${options.lengthInSeconds}s lyrics for "${options.title}"`)
    return this.generateWithGPT(options)
  }
}

export const lyricsGenerationService = new LyricsGenerationService() 