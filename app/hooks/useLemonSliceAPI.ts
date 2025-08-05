import { useState, useCallback } from 'react'
import { lemonSliceApiService, CreateAvatarRequest, AvatarTaskStatus, AvatarPreset } from '../services/lemonSliceApi'

interface UseLemonSliceAPIReturn {
  // State
  isCreating: boolean
  progress: number
  error: string | null
  currentTask: string | null
  avatarUrl: string | null
  presets: AvatarPreset[]
  
  // Actions
  createAvatar: (request: CreateAvatarRequest) => Promise<string | null>
  createAvatarFromFiles: (imageFile: File, audioUrl: string, options?: Partial<CreateAvatarRequest>) => Promise<string | null>
  checkTaskStatus: (taskId: string) => Promise<AvatarTaskStatus | null>
  loadPresets: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export function useLemonSliceAPI(): UseLemonSliceAPIReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [presets, setPresets] = useState<AvatarPreset[]>([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setIsCreating(false)
    setProgress(0)
    setError(null)
    setCurrentTask(null)
    setAvatarUrl(null)
  }, [])

  const loadPresets = useCallback(async () => {
    try {
      const loadedPresets = await lemonSliceApiService.getPresets()
      setPresets(loadedPresets)
    } catch (err) {
      console.warn('Failed to load presets:', err)
      // Don't set error for preset loading failure
    }
  }, [])

  const createAvatar = useCallback(async (request: CreateAvatarRequest): Promise<string | null> => {
    try {
      setIsCreating(true)
      setProgress(0)
      setError(null)
      setAvatarUrl(null)

      // Start avatar creation
      const response = await lemonSliceApiService.createAvatar(request)
      setCurrentTask(response.job_id)

      // Note: Initial response won't have video_url, need to poll for completion

      // Wait for completion with progress updates
      const result = await lemonSliceApiService.waitForCompletion(
        response.job_id,
        (progressValue, status) => {
          setProgress(progressValue)
          console.log(`Avatar creation progress: ${progressValue}% (${status})`)
        }
      )

      if (result.video_url) {
        setAvatarUrl(result.video_url)
        setProgress(100)
        return result.video_url
      } else {
        throw new Error('Avatar creation completed but no video URL received')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create avatar'
      setError(errorMessage)
      console.error('Avatar creation failed:', err)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  const createAvatarFromFiles = useCallback(async (
    imageFile: File, 
    audioUrl: string, 
    options?: Partial<CreateAvatarRequest>
  ): Promise<string | null> => {
    try {
      setIsCreating(true)
      setProgress(0)
      setError(null)
      setAvatarUrl(null)

      // Start avatar creation with file handling
      const response = await lemonSliceApiService.createAvatarFromFiles(
        imageFile,
        audioUrl,
        options
      )
      
      setCurrentTask(response.job_id)

      // Note: Initial response won't have video_url, need to poll for completion

      // Wait for completion with progress updates
      const result = await lemonSliceApiService.waitForCompletion(
        response.job_id,
        (progressValue, status) => {
          setProgress(progressValue)
          console.log(`Avatar creation progress: ${progressValue}% (${status})`)
        }
      )

      if (result.video_url) {
        setAvatarUrl(result.video_url)
        setProgress(100)
        return result.video_url
      } else {
        throw new Error('Avatar creation completed but no video URL received')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create avatar'
      setError(errorMessage)
      console.error('Avatar creation from files failed:', err)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  const checkTaskStatus = useCallback(async (taskId: string): Promise<AvatarTaskStatus | null> => {
    try {
      const status = await lemonSliceApiService.getTaskStatus(taskId)
      setProgress(status.progress)
      
      if (status.status === 'completed' && status.video_url) {
        setAvatarUrl(status.video_url)
        setIsCreating(false)
      } else if (status.status === 'failed') {
        setError(status.error_message || 'Avatar creation failed')
        setIsCreating(false)
      }
      
      return status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check task status'
      setError(errorMessage)
      console.error('Failed to check task status:', err)
      return null
    }
  }, [])

  return {
    // State
    isCreating,
    progress,
    error,
    currentTask,
    avatarUrl,
    presets,
    
    // Actions
    createAvatar,
    createAvatarFromFiles,
    checkTaskStatus,
    loadPresets,
    clearError,
    reset
  }
} 