import axios from 'axios'

// Mureka API configuration
const MUREKA_API_BASE_URL = 'https://api.mureka.ai'
const API_TOKEN = 'op_mdv80rml6C9Ja67QJEB3Pf32QXKc9b2'

// Axios instance with default configuration
const murekaApi = axios.create({
  baseURL: MUREKA_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  },
})

// Rate limiting for Mureka API to prevent 429 errors
class MurekaRateLimiter {
  private lastCallTime = 0
  private minInterval = 3000 // 3 seconds between calls

  async waitForTurn(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall
      console.log(`⏱️ Mureka rate limiting: waiting ${waitTime}ms before next API call`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastCallTime = Date.now()
  }
}

const murekaRateLimiter = new MurekaRateLimiter()

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

// Types for reference tracks and song generation
export interface ReferenceTrack {
  id: string
  title: string
  genre: string
  mood: string
  duration: number
  description: string
  previewUrl?: string
  isPopular?: boolean
}

export interface SongGenerationParams {
  lyrics?: string
  style?: string
  title?: string
  referenceTrack?: string
  mood?: string
  genre?: string
  duration?: number
}

export interface SongGenerationResponse {
  id: string
  created_at: number
  model: string
  status: 'preparing' | 'processing' | 'completed' | 'failed' | 'error'
  trace_id: string
  songUrl?: string
  audio_url?: string
  message?: string
}

interface SongGenerationOptions {
  lyrics: string
  gender?: 'male' | 'female'
  lengthInSeconds?: number // New: Target song duration
}

interface SongGenerationResult {
  audioUrl: string
  hasFlac: boolean
  hasLyricsData: boolean
  duration?: number
  actualDuration?: number // Actual duration returned by Mureka
}

class MurekaApiService {
  /**
   * Generate lyrics using Mureka API
   */
  async generateLyrics(request: LyricsGenerationRequest): Promise<LyricsGenerationResponse> {
    try {
      // Wait for rate limiter
      await murekaRateLimiter.waitForTurn()
      
      const response = await murekaApi.post<LyricsGenerationResponse>('/v1/lyrics/generate', {
        prompt: request.prompt,
        ...(request.style && { style: request.style }),
        ...(request.mood && { mood: request.mood }),
        ...(request.genre && { genre: request.genre }),
        ...(request.language && { language: request.language }),
      })
      
      return response.data
    } catch (error: any) {
      console.error('Error generating lyrics with Mureka API:', error)
      
      // Handle rate limit errors specifically
      if (error.response?.status === 429) {
        throw new Error('Rate limit reached. Please wait a moment before generating again.')
      }
      
      // Handle other API errors
      if (error.response?.status >= 400) {
        throw new Error(`API error (${error.response.status}): ${error.response.data?.message || 'Please try again.'}`)
      }
      
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

  /**
   * Generate a song using Mureka API with proper lyrics/prompt separation
   */
  async generateSong(params: {
    lyrics: string
    prompt?: string
    model?: string
  }) {
    try {
      // Wait for rate limiter
      await murekaRateLimiter.waitForTurn()
      
      console.log(`🎵 Starting Mureka song generation`)
      console.log(`🎵 Lyrics (${params.lyrics.length} chars):`, params.lyrics.substring(0, 100) + '...')
      console.log(`🎵 Prompt:`, params.prompt)

      const requestBody: any = {
        lyrics: params.lyrics, // Pure lyrics only
        model: params.model || 'auto'
      }

      // Add prompt if provided
      if (params.prompt) {
        requestBody.prompt = params.prompt
      }

      const response = await murekaApi.post('/v1/song/generate', requestBody)
      
      return response.data
    } catch (error: any) {
      console.error('Error generating song:', error)
      
      // Handle rate limit errors specifically
      if (error.response?.status === 429) {
        throw new Error('Rate limit reached. Please wait a moment before generating another song.')
      }
      
      // Handle other API errors
      if (error.response?.status >= 400) {
        throw new Error(`API error (${error.response.status}): ${error.response.data?.message || 'Please try again.'}`)
      }
      
      throw new Error('Failed to generate song. Please try again.')
    }
  }

  /**
   * Query the status of a song generation task
   */
  async querySongTask(taskId: string) {
    try {
      const response = await murekaApi.get(`/v1/song/query/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error querying song task:', error)
      throw new Error('Failed to get song status.')
    }
  }

  /**
   * Get reference tracks for custom generation
   */
  async getReferenceTracksAndGenres() {
    try {
      const response = await murekaApi.get('/music/moods-and-genres')
      return {
        genres: response.data.genres || this.getFallbackGenres(),
        moods: response.data.moods || this.getFallbackMoods(),
        referenceTracks: this.getFallbackReferenceTracks()
      }
    } catch (error) {
      console.error('Error fetching reference data:', error)
      return {
        genres: this.getFallbackGenres(),
        moods: this.getFallbackMoods(),
        referenceTracks: this.getFallbackReferenceTracks()
      }
    }
  }

  /**
   * Upload a reference track file
   */
  async uploadReferenceTrack(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await murekaApi.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error uploading reference track:', error)
      throw new Error('Failed to upload reference track.')
    }
  }

  /**
   * Get fallback genres if API is unavailable
   */
  private getFallbackGenres(): string[] {
    return [
      'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'R&B', 
      'Country', 'Folk', 'Blues', 'Reggae', 'Alternative', 'Indie', 'Funk'
    ]
  }

  /**
   * Get fallback moods if API is unavailable
   */
  private getFallbackMoods(): string[] {
    return [
      'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Melancholic', 
      'Uplifting', 'Dreamy', 'Intense', 'Chill', 'Mysterious', 'Playful'
    ]
  }

  /**
   * Get fallback reference tracks
   */
  private getFallbackReferenceTracks(): ReferenceTrack[] {
    return [
      {
        id: 'ref-1',
        title: 'Upbeat Pop Anthem',
        genre: 'Pop',
        mood: 'Energetic',
        duration: 180,
        description: 'Modern pop sound with catchy hooks and uplifting energy',
        previewUrl: '/audio/ref-pop-anthem.mp3',
        isPopular: true
      },
      {
        id: 'ref-2', 
        title: 'Acoustic Ballad',
        genre: 'Folk',
        mood: 'Romantic',
        duration: 210,
        description: 'Gentle acoustic guitar with emotional storytelling',
        previewUrl: '/audio/ref-acoustic-ballad.mp3',
        isPopular: true
      },
      {
        id: 'ref-3',
        title: 'Electronic Dance',
        genre: 'Electronic',
        mood: 'Energetic',
        duration: 150,
        description: 'High-energy electronic beats perfect for dancing',
        previewUrl: '/audio/ref-electronic-dance.mp3'
      },
      {
        id: 'ref-4',
        title: 'Jazz Standard',
        genre: 'Jazz',
        mood: 'Chill',
        duration: 240,
        description: 'Smooth jazz with sophisticated harmonies',
        previewUrl: '/audio/ref-jazz-standard.mp3'
      },
      {
        id: 'ref-5',
        title: 'Rock Power Ballad',
        genre: 'Rock',
        mood: 'Intense',
        duration: 270,
        description: 'Powerful rock ballad with soaring melodies',
        previewUrl: '/audio/ref-rock-ballad.mp3'
      },
      {
        id: 'ref-6',
        title: 'Hip-Hop Beat',
        genre: 'Hip-Hop',
        mood: 'Confident',
        duration: 165,
        description: 'Modern hip-hop with strong rhythmic foundation',
        previewUrl: '/audio/ref-hiphop-beat.mp3'
      }
    ]
  }

  /**
   * Create duration instruction for Mureka
   */
  private createDurationInstruction(seconds: number): string {
    if (seconds <= 15) {
      return `IMPORTANT: Generate a VERY SHORT song of exactly ${seconds} seconds. Keep it minimal - just a quick hook or chorus.`
    } else if (seconds <= 30) {
      return `IMPORTANT: Generate a SHORT song of exactly ${seconds} seconds. Brief verse and chorus only.`
    } else if (seconds <= 60) {
      return `IMPORTANT: Generate a song of exactly ${seconds} seconds (1 minute). Standard verse-chorus structure.`
    } else if (seconds <= 120) {
      return `IMPORTANT: Generate a song of exactly ${seconds} seconds (2 minutes). Full structure with verse, chorus, second verse, chorus.`
    } else {
      return `IMPORTANT: Generate a song of exactly ${seconds} seconds (${Math.floor(seconds/60)} minutes). Extended structure with multiple verses, choruses, and bridge.`
    }
  }
}



// Export singleton instance
export const murekaApiService = new MurekaApiService()
export default murekaApiService 