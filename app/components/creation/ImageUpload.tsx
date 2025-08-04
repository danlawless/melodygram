'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, X, Sparkles, Loader2, User, Palette, Heart } from 'lucide-react'
import TipButton from '../ui/TipButton'
import { imageGenerationService } from '../../services/imageGeneration'

interface ImageUploadProps {
  uploadedImage: File | null
  onImageUpload: (file: File | null) => void
  onImageGenerated?: (imageUrl: string | null) => void
  generatedImageUrl?: string | null // Add this prop
  showValidation?: boolean
  selectedGender?: string // Add gender prop for avatar generation
}

export default function ImageUpload({ uploadedImage, onImageUpload, onImageGenerated, generatedImageUrl, showValidation = false, selectedGender }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedMood, setSelectedMood] = useState('')

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setIsGenerating(true)
    setError(null)
    
    try {
      // Create a prompt based on custom input or use a default avatar prompt
      let prompt = customPrompt.trim()
      
      if (!prompt) {
        prompt = 'A professional headshot portrait of a friendly person with a warm smile, photorealistic, studio lighting, high quality'
      }

      // Add gender specification to the prompt if selected
      let genderPrompt = ''
      if (selectedGender === 'male') {
        genderPrompt = ', GENERATE MALE AVATAR'
      } else if (selectedGender === 'female') {
        genderPrompt = ', GENERATE FEMALE AVATAR'
      }

      const response = await imageGenerationService.generateImage({
        prompt: `${prompt}, portrait photography style, clear facial features, suitable for avatar use${genderPrompt}`,
        style: selectedStyle || 'photorealistic',
        mood: selectedMood || 'friendly',
        size: '1024x1024',
        quality: 'hd'
      })
      
      if (response.imageUrl) {
        // Set the generated image URL for display (temporary)
        setPreview(response.imageUrl)
        console.log(`🎨 Avatar generated successfully! Converting to permanent URL...`)
        
        // Convert temporary DALL-E URL to permanent data URL to avoid expiration
        try {
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            body: (() => {
              const formData = new FormData()
              formData.append('imageUrl', response.imageUrl)
              formData.append('filename', 'generated-avatar.png')
              return formData
            })()
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            const permanentUrl = uploadData.dataUrl // Use the base64 data URL
            
            // Update preview with permanent URL
            setPreview(permanentUrl)
            console.log(`✅ Avatar converted to permanent URL (${Math.round(uploadData.size / 1024)}KB)`)
            
            // Notify parent with permanent URL
            if (onImageGenerated) {
              onImageGenerated(permanentUrl)
            }
          } else {
            console.warn('⚠️ Failed to convert to permanent URL, using temporary URL')
            // Fallback to temporary URL
            if (onImageGenerated) {
              onImageGenerated(response.imageUrl)
            }
          }
        } catch (conversionError) {
          console.warn('⚠️ Failed to convert to permanent URL:', conversionError)
          // Fallback to temporary URL
          if (onImageGenerated) {
            onImageGenerated(response.imageUrl)
          }
        }
        
        // Check if this is an external URL that will definitely fail CORS
        const isExternalUrl = response.imageUrl.includes('blob.core.windows.net') || 
                             response.imageUrl.includes('openai.com') ||
                             !response.imageUrl.startsWith(window.location.origin)
        
        if (isExternalUrl) {
          // Skip file conversion for external URLs to avoid CORS errors
          console.log(`🔒 External image URL detected - skipping file conversion to avoid CORS errors. Image URL available for display.`)
        } else {
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
              placeholder="Describe the avatar you want to generate (e.g., 'A professional headshot of a friendly person with a warm smile')"
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
    </div>
  )
} 