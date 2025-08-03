import axios from 'axios'

// Mureka API configuration
const MUREKA_API_BASE_URL = process.env.NEXT_PUBLIC_MUREKA_API_BASE_URL || 'https://platform.mureka.ai'
const API_TOKEN = process.env.MUREKA_API_TOKEN
const ACCOUNT_ID = process.env.MUREKA_ACCOUNT_ID

// Axios instance with default configuration
const murekaApi = axios.create({
  baseURL: MUREKA_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  },
})

// Types based on Mureka API structure
export interface MurekaVocal {
  id: string
  name: string
  description?: string
  voice_type?: string
  gender?: 'male' | 'female' | 'other'
  language?: string
  style?: string[]
  rating?: number
  is_popular?: boolean
  preview_url?: string
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface MurekaVocalsResponse {
  vocals: MurekaVocal[]
  total?: number
  page?: number
  limit?: number
}

// Types for lyrics generation
export interface LyricsGenerationRequest {
  prompt: string
  style?: string
  mood?: string
  genre?: string
  language?: string
}

export interface LyricsGenerationResponse {
  title: string
  lyrics: string
  status: string
  task_id?: string
}

// Singer interface adapted for our app
export interface Singer {
  id: string
  name: string
  description: string
  imageUrl: string
  voiceType: string
  specialties: string[]
  rating: number
  isPopular?: boolean
  gender?: 'male' | 'female' | 'other'
  language?: string
  previewUrl?: string
}

class MurekaApiService {
  /**
   * Generate lyrics using Mureka API
   */
  async generateLyrics(request: LyricsGenerationRequest): Promise<LyricsGenerationResponse> {
    try {
      const response = await murekaApi.post<LyricsGenerationResponse>('/v1/lyrics/generate', {
        prompt: request.prompt,
        ...(request.style && { style: request.style }),
        ...(request.mood && { mood: request.mood }),
        ...(request.genre && { genre: request.genre }),
        ...(request.language && { language: request.language }),
      })
      
      return response.data
    } catch (error) {
      console.error('Error generating lyrics with Mureka API:', error)
      throw new Error('Failed to generate lyrics. Please try again.')
    }
  }

  /**
   * Fetch all available vocals/singers from Mureka API
   */
  async getVocals(): Promise<Singer[]> {
    try {
      const response = await murekaApi.get<MurekaVocalsResponse>('/music/vocals')
      
      // Transform Mureka API response to our Singer interface
      return response.data.vocals.map(this.transformVocalToSinger)
    } catch (error) {
      console.error('Error fetching vocals from Mureka API:', error)
      
      // Return fallback data if API fails
      return this.getFallbackSingers()
    }
  }

  /**
   * Transform Mureka vocal object to our Singer interface
   */
  private transformVocalToSinger(vocal: MurekaVocal): Singer {
    return {
      id: vocal.id,
      name: vocal.name,
      description: vocal.description || `AI voice with ${vocal.voice_type || 'unique'} characteristics`,
      imageUrl: vocal.image_url || `/avatars/${vocal.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      voiceType: vocal.voice_type || 'Unknown',
      specialties: vocal.style || this.getSpecialtiesFromVoiceType(vocal.voice_type),
      rating: vocal.rating || 4.5,
      isPopular: vocal.is_popular || false,
      gender: vocal.gender,
      language: vocal.language || 'English',
      previewUrl: vocal.preview_url,
    }
  }

  /**
   * Get specialties based on voice type if no styles are provided
   */
  private getSpecialtiesFromVoiceType(voiceType?: string): string[] {
    const typeToSpecialties: Record<string, string[]> = {
      'soprano': ['Pop', 'Classical', 'Ballads'],
      'alto': ['Jazz', 'R&B', 'Soul'],
      'tenor': ['Rock', 'Pop', 'Musical Theatre'],
      'bass': ['Classical', 'Opera', 'Folk'],
      'mezzo-soprano': ['Indie', 'Folk', 'Alternative'],
      'baritone': ['Country', 'Rock', 'Blues'],
    }

    return typeToSpecialties[voiceType?.toLowerCase() || ''] || ['Pop', 'Various']
  }

  /**
   * Fallback singers data if API is unavailable
   */
  private getFallbackSingers(): Singer[] {
    return [
      {
        id: 'aria',
        name: 'Aria',
        description: 'Ethereal voice perfect for ballads and emotional songs',
        imageUrl: '/avatars/aria.jpg',
        voiceType: 'Soprano',
        specialties: ['Ballads', 'Pop', 'Classical'],
        rating: 4.9,
        isPopular: true,
        gender: 'female',
        language: 'English'
      },
      {
        id: 'jazz',
        name: 'Jazz',
        description: 'Smooth and soulful, brings warmth to every note',
        imageUrl: '/avatars/jazz.jpg', 
        voiceType: 'Alto',
        specialties: ['Jazz', 'Blues', 'R&B'],
        rating: 4.8,
        gender: 'female',
        language: 'English'
      },
      {
        id: 'rock',
        name: 'Rock',
        description: 'Powerful and energetic voice for high-energy songs',
        imageUrl: '/avatars/rock.jpg',
        voiceType: 'Tenor',
        specialties: ['Rock', 'Pop', 'Alternative'],
        rating: 4.7,
        gender: 'male',
        language: 'English'
      },
      {
        id: 'harmony',
        name: 'Harmony',
        description: 'Gentle and melodic, perfect for indie and acoustic',
        imageUrl: '/avatars/harmony.jpg',
        voiceType: 'Mezzo-soprano',
        specialties: ['Indie', 'Acoustic', 'Folk'],
        rating: 4.8,
        isPopular: true,
        gender: 'female',
        language: 'English'
      }
    ]
  }

  /**
   * Get moods and genres available from Mureka
   */
  async getMoodsAndGenres() {
    try {
      const response = await murekaApi.get('/music/moods-and-genres')
      return response.data
    } catch (error) {
      console.error('Error fetching moods and genres:', error)
      return {
        moods: ['happy', 'sad', 'energetic', 'calm', 'romantic', 'melancholic'],
        genres: ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'r&b']
      }
    }
  }

  /**
   * Search vocals by criteria
   */
  async searchVocals(query: string, filters?: {
    gender?: string
    language?: string
    style?: string
  }): Promise<Singer[]> {
    try {
      const vocals = await this.getVocals()
      
      return vocals.filter(singer => {
        const matchesQuery = !query || 
          singer.name.toLowerCase().includes(query.toLowerCase()) ||
          singer.description.toLowerCase().includes(query.toLowerCase()) ||
          singer.specialties.some(s => s.toLowerCase().includes(query.toLowerCase()))

        const matchesGender = !filters?.gender || singer.gender === filters.gender
        const matchesLanguage = !filters?.language || singer.language === filters.language
        const matchesStyle = !filters?.style || 
          singer.specialties.some(s => s.toLowerCase().includes(filters.style!.toLowerCase()))

        return matchesQuery && matchesGender && matchesLanguage && matchesStyle
      })
    } catch (error) {
      console.error('Error searching vocals:', error)
      return []
    }
  }
}

// Export singleton instance
export const murekaApiService = new MurekaApiService()
export default murekaApiService 