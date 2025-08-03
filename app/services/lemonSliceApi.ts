import axios from 'axios'

// LemonSlice API configuration
const LEMONSLICE_API_BASE_URL = process.env.NEXT_PUBLIC_LEMONSLICE_API_BASE_URL || 'https://lemonslice.com/api'
const LEMONSLICE_API_KEY = process.env.LEMONSLICE_API_KEY || 'sk-1990426d-aff0-4c6d-ab38-6aea2af25018'

// Axios instance with default configuration
const lemonSliceApi = axios.create({
  baseURL: LEMONSLICE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LEMONSLICE_API_KEY}`,
  },
  timeout: 120000, // 2 minutes timeout for video processing
})

// Types for LemonSlice API
export interface AvatarCreationRequest {
  image: string // base64 encoded image or image URL
  audio: string // audio file URL or base64 encoded audio
  language?: string // Language code (e.g., 'en', 'es', 'fr')
  animation?: 'natural' | 'expressive' | 'subtle' // Animation style
  background?: 'studio' | 'transparent' | 'original' // Background option
  quality?: 'standard' | 'high' | 'ultra' // Quality setting
}

export interface AvatarCreationResponse {
  task_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration?: number
  created_at: string
  completed_at?: string
  error_message?: string
  progress?: number // 0-100
}

export interface AvatarTaskStatus {
  task_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  video_url?: string
  thumbnail_url?: string
  duration?: number
  created_at: string
  completed_at?: string
  error_message?: string
  estimated_completion?: string
}

export interface AvatarPreset {
  id: string
  name: string
  description: string
  animation_type: string
  preview_url?: string
}

class LemonSliceApiService {
  /**
   * Create a talking avatar from image and audio
   */
  async createAvatar(request: AvatarCreationRequest): Promise<AvatarCreationResponse> {
    try {
      const response = await lemonSliceApi.post<AvatarCreationResponse>('/avatar/create', {
        image: request.image,
        audio: request.audio,
        language: request.language || 'en',
        animation: request.animation || 'natural',
        background: request.background || 'studio',
        quality: request.quality || 'high'
      })
      
      return response.data
    } catch (error) {
      console.error('Error creating avatar with LemonSlice API:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Failed to create avatar: ${errorMessage}`)
      }
      throw new Error('Failed to create avatar. Please try again.')
    }
  }

  /**
   * Query the status of an avatar creation task
   */
  async getTaskStatus(taskId: string): Promise<AvatarTaskStatus> {
    try {
      const response = await lemonSliceApi.get<AvatarTaskStatus>(`/avatar/task/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching avatar task status:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Failed to get task status: ${errorMessage}`)
      }
      throw new Error('Failed to get task status. Please try again.')
    }
  }

  /**
   * Poll task status until completion or failure
   */
  async waitForCompletion(
    taskId: string, 
    onProgress?: (progress: number, status: string) => void,
    maxWaitTime: number = 300000 // 5 minutes default
  ): Promise<AvatarTaskStatus> {
    const startTime = Date.now()
    const pollInterval = 3000 // 3 seconds

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getTaskStatus(taskId)
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(status.progress, status.status)
          }

          // Check if completed or failed
          if (status.status === 'completed') {
            resolve(status)
            return
          }
          
          if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Avatar creation failed'))
            return
          }

          // Check timeout
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Avatar creation timed out'))
            return
          }

          // Continue polling
          setTimeout(poll, pollInterval)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }

  /**
   * Get available avatar animation presets
   */
  async getPresets(): Promise<AvatarPreset[]> {
    try {
      const response = await lemonSliceApi.get<{ presets: AvatarPreset[] }>('/avatar/presets')
      return response.data.presets || []
    } catch (error) {
      console.error('Error fetching avatar presets:', error)
      // Return default presets if API fails
      return this.getDefaultPresets()
    }
  }

  /**
   * Helper method to convert file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/jpeg;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Helper method to upload image and get URL (if LemonSlice supports direct upload)
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await lemonSliceApi.post<{ url: string }>('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url
    } catch (error) {
      console.warn('Direct image upload failed, falling back to base64:', error)
      // Fallback to base64 encoding
      return `data:${file.type};base64,${await this.fileToBase64(file)}`
    }
  }

  /**
   * Create avatar with automatic file handling
   */
  async createAvatarFromFiles(
    imageFile: File,
    audioUrl: string,
    options?: Partial<AvatarCreationRequest>
  ): Promise<AvatarCreationResponse> {
    try {
      // Handle image - try upload first, fallback to base64
      let imageData: string
      try {
        imageData = await this.uploadImage(imageFile)
      } catch {
        imageData = await this.fileToBase64(imageFile)
      }

      return await this.createAvatar({
        image: imageData,
        audio: audioUrl,
        ...options
      })
    } catch (error) {
      console.error('Error creating avatar from files:', error)
      throw error
    }
  }

  /**
   * Default presets fallback
   */
  private getDefaultPresets(): AvatarPreset[] {
    return [
      {
        id: 'natural',
        name: 'Natural',
        description: 'Natural speaking animation with subtle movements',
        animation_type: 'natural'
      },
      {
        id: 'expressive',
        name: 'Expressive',
        description: 'More animated with expressive gestures and movements',
        animation_type: 'expressive'
      },
      {
        id: 'subtle',
        name: 'Subtle',
        description: 'Minimal animation focusing on lip sync',
        animation_type: 'subtle'
      }
    ]
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await lemonSliceApi.get('/health')
      return true
    } catch (error) {
      console.warn('LemonSlice API health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const lemonSliceApiService = new LemonSliceApiService()
export default lemonSliceApiService 