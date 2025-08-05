'use client'

import React, { useState, useRef, useCallback } from 'react'
import { 
  User, 
  Upload, 
  Sparkles, 
  Loader2, 
  X, 
  RefreshCw,
  Camera,
  Palette
} from 'lucide-react'
import { imageGenerationService, ImageGenerationOptions } from '../../services/imageGeneration'
import { useToast } from '../ui/Toast'

interface AvatarEditorProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  onClose: () => void
}

export default function AvatarEditor({ currentAvatar, onAvatarChange, onClose }: AvatarEditorProps) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null)
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [showCustomOptions, setShowCustomOptions] = useState(false)

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please select an image file (PNG, JPG, etc.)'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File too large',
        message: 'Please select an image smaller than 10MB'
      })
      return
    }

    try {
      // Convert file to data URL for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setGeneratedAvatar(dataUrl)
        onAvatarChange(dataUrl)
        showToast({
          type: 'success',
          title: 'Avatar uploaded!',
          message: 'Your new profile photo has been set.'
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Failed to upload your image. Please try again.'
      })
    }
  }, [onAvatarChange, showToast])

  // Handle avatar generation
  const handleGenerateAvatar = useCallback(async (prompt?: string) => {
    setIsGenerating(true)
    
    try {
      // Use provided prompt or generate one with selected options
      const finalPrompt = prompt || await generateAvatarPrompt(selectedGender, selectedStyle, selectedMood)

      const options: ImageGenerationOptions = {
        prompt: finalPrompt,
        style: selectedStyle,
        mood: selectedMood,
        size: '1024x1024', // Square for avatars
        quality: 'hd'
      }

      const result = await imageGenerationService.generateImage(options)
      setGeneratedAvatar(result.imageUrl)
      onAvatarChange(result.imageUrl)
      
      showToast({
        type: 'success',
        title: 'Avatar generated!',
        message: 'Your AI-powered profile photo is ready.'
      })
    } catch (error) {
      console.error('Error generating avatar:', error)
      showToast({
        type: 'error',
        title: 'Generation failed',
        message: 'Failed to generate avatar. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedGender, selectedStyle, selectedMood, onAvatarChange, showToast])

  // Generate creative avatar prompt using GPT-4o-mini
  const generateAvatarPrompt = async (gender: string, style: string, mood: string): Promise<string> => {
    try {
      const response = await fetch('/api/generate-avatar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, style, mood })
      })
      
      if (!response.ok) throw new Error('Failed to generate prompt')
      
      const data = await response.json()
      return data.prompt
    } catch (error) {
      console.error('Error generating avatar prompt:', error)
      // Fallback to a default prompt
      const genderTerm = gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person'
      return `Professional and friendly waist-up shot of a ${genderTerm}, zoomed out to show torso and arms, ${mood || 'warm'} expression, ${style || 'natural lighting'}`
    }
  }

  // Get gender options
  const getGenderOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: '', label: 'Any' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ]
  }

  // Get suggested prompts for quick generation
  const suggestedPrompts = imageGenerationService.getSuggestedPrompts()
  const genderOptions = getGenderOptions()
  const styleOptions = imageGenerationService.getStyleOptions()
  const moodOptions = imageGenerationService.getMoodOptions()

  // Current avatar to display
  const displayAvatar = generatedAvatar || currentAvatar

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-primary border border-border-subtle rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-text-primary">Avatar Editor</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Avatar Preview */}
          <div className="text-center space-y-4">
            <div className="w-32 h-32 rounded-full mx-auto overflow-hidden border-4 border-melody-purple/20 shadow-glow">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-melody-gradient flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 p-4 bg-bg-secondary border border-border-subtle rounded-xl hover:border-melody-purple/30 transition-all group"
            >
              <Upload className="w-5 h-5 text-melody-purple group-hover:scale-110 transition-transform" />
              <span className="font-medium text-text-primary">Upload Photo</span>
            </button>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateAvatar()}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Options Toggle */}
          <button
            onClick={() => setShowCustomOptions(!showCustomOptions)}
            className="w-full flex items-center justify-center gap-2 p-3 text-melody-purple hover:bg-melody-purple/10 rounded-xl transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showCustomOptions ? 'Hide' : 'Show'} Custom Options
            </span>
          </button>

          {/* Custom Options Panel */}
          {showCustomOptions && (
            <div className="space-y-4 p-4 bg-bg-secondary rounded-xl border border-border-subtle">
              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full melody-dropdown"
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full melody-dropdown"
                >
                  {styleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Mood</label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full melody-dropdown"
                >
                  {moodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quick Prompt Suggestions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary">Quick Suggestions</h3>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleGenerateAvatar(prompt)}
                  disabled={isGenerating}
                  className="text-left p-3 bg-bg-secondary border border-border-subtle rounded-lg hover:border-melody-purple/30 transition-all text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Regenerate Button (if avatar exists) */}
          {displayAvatar && (
            <button
              onClick={() => handleGenerateAvatar()}
              disabled={isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating ? 'Generating...' : 'Regenerate'}
              </span>
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
} 