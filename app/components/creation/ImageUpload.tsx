'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, X, Sparkles, Loader2, User, Palette, Heart } from 'lucide-react'
import TipButton from '../ui/TipButton'
import { imageGenerationService } from '../../services/imageGeneration'

interface GeneratedAvatar {
  id: string
  imageUrl: string
  thumbnailUrl?: string // Smaller version for storage efficiency
  createdAt: string
  prompt: string
  style?: string
  mood?: string
  favorite?: boolean // Heart/favorite functionality
  isTemporaryUrl?: boolean // Flag to indicate URL may expire (GPT/DALL-E URLs)
  gender?: string // Track gender for voice/avatar matching (male/female)
}

interface ImageUploadProps {
  uploadedImage: File | null
  onImageUpload: (file: File | null) => void
  onImageGenerated?: (imageUrl: string | null) => void
  generatedImageUrl?: string | null // Add this prop
  showValidation?: boolean
  selectedGender?: string // Add gender prop for avatar generation
  onHistoryUpdate?: (history: GeneratedAvatar[], currentIndex: number) => void
}

export default function ImageUpload({ uploadedImage, onImageUpload, onImageGenerated, generatedImageUrl, showValidation = false, selectedGender, onHistoryUpdate }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedMood, setSelectedMood] = useState('')

  // Avatar history state
  const [avatarHistory, setAvatarHistory] = useState<GeneratedAvatar[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<GeneratedAvatar | null>(null)

  // File input reference  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session storage for avatar history
  const AVATAR_HISTORY_KEY = 'melodygram_avatar_history'

  // Load avatar history from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(AVATAR_HISTORY_KEY)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          
          // Handle both old format (direct array) and new format (with metadata)
          const avatars = Array.isArray(parsed) ? parsed : parsed.avatars || []
          
          // Add backward compatibility for existing avatars without favorite or gender fields
          const avatarsWithFavorites = avatars.map((avatar: GeneratedAvatar) => ({
            ...avatar,
            favorite: avatar.favorite || false,
            gender: avatar.gender || undefined // Keep undefined for legacy avatars without gender data
          }))
          
          // Migrate legacy avatars to use proxy URLs (reduces CORS errors)
          let needsMigration = false
          const migratedAvatars = avatarsWithFavorites.map((avatar: GeneratedAvatar) => {
            const isExternalUrl = avatar.imageUrl.includes('blob.core.windows.net') || 
                                 avatar.imageUrl.includes('oaidalleapiprodscus') ||
                                 avatar.imageUrl.includes('openai.com')
            
            if (isExternalUrl && !avatar.imageUrl.startsWith('/api/proxy-image')) {
              needsMigration = true
              const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(avatar.imageUrl)}`
              return {
                ...avatar,
                imageUrl: proxiedUrl,
                thumbnail: proxiedUrl,
                isTemporaryUrl: false,
              }
            }
            return avatar
          })
          
          setAvatarHistory(migratedAvatars)
          
          // Notify parent component about initial history
          if (onHistoryUpdate && migratedAvatars.length > 0) {
            onHistoryUpdate(migratedAvatars, 0) // Most recent avatar is at index 0
          }
          
          // Save migrated history back if needed
          if (needsMigration) {
            localStorage.setItem(AVATAR_HISTORY_KEY, JSON.stringify(migratedAvatars))
            console.log('✅ Migrated legacy avatar URLs to use proxy')
          }
          
          if (migratedAvatars.length > 0) {
            const mostRecentAvatar = migratedAvatars[0]
            setCurrentAvatar(mostRecentAvatar)
          }
        }
      } catch (error) {
        console.error('Failed to load avatar history:', error)
        // Clear corrupted data
        localStorage.removeItem(AVATAR_HISTORY_KEY)
      }
    }
  }, [])

  // Create a smaller thumbnail version of an image for history storage
  const createThumbnail = (imageUrl: string, maxSize: number = 128): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      // Check if it's an external URL that will likely cause CORS issues
      const isExternalUrl = imageUrl.includes('blob.core.windows.net') || 
                           imageUrl.includes('oaidalleapiprodscus') ||
                           (imageUrl.startsWith('https://') && !imageUrl.startsWith(window.location.origin))
      
      img.onload = () => {
        try {
          // Calculate dimensions to maintain aspect ratio
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          const width = img.width * ratio
          const height = img.height * ratio
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress the image
          ctx?.drawImage(img, 0, 0, width, height)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7) // 70% quality JPEG
          resolve(thumbnailUrl)
        } catch (error) {
          // CORS prevented thumbnail creation - fall back to original URL
          resolve(imageUrl)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image for thumbnail creation'))
      
      // For external URLs, set crossOrigin to try to avoid CORS
      if (isExternalUrl) {
        img.crossOrigin = 'anonymous'
      }
      
      img.src = imageUrl
    })
  }

  const saveAvatarHistory = async (avatars: GeneratedAvatar[]) => {
    if (typeof window !== 'undefined') {
      try {
        // Create thumbnail versions for storage efficiency
        const avatarsWithThumbnails = await Promise.all(
          avatars.map(async (avatar) => {
            if (!avatar.thumbnailUrl) {
              try {
                const thumbnailUrl = await createThumbnail(avatar.imageUrl, 96) // Smaller thumbnails to save storage
                return { ...avatar, thumbnailUrl }
              } catch (error) {
                console.warn('Failed to create thumbnail, using original:', error)
                return avatar
              }
            }
            return avatar
          })
        )
        
        const dataToStore = {
          avatars: avatarsWithThumbnails,
          lastUpdated: new Date().toISOString(),
          version: 1
        }
        
        localStorage.setItem(AVATAR_HISTORY_KEY, JSON.stringify(dataToStore))
        console.log(`💾 Avatar history saved (${avatarsWithThumbnails.length} avatars)`)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('⚠️ Storage quota exceeded, cleaning up old avatars...')
          
          // Try progressively smaller sets: 4, then 3, then 2
          for (const keepCount of [4, 3, 2]) {
            const reducedAvatars = avatars.slice(0, keepCount) // Keep most recent
            try {
              const reducedWithThumbnails = await Promise.all(
                reducedAvatars.map(async (avatar) => {
                  if (!avatar.thumbnailUrl) {
                    try {
                      const thumbnailUrl = await createThumbnail(avatar.imageUrl, 48) // Smaller thumbnails to save space
                      return { ...avatar, thumbnailUrl }
                    } catch (error) {
                      return avatar
                    }
                  }
                  return avatar
                })
              )
              
              const dataToStore = {
                avatars: reducedWithThumbnails,
                lastUpdated: new Date().toISOString(),
                version: 1
              }
              
              localStorage.setItem(AVATAR_HISTORY_KEY, JSON.stringify(dataToStore))
              console.log(`💾 Avatar history saved with reduced size (${reducedWithThumbnails.length} avatars)`)
              
              // Update state to match what was actually saved
              setAvatarHistory(reducedWithThumbnails)
              return // Success! Exit the function
            } catch (attemptError) {
              console.warn(`❌ Failed to save ${keepCount} avatars, trying smaller set...`)
              continue // Try next smaller count
            }
          }
          
          // If all attempts failed
          console.error('❌ Failed to save avatar history even with minimal avatars')
          // Clear the storage key to prevent corruption
          localStorage.removeItem(AVATAR_HISTORY_KEY)
        } else {
          console.error('Failed to save avatar history:', error)
        }
      }
    }
  }

  const addToAvatarHistory = async (avatar: GeneratedAvatar) => {
    // Keep favorites and limit non-favorites to total of 5
    const favorites = avatarHistory.filter(a => a.favorite)
    const nonFavorites = avatarHistory.filter(a => !a.favorite)
    const remainingSlots = Math.max(0, 5 - favorites.length - 1) // -1 for new avatar
    const keptNonFavorites = nonFavorites.slice(0, remainingSlots)
    
    const updatedHistory = [avatar, ...favorites, ...keptNonFavorites]
    setAvatarHistory(updatedHistory)
    setCurrentAvatar(avatar)
    await saveAvatarHistory(updatedHistory)
    
    // Notify parent component about history update
    if (onHistoryUpdate) {
      onHistoryUpdate(updatedHistory, 0) // New avatar is always at index 0
    }
  }

  // Toggle favorite status of an avatar
  const handleToggleFavorite = async (avatarId: string) => {
    const updatedHistory = avatarHistory.map(avatar => 
      avatar.id === avatarId ? { ...avatar, favorite: !avatar.favorite } : avatar
    )
    setAvatarHistory(updatedHistory)
    await saveAvatarHistory(updatedHistory)
    
    // Update current avatar if it's the one being favorited
    if (currentAvatar?.id === avatarId) {
      setCurrentAvatar(prev => prev ? { ...prev, favorite: !prev.favorite } : null)
    }
  }

  const switchToAvatar = (avatar: GeneratedAvatar) => {
    setCurrentAvatar(avatar)
    setPreview(avatar.imageUrl)
    if (onImageGenerated) {
      onImageGenerated(avatar.imageUrl)
    }
    
    // Find the index of the selected avatar and update parent navigation state
    const selectedIndex = avatarHistory.findIndex(a => a.id === avatar.id)
    if (onHistoryUpdate && selectedIndex !== -1) {
      onHistoryUpdate(avatarHistory, selectedIndex)
    }
  }

  // Sync external props with internal preview state
  useEffect(() => {
    if (generatedImageUrl) {
      setPreview(generatedImageUrl)
      console.log('🎨 ImageUpload: Set preview from generatedImageUrl prop')
    } else if (uploadedImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)  
        console.log('📸 ImageUpload: Set preview from uploadedImage prop')
      }
      reader.readAsDataURL(uploadedImage)
    } else {
      setPreview(null)
    }
  }, [uploadedImage, generatedImageUrl])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onImageUpload(file)
        // Notify parent that generated image was cleared
        if (onImageGenerated) {
          onImageGenerated(null)
        }
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }
    }
  }, [onImageUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageUpload(file)
      // Notify parent that generated image was cleared
      if (onImageGenerated) {
        onImageGenerated(null)
      }
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [onImageUpload])

  const removeImage = () => {
    onImageUpload(null)
    setPreview(null)
    // Notify parent that generated image was cleared
    if (onImageGenerated) {
      onImageGenerated(null)
    }
  }

  const handleGenerateAvatar = async () => {
    // =============== COMPREHENSIVE GENERATE BUTTON LOGGING ===============
    const generateContext = {
      timestamp: new Date().toISOString(),
      buttonType: 'AVATAR_GENERATION',
      user: {
        sessionId: Date.now(), // Simple session identifier
      },
      inputData: {
        customPrompt: customPrompt,
        selectedGender: selectedGender,
        selectedStyle: selectedStyle,
        selectedMood: selectedMood,
        hasUploadedImage: !!uploadedImage,
        currentAvatarCount: avatarHistory.length
      },
      formValidation: {
        hasCustomPrompt: customPrompt.trim().length > 0,
        hasSelectedGender: !!selectedGender,
        hasSelectedStyle: !!selectedStyle,
        hasSelectedMood: !!selectedMood
      },
      systemContext: {
        component: 'ImageUpload',
        handler: 'handleGenerateAvatar',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }

    console.log('🎨 =================== AVATAR GENERATE BUTTON CLICKED ===================')
    console.log('🎨 FULL CONTEXT:', JSON.stringify(generateContext, null, 2))
    console.log('🎨 ========================================================================')
    // =========================================================================

    setIsGenerating(true)
    setError(null)
    
    try {
      // Create a prompt based on custom input or use a default avatar prompt
      let prompt = customPrompt.trim()
      
      if (!prompt) {
        prompt = 'Professional waist-up portrait of a friendly person in business attire, properly clothed, warm smile, photorealistic, studio lighting, high quality'
      }

      // Add gender specification to the prompt if selected
      let genderPrompt = ''
      if (selectedGender === 'male') {
        genderPrompt = ', GENERATE MALE AVATAR'
      } else if (selectedGender === 'female') {
        genderPrompt = ', GENERATE FEMALE AVATAR'
      }

      const finalPrompt = `${prompt}, professional attire, properly clothed, waist-up photography style, clear facial features, upper body visible, suitable for avatar use${genderPrompt}`
      
      const imageGenParams = {
        prompt: finalPrompt,
        style: selectedStyle || 'photorealistic',
        mood: selectedMood || 'friendly',
        size: '1024x1024' as const,
        quality: 'hd' as const
      }

      console.log('🎨 =================== IMAGE GENERATION API CALL PARAMS ===================')
      console.log('🎨 Original Prompt:', prompt)
      console.log('🎨 Gender Addition:', genderPrompt)
      console.log('🎨 Final Prompt:', finalPrompt)
      console.log('🎨 PARAMETERS SENT TO IMAGE API:', JSON.stringify(imageGenParams, null, 2))
      console.log('🎨 =====================================================================')

      const response = await imageGenerationService.generateImage(imageGenParams)

      // Log generation success briefly
      console.log('🎨 Avatar generated successfully')
      
      if (response.imageUrl) {
        // Use proxied URL for better compatibility and to avoid CORS issues
        const imageUrlToUse = response.proxiedUrl || response.imageUrl
        
        // Set the generated image URL for display
        setPreview(imageUrlToUse)
        console.log(`✅ Using ${response.proxiedUrl ? 'proxied' : 'external'} URL for avatar display`)
        
        // Use the appropriate URL (proxied or original)
        const finalImageUrl = imageUrlToUse
        
        // Notify parent with the appropriate URL
        if (onImageGenerated) {
          onImageGenerated(imageUrlToUse)
        }

        // Add to avatar history (with appropriate URL)
        const newAvatar: GeneratedAvatar = {
          id: `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          imageUrl: finalImageUrl,
          createdAt: new Date().toISOString(),
          prompt: `${prompt}, waist-up photography style, clear facial features, upper body visible, suitable for avatar use${genderPrompt}`,
          style: selectedStyle || 'photorealistic',
          mood: selectedMood || 'friendly',
          favorite: false,
          isTemporaryUrl: !response.proxiedUrl, // Only external URLs are temporary
          gender: selectedGender // Track gender for voice/avatar matching
        }
        
        await addToAvatarHistory(newAvatar)
        
        // Only attempt file conversion for very specific use cases
        if (response.proxiedUrl) {
          // Only try file conversion for same-origin URLs
          try {
            const file = await imageGenerationService.urlToFile(response.imageUrl, 'generated-avatar.png')
            onImageUpload(file)
            console.log(`✅ Image converted to file: ${file.name} (${file.size} bytes)`)
          } catch (conversionError) {
            console.warn(`⚠️ Could not convert to file: ${conversionError}`)
          }
        }
      }
    } catch (error) {
      console.error('Error generating avatar:', error)
      setError('Failed to generate avatar. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-text-primary">Avatar</h2>
          {showValidation && (uploadedImage || generatedImageUrl) && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          <TipButton
            title="Avatar Generation"
            content="Upload an image or generate an AI avatar that captures the mood, style, or personality of your vocalist. This visual inspiration helps create the perfect singing avatar for your song."
            position="right"
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              showPromptInput 
                ? 'bg-melody-purple text-white border-melody-purple' 
                : 'bg-bg-secondary text-text-secondary border-border-subtle hover:text-text-primary hover:border-melody-purple/30'
            }`}
            title="Customize avatar prompt"
          >
            ✨ Custom
          </button>
          {/* Show Generate button in header only when custom options are hidden */}
          {!showPromptInput && (
            <button
              onClick={handleGenerateAvatar}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
    
      {/* Custom Prompt Input */}
      {showPromptInput && (
        <div className="space-y-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Avatar Personalization</h4>
            <button
              onClick={() => setShowPromptInput(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Avatar generation context info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-300 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>
                Creating a personalized avatar that matches your {selectedGender || 'vocal'} style with custom mood and appearance
              </span>
            </div>
          </div>
          
          {/* Description Textarea */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Avatar Description
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the avatar you want to generate (e.g., 'Professional waist-up shot of a friendly person, zoomed out to show torso and arms, warm smile')"
              className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              rows={4}
            />
          </div>
          
          {/* Style and Mood Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Style Dropdown */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Style
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              >
                {imageGenerationService.getStyleOptions().map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Mood Dropdown */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Mood
              </label>
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              >
                {imageGenerationService.getMoodOptions().map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              💡 Be specific for best results.
            </p>
            <button
              onClick={() => {
                setCustomPrompt('')
                setSelectedStyle('')
                setSelectedMood('')
                setError(null)
                setPreview(null)
                // Notify parent that generated image was cleared
                if (onImageGenerated) {
                  onImageGenerated(null)
                }
              }}
              className="text-melody-purple hover:text-melody-purple/80 underline transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Generate Button - Full Width at Bottom */}
          <div className="pt-2">
            <div className="mb-3 text-center">
              <span className="text-sm text-gray-400 bg-purple-500/20 px-3 py-1 rounded-full">
                {selectedStyle || 'photorealistic'} avatar with {selectedMood || 'friendly'} mood
              </span>
            </div>
            <button
              onClick={handleGenerateAvatar}
              disabled={isGenerating}
              className="w-full bg-melody-purple hover:bg-melody-purple/90 disabled:bg-melody-purple/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Avatar
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
            ${isDragOver 
              ? 'border-melody-pink bg-melody-pink/10 shadow-glow' 
              : showValidation && !uploadedImage
                ? 'border-amber-500 bg-amber-500/10 hover:border-amber-600'
                : 'border-melody-purple bg-gradient-to-br from-melody-purple/5 to-melody-pink/5 hover:border-melody-pink hover:shadow-glow'
            }
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-melody-gradient flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-text-primary">
                {isDragOver ? 'Drop your photo here!' : 'Upload'}
              </p>
              <p className="text-text-secondary">
                Drag and drop or tap to select your photo
              </p>
              <p className="text-sm text-text-muted">
                JPG, PNG up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-card aspect-square">
          <img
            src={preview}
            alt={generatedImageUrl ? "Generated avatar" : "Uploaded preview"}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn('🚫 Avatar image failed to load (likely expired URL):', preview)
              // Show a placeholder or regeneration hint
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement?.classList.add('expired-avatar')
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Remove button */}
          <button
            onClick={removeImage}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Image info overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-white">
              {generatedImageUrl ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Generated Avatar</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {uploadedImage?.name || 'Uploaded Image'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar History */}
      {avatarHistory.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Recent Avatars</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{avatarHistory.length} generation{avatarHistory.length !== 1 ? 's' : ''}</span>
              {avatarHistory.filter(a => a.favorite).length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-pink-400">
                    {avatarHistory.filter(a => a.favorite).length} ♥ favorited
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {avatarHistory.map((avatar, index) => {
              const isCurrentAvatar = currentAvatar?.id === avatar.id
              return (
                <div
                  key={avatar.id}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    isCurrentAvatar 
                      ? 'border-melody-purple shadow-lg ring-2 ring-melody-purple/50' 
                      : 'border-white/20 hover:border-melody-purple/50'
                  }`}
                >
                  {/* Main clickable area */}
                  <button
                    onClick={() => switchToAvatar(avatar)}
                    className="w-full h-full"
                    title={`Avatar Generation ${avatarHistory.length - index} • ${new Date(avatar.createdAt).toLocaleTimeString()}`}
                  >
                    <img
                      src={avatar.thumbnailUrl || avatar.imageUrl}
                      alt={`Avatar generation ${avatarHistory.length - index}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn('🚫 Avatar gallery image failed to load (likely expired URL):', avatar.imageUrl)
                        // Replace with a placeholder
                        e.currentTarget.style.display = 'none'
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerHTML = `
                            <div class="w-full h-full bg-gray-700 flex items-center justify-center">
                              <div class="text-gray-400 text-xs text-center">
                                <div>🚫</div>
                                <div>Expired</div>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  </button>
                  
                  {/* Heart/Favorite button - Upper left corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(avatar.id)
                    }}
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      avatar.favorite
                        ? 'bg-pink-500/90 border border-pink-300/50'
                        : 'bg-black/60 hover:bg-pink-500/20 border border-white/30'
                    }`}
                    title={avatar.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-3 h-3 ${avatar.favorite ? 'text-white fill-current' : 'text-white'}`} />
                  </button>
                  
                  {/* Generation number overlay - Upper right corner */}
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isCurrentAvatar 
                      ? 'bg-melody-purple text-white' 
                      : 'bg-black/60 text-white'
                  }`}>
                    {avatarHistory.length - index}
                  </div>
                  
                  {/* Active indicator */}
                  {isCurrentAvatar && (
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Click avatars to switch. Heart (💗) favorites to protect from deletion.</span>
            {avatarHistory.length >= 3 && (
              <button
                onClick={() => {
                  const confirmed = confirm('Clear avatar history? This will free up storage space.')
                  if (confirmed) {
                    setAvatarHistory([])
                    setCurrentAvatar(null)
                    localStorage.removeItem(AVATAR_HISTORY_KEY)
                    console.log('🧹 Avatar history cleared')
                  }
                }}
                className="text-red-400 hover:text-red-300 underline"
                title="Clear history to free up storage space"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 