export interface TitleGenerationOptions {
  lyrics: string
  currentTitle?: string
  style?: string
  mood?: string
  genre?: string
  selectedGender?: string
}

export interface TitleGenerationResponse {
  title: string
  source: 'openai'
}

class TitleGenerationService {
  // Generate title using OpenAI GPT-4o-mini (primary and only method)
  async generateTitle(options: TitleGenerationOptions): Promise<TitleGenerationResponse> {
    try {
      console.log('🎯 Generating title with GPT-4o-mini...')
      
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: options.lyrics,
          currentTitle: options.currentTitle,
          style: options.style || 'pop',
          mood: options.mood || 'upbeat',
          genre: options.genre,
          selectedGender: options.selectedGender
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      const title = data.title || 'Untitled Song'
      
      console.log('✅ Title generated successfully:', title)
      return { title, source: 'openai' }
      
    } catch (error) {
      console.error('Title generation failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Unable to generate title. Please try again.')
    }
  }
}

// Export singleton instance
export const titleGenerationService = new TitleGenerationService()
export default titleGenerationService 