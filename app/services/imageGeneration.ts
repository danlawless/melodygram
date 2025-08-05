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
  proxiedUrl?: string // URL served through our proxy to avoid CORS issues
  originalUrl?: string // Original OpenAI URL before permanent storage
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
      
      console.log('🖼️ OpenAI image generated, downloading and storing permanently...')
      
      try {
        // Download the image immediately and store it via ngrok
        const permanentUrl = await this.storeImagePermanently(data.imageUrl)
        
        console.log('✅ Image stored permanently:', permanentUrl)
        
        return {
          imageUrl: permanentUrl,    // Use permanent ngrok URL as primary
          proxiedUrl: permanentUrl,  // Same permanent URL (no expiration)
          revisedPrompt: data.revisedPrompt,
          source: 'openai',
          originalUrl: data.imageUrl // Keep original for reference
        }
      } catch (storageError) {
        console.warn('⚠️ Failed to store image permanently, using temporary URL:', storageError)
        
        // Fallback to proxied URL if permanent storage fails
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`
        
        return {
          imageUrl: data.imageUrl,   // Original external URL
          proxiedUrl: proxiedUrl,    // Our proxied URL (temporary)
          revisedPrompt: data.revisedPrompt,
          source: 'openai'
        }
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
   * Store image permanently via backend API (avoids CORS issues)
   */
  async storeImagePermanently(imageUrl: string): Promise<string> {
    try {
      console.log('🖼️ Frontend: Calling backend to store image permanently...')
      console.log('🖼️ Frontend: OpenAI URL:', imageUrl)
      
      // Call our backend API to download and store the image
      // Backend can fetch OpenAI URLs without CORS restrictions
      const response = await fetch('/api/store-image-permanently', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Backend storage failed: ${response.status} - ${errorData.details || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(`Backend storage failed: ${data.error}`)
      }
      
      console.log('✅ Frontend: Image stored permanently via backend:', data.permanentUrl)
      return data.permanentUrl
      
    } catch (error) {
      console.error('❌ Frontend: Failed to store image permanently:', error)
      throw error
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
        throw new Error('CORS_BLOCKED')
      } else {
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
      "Professional waist-up portrait of a friendly person in business attire, warm smile",
      "Medium shot of a creative artist, properly clothed, inspiring expression",
      "Waist-up view of a confident business professional in formal wear, not close-up",
      "Professional portrait of a musician in casual clothing, passionate expression",
      "Waist-up shot of a smiling person in professional attire, natural lighting"
    ]
  }

  /**
   * Get style options for image generation
   */
  getStyleOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '', label: 'Default' },
      { value: 'photorealistic', label: 'Photorealistic' },
      { value: 'waist-up photography', label: 'Portrait Photography' },
      { value: 'studio lighting', label: 'Studio Lighting' },
      { value: 'natural lighting', label: 'Natural Lighting' },
      { value: 'professional medium shot', label: 'Professional Headshot' },
      { value: 'artistic waist-up', label: 'Artistic Portrait' },
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