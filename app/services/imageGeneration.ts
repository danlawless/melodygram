export interface ImageGenerationOptions {
  prompt: string
  style?: string
  mood?: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResponse {
  imageUrl: string
  revisedPrompt?: string
  source: 'openai'
}

class ImageGenerationService {
  /**
   * Generate image using OpenAI DALL-E
   */
  async generateWithOpenAI(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: options.prompt,
          style: options.style,
          mood: options.mood,
          size: options.size || '1024x1024',
          quality: options.quality || 'standard'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      return {
        imageUrl: data.imageUrl,
        revisedPrompt: data.revisedPrompt,
        source: 'openai'
      }
    } catch (error) {
      console.error('OpenAI image generation failed:', error)
      throw error
    }
  }

  /**
   * Main method for image generation
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    if (!options.prompt || options.prompt.trim().length < 5) {
      throw new Error('Prompt is required and must be at least 5 characters long')
    }

    try {
      return await this.generateWithOpenAI(options)
    } catch (error) {
      console.error('Image generation failed:', error)
      throw new Error('Image generation failed. Please try again with a different prompt.')
    }
  }

  /**
   * Convert generated image URL to File object for upload
   * Note: This may fail due to CORS policies on external image URLs (like OpenAI)
   */
  async urlToFile(imageUrl: string, fileName: string = 'generated-avatar.png'): Promise<File> {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      return new File([blob], fileName, { type: blob.type || 'image/png' })
    } catch (error) {
      // Check if it's a CORS error (common with external image URLs)
      const isCorsError = error instanceof TypeError && error.message.includes('fetch')
      
      if (isCorsError) {
        // Don't log scary errors for expected CORS issues
        console.log('📝 Image URL to File conversion blocked by CORS (expected for external URLs)')
        throw new Error('CORS_BLOCKED')
      } else {
        // Log other unexpected errors
        console.error('Failed to convert URL to File:', error)
        throw new Error('Failed to process generated image')
      }
    }
  }

  /**
   * Get suggested prompts for avatar generation
   */
  getSuggestedPrompts(): string[] {
    return [
      "A professional headshot of a friendly person with a warm smile",
      "Portrait of a creative artist with an inspiring expression",
      "Headshot of a confident business professional",
      "Portrait of a musician with passionate eyes",
      "A smiling person with natural lighting and soft background",
      "Portrait of an elegant person with artistic flair",
      "Headshot of a charismatic speaker with engaging expression",
      "Portrait of a wise mentor with kind eyes"
    ]
  }

  /**
   * Get style options for image generation
   */
  getStyleOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '', label: 'Default' },
      { value: 'photorealistic', label: 'Photorealistic' },
      { value: 'portrait photography', label: 'Portrait Photography' },
      { value: 'studio lighting', label: 'Studio Lighting' },
      { value: 'natural lighting', label: 'Natural Lighting' },
      { value: 'professional headshot', label: 'Professional Headshot' },
      { value: 'artistic portrait', label: 'Artistic Portrait' },
      { value: 'cinematic', label: 'Cinematic' }
    ]
  }

  /**
   * Get mood options for image generation
   */
  getMoodOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '', label: 'Default' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'confident', label: 'Confident' },
      { value: 'warm', label: 'Warm' },
      { value: 'professional', label: 'Professional' },
      { value: 'creative', label: 'Creative' },
      { value: 'inspiring', label: 'Inspiring' },
      { value: 'charismatic', label: 'Charismatic' },
      { value: 'serene', label: 'Serene' }
    ]
  }
}

export const imageGenerationService = new ImageGenerationService() 