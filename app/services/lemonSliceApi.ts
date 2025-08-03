import axios from 'axios'

// LemonSlice API configuration - using Next.js API routes to avoid CORS
const LEMONSLICE_API_BASE_URL = '/api/lemonslice'

// Axios instance with default configuration
const lemonSliceApi = axios.create({
  baseURL: LEMONSLICE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for video processing
})

// Types for LemonSlice API (v2)
export interface CreateAvatarRequest {
  image: string // Image URL (must be publicly accessible)
  audio: string // Audio URL (must be publicly accessible)
  title?: string // Song title for display purposes
  songLength?: number // Song length in seconds for better avatar timing
  model?: 'V2.5' // Model version (using V2.5, not V2.7)
  resolution?: '256' | '320' | '512' // Output resolution (standard resolutions only)
  animation_style?: 'autoselect' | 'face_only' | 'entire_image' // Animation style
  expressiveness?: number // 0-1, higher = more emotion
  crop_head?: boolean // Focus on head region
}

export interface AvatarCreationResponse {
  job_id: string // Job ID for polling
  status: string // Initial status (usually 'queued' or 'processing')
  img_url?: string
  audio_url?: string
  resolution?: string
  crop_head?: boolean
  whole_body_mode?: boolean
  animation_style?: string
  expressiveness?: number
  model?: string
}

export interface AvatarTaskStatus {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error'
  progress?: number // 0-100
  video_url?: string // Available when completed
  thumbnail_url?: string
  duration?: number
  created_at?: number
  completed_at?: number
  error_message?: string
  failure_reason?: string
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
   * Create a talking avatar from image and audio URLs
   */
  async createAvatar(request: CreateAvatarRequest): Promise<AvatarCreationResponse> {
    try {
      const response = await lemonSliceApi.post<AvatarCreationResponse>('/avatar/create', {
        image: request.image,
        audio: request.audio,
        model: request.model || 'V2.5',
        resolution: request.resolution || '320', // Use 320px for faster processing and lower costs 
        animation_style: request.animation_style || 'autoselect',
        expressiveness: request.expressiveness || 0.8,
        crop_head: request.crop_head || false
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
   * Query the status of an avatar creation job
   */
  async getTaskStatus(jobId: string): Promise<AvatarTaskStatus> {
    try {
      const response = await lemonSliceApi.get<AvatarTaskStatus>(`/avatar/task/${jobId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching avatar job status:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message
        throw new Error(`Failed to get job status: ${errorMessage}`)
      }
      throw new Error('Failed to get job status. Please try again.')
    }
  }

  /**
   * Wait for task completion with polling and progress updates
   */
  async waitForCompletion(
    taskId: string, 
    onProgress?: (progress: number, status: string) => void,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<AvatarTaskStatus> {
    const startTime = Date.now()
    let retryCount = 0
    const maxRetries = 10 // Allow up to 10 retries for 404s
    
    console.log(`🔄 Starting to poll for job completion: ${taskId}`)

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getTaskStatus(taskId)
          
          // Reset retry count on successful status fetch
          retryCount = 0
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(status.progress, status.status)
          }

          // Check if completed or failed
          if (status.status === 'completed') {
            console.log(`✅ Job ${taskId} completed successfully`)
            resolve(status)
            return
          }
          
          if (status.status === 'failed') {
            console.log(`❌ Job ${taskId} failed`)
            reject(new Error(`Avatar generation failed: ${status.error_message || 'Unknown error'}`))
            return
          }

          // Continue polling for pending/processing jobs
          if (Date.now() - startTime < maxWaitTime) {
            console.log(`🔄 Job ${taskId} still ${status.status}, continuing to poll...`)
            setTimeout(poll, 2000) // Poll every 2 seconds
          } else {
            reject(new Error('Avatar generation timed out'))
          }

        } catch (error) {
          console.log(`⚠️ Error polling job ${taskId}:`, error)
          
          // Handle 404 errors specially - newly created jobs might not be visible immediately
          if (error instanceof Error && error.message.includes('404')) {
            retryCount++
            console.log(`🔄 Job ${taskId} not found (attempt ${retryCount}/${maxRetries}), retrying...`)
            
            if (retryCount <= maxRetries && Date.now() - startTime < maxWaitTime) {
              // Use exponential backoff for retries: 2s, 4s, 6s, 8s, etc.
              const delay = Math.min(2000 + (retryCount * 2000), 10000)
              setTimeout(poll, delay)
              return
            }
          }
          
          // If we've exhausted retries or it's not a 404, fail
          if (retryCount > maxRetries) {
            reject(new Error(`Job ${taskId} not found after ${maxRetries} attempts. It may have been created but not yet visible in the API.`))
          } else {
            reject(error)
          }
        }
      }

      // Start polling with a small initial delay to give the job time to appear in the API
      setTimeout(poll, 3000) // Wait 3 seconds before first poll
    })
  }

  /**
   * Get available avatar animation presets
   */
  async getPresets(): Promise<AvatarPreset[]> {
    try {
      const response = await lemonSliceApi.get<{ presets: AvatarPreset[] }>('/presets')
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
    options?: Partial<CreateAvatarRequest>
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