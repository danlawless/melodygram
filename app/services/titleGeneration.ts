import { murekaApiService } from './murekaApi'

export interface TitleGenerationOptions {
  lyrics: string
  currentTitle?: string
  style?: string
  mood?: string
  genre?: string
}

export interface TitleGenerationResponse {
  title: string
  source: 'mureka' | 'openai'
}

class TitleGenerationService {
  // Generate title using Mureka API
  async generateWithMureka(options: TitleGenerationOptions): Promise<string> {
    try {
      const prompt = `Generate a catchy song title (5 words or less) for these lyrics: "${options.lyrics.slice(0, 500)}..."`
      
      const response = await murekaApiService.generateLyrics({
        prompt,
        style: options.style,
        mood: options.mood,
        genre: options.genre
      })
      
      return response.title || 'Untitled Song'
    } catch (error) {
      console.error('Mureka title generation failed:', error)
      throw error
    }
  }

  // Generate title using OpenAI GPT-4o-mini as fallback
  async generateWithOpenAI(options: TitleGenerationOptions): Promise<string> {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: options.lyrics,
          currentTitle: options.currentTitle,
          style: options.style,
          mood: options.mood,
          genre: options.genre
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.title || 'Untitled Song'
    } catch (error) {
      console.error('OpenAI title generation failed:', error)
      throw error
    }
  }

  // Main method that tries Mureka first, then OpenAI as fallback
  async generateTitle(options: TitleGenerationOptions): Promise<TitleGenerationResponse> {
    if (!options.lyrics || options.lyrics.trim().length < 10) {
      throw new Error('Lyrics are required and must be at least 10 characters long')
    }

    // Try Mureka first
    try {
      const title = await this.generateWithMureka(options)
      return { title, source: 'mureka' }
    } catch (murekaError) {
      console.warn('Mureka failed, trying OpenAI fallback:', murekaError)
      
      // Fallback to OpenAI
      try {
        const title = await this.generateWithOpenAI(options)
        return { title, source: 'openai' }
      } catch (openaiError) {
        console.error('Both title generation methods failed:', { murekaError, openaiError })
        throw new Error('Title generation failed. Please try again or enter a title manually.')
      }
    }
  }
}

export const titleGenerationService = new TitleGenerationService() 