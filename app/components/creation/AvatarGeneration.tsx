'use client'

import React, { useState, useEffect } from 'react'
import { useLemonSliceAPI } from '../../hooks/useLemonSliceAPI'
import { AvatarPreset } from '../../services/lemonSliceApi'

interface AvatarGenerationProps {
  imageFile: File | null
  generatedAudioUrl: string | null // From Mureka API
  onAvatarComplete: (videoUrl: string) => void
  className?: string
}

export default function AvatarGeneration({
  imageFile,
  generatedAudioUrl,
  onAvatarComplete,
  className = ''
}: AvatarGenerationProps) {
  const {
    isCreating,
    progress,
    error,
    avatarUrl,
    presets,
    createAvatarFromFiles,
    loadPresets,
    clearError,
    reset
  } = useLemonSliceAPI()

  const [selectedPreset, setSelectedPreset] = useState<string>('natural')
  const [selectedBackground, setSelectedBackground] = useState<'studio' | 'transparent' | 'original'>('studio')
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'neutral'>('neutral')

  // Load presets on mount
  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  // Handle avatar completion
  useEffect(() => {
    if (avatarUrl) {
      onAvatarComplete(avatarUrl)
    }
  }, [avatarUrl, onAvatarComplete])

  const handleGenderSelect = (gender: 'male' | 'female' | 'neutral') => {
    setSelectedGender(gender)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const generatePrompt = (gender: 'male' | 'female' | 'neutral'): string => {
    switch (gender) {
      case 'male':
        return 'GENERATE MALE AVATAR'
      case 'female':
        return 'GENERATE FEMALE AVATAR'
      case 'neutral':
      default:
        return '' // No specific gender instruction
    }
  }

  const handleCreateAvatar = async () => {
    if (!imageFile || !generatedAudioUrl) {
      return
    }

    clearError()
    
    try {
      const prompt = generatePrompt(selectedGender)
      
      await createAvatarFromFiles(imageFile, generatedAudioUrl, {
        animation_style: selectedPreset as 'autoselect' | 'face_only' | 'entire_image',
        resolution: selectedQuality as '256' | '320' | '512',
        expressiveness: 0.7, // Default expressiveness
        title: 'Generated Avatar',
        ...(prompt && { title: prompt })
      })
    } catch (err) {
      console.error('Failed to create avatar:', err)
    }
  }

  const canCreateAvatar = imageFile && generatedAudioUrl && !isCreating

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Create Singing Avatar</h3>
        {isCreating && (
          <div className="flex items-center space-x-2 text-sm text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>Creating avatar...</span>
          </div>
        )}
      </div>

      {/* Prerequisites Check */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${imageFile ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className={`text-sm ${imageFile ? 'text-green-400' : 'text-gray-400'}`}>
            Image uploaded
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${generatedAudioUrl ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className={`text-sm ${generatedAudioUrl ? 'text-green-400' : 'text-gray-400'}`}>
            Song generated
          </span>
        </div>
      </div>

      {/* Configuration Options */}
      {canCreateAvatar && !isCreating && (
        <div className="space-y-4 mb-6">
          {/* Animation Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Animation Style
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full melody-dropdown"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-gray-900 text-white">
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>

          {/* Background */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Background
            </label>
            <select
              value={selectedBackground}
              onChange={(e) => setSelectedBackground(e.target.value as 'studio' | 'transparent' | 'original')}
              className="w-full melody-dropdown"
            >
              <option value="studio" className="bg-gray-900 text-white">Studio Background</option>
              <option value="transparent" className="bg-gray-900 text-white">Transparent Background</option>
              <option value="original" className="bg-gray-900 text-white">Original Background</option>
            </select>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quality
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value as 'standard' | 'high' | 'ultra')}
              className="w-full melody-dropdown"
            >
              <option value="standard" className="bg-gray-900 text-white">Standard Quality</option>
              <option value="high" className="bg-gray-900 text-white">High Quality</option>
              <option value="ultra" className="bg-gray-900 text-white">Ultra Quality</option>
            </select>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Avatar Gender Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleGenderSelect('neutral')}
                className={`
                  px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300
                  ${selectedGender === 'neutral'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                Auto
                {selectedGender === 'neutral' && (
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto"></div>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => handleGenderSelect('female')}
                className={`
                  px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300
                  ${selectedGender === 'female'
                    ? 'bg-pink-600 text-white ring-2 ring-pink-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                Female
                {selectedGender === 'female' && (
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto"></div>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => handleGenderSelect('male')}
                className={`
                  px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300
                  ${selectedGender === 'male'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                Male
                {selectedGender === 'male' && (
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto"></div>
                  </div>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selectedGender === 'neutral' && 'Uses original image characteristics'}
              {selectedGender === 'female' && 'Prompts: "GENERATE FEMALE AVATAR"'}
              {selectedGender === 'male' && 'Prompts: "GENERATE MALE AVATAR"'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isCreating && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Creating your singing avatar</span>
            <span className="text-sm text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ⏰ This may take 2-10 minutes depending on song length. LemonSlice processes server-side.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Display */}
      {avatarUrl && (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-400 text-sm font-medium">Avatar created successfully!</span>
          </div>
          <video
            src={avatarUrl}
            controls
            className="w-full rounded-lg bg-black"
            poster={avatarUrl.replace('.mp4', '_thumbnail.jpg')} // Assuming thumbnail exists
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleCreateAvatar}
          disabled={!canCreateAvatar}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            canCreateAvatar
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCreating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Avatar...</span>
            </div>
          ) : (
            'Create Singing Avatar'
          )}
        </button>

        {(isCreating || avatarUrl) && (
          <button
            onClick={reset}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Reset
          </button>
        )}
      </div>

      {/* Info */}
      {!imageFile && (
        <p className="text-xs text-gray-500 mt-4">
          Upload an image first to create your singing avatar
        </p>
      )}
      {imageFile && !generatedAudioUrl && (
        <p className="text-xs text-gray-500 mt-4">
          Generate a song first, then create your singing avatar
        </p>
      )}
    </div>
  )
} 