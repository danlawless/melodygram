'use client'

import React, { useState } from 'react'
import { ArrowLeft, Loader2, AlertCircle, Zap, X, Shuffle } from 'lucide-react'
import { murekaApiService, SongGenerationResponse } from '../../services/murekaApi'

interface CustomOptionsProps {
  lyrics?: string
  title?: string
  isInlineMode?: boolean
}

interface StyleOption {
  id: string
  name: string
  image: string
  color: string
}

interface MoodOption {
  id: string
  name: string
  color: string
}

interface VocalOption {
  id: string
  name: string
  value: string
}

const styleOptions: StyleOption[] = [
  { id: 'random', name: 'Random', image: '🎲', color: 'bg-gray-600' },
  { id: 'pop', name: 'pop', image: '🎤', color: 'bg-gradient-to-br from-pink-400 to-purple-500' },
  { id: 'r&b', name: 'r&b', image: '🎵', color: 'bg-gradient-to-br from-teal-400 to-cyan-500' },
  { id: 'rock', name: 'rock', image: '🎸', color: 'bg-gradient-to-br from-orange-400 to-red-500' },
  { id: 'disco', name: 'disco', image: '🕺', color: 'bg-gradient-to-br from-purple-400 to-pink-500' },
  { id: 'electronic', name: 'electronic', image: '🎧', color: 'bg-gradient-to-br from-blue-400 to-purple-500' },
  { id: 'jazz', name: 'jazz', image: '🎺', color: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
  { id: 'hip-hop', name: 'hip-hop', image: '🎤', color: 'bg-gradient-to-br from-green-400 to-blue-500' }
]

const moodOptions: MoodOption[] = [
  { id: 'random', name: 'Random', color: 'bg-gray-600' },
  { id: 'relaxed', name: 'relaxed', color: 'bg-teal-500' },
  { id: 'angry', name: 'angry', color: 'bg-red-500' },
  { id: 'happy', name: 'happy', color: 'bg-yellow-500' },
  { id: 'energetic', name: 'energetic', color: 'bg-orange-500' },
  { id: 'sad', name: 'sad', color: 'bg-blue-500' },
  { id: 'romantic', name: 'romantic', color: 'bg-pink-500' },
  { id: 'chill', name: 'chill', color: 'bg-purple-500' }
]

const vocalOptions: VocalOption[] = [
  { id: 'female', name: 'female vocal', value: 'female' },
  { id: 'male', name: 'male vocal', value: 'male' }
]

export default function CustomOptions({ lyrics, title, isInlineMode = false }: CustomOptionsProps) {
  // Selection states
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [selectedVocal, setSelectedVocal] = useState<string>('')
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationTask, setGenerationTask] = useState<SongGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleVocalSelect = (vocalId: string) => {
    setSelectedVocal(vocalId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleGenerateSong = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const params = {
        lyrics: lyrics || '',
        title: title || 'My Custom Song',
        style: selectedStyle || 'pop',
        mood: selectedMood || 'happy',
        duration: 120, // 2 minutes default
        vocal_gender: selectedVocal || 'female'
      }

      const response = await murekaApiService.generateSong(params)
      setGenerationTask(response)
      
      // Poll for completion (simplified)
      // In a real app, you'd want to implement proper polling or WebSocket updates
      setTimeout(() => {
        // Simulate completed generation
        setGenerationTask(prev => prev ? { ...prev, status: 'completed', songUrl: '/generated/song.mp3' } : null)
        setIsGenerating(false)
      }, 3000)

    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate song. Please try again.')
      setIsGenerating(false)
    }
  }

  const getSelectedOptionsText = () => {
    const parts: string[] = []
    
    if (selectedVocal) {
      const vocal = vocalOptions.find(v => v.id === selectedVocal)
      if (vocal) parts.push(vocal.name)
    }
    
    if (selectedMood) {
      parts.push(selectedMood)
    }
    
    if (selectedStyle) {
      parts.push(selectedStyle)
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Select your preferences'
  }

  return (
    <div className={isInlineMode ? "bg-bg-secondary rounded-2xl shadow-card" : "min-h-screen bg-bg-primary"}>
      {/* Header */}
      <div className={isInlineMode ? "px-6 py-4 border-b border-border-subtle" : "sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle"}>
        <div className="flex items-center justify-center p-4">
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-text-primary">Choose a Style</h1>
            <p className="text-sm text-text-secondary">
              {title && `"${title}" • `}{getSelectedOptionsText()}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Select Style */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Select Style</h3>
          <div className="grid grid-cols-4 gap-3">
            {styleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`
                  aspect-square rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300 shadow-card
                  ${selectedStyle === style.id
                    ? 'ring-2 ring-melody-purple scale-105 shadow-glow'
                    : 'hover:scale-105 hover:shadow-glow'
                  }
                  ${style.color}
                `}
              >
                <div className="text-2xl mb-1">{style.image}</div>
                <span className="text-white text-xs font-medium">{style.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Select Mood */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Select Mood</h3>
          <div className="grid grid-cols-4 gap-3">
            {moodOptions.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className={`
                  px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-card
                  ${selectedMood === mood.id
                    ? `${mood.color} text-white ring-2 ring-white/50 scale-105 shadow-glow`
                    : `bg-bg-secondary text-text-secondary hover:${mood.color} hover:text-white hover:scale-105 hover:shadow-glow`
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  {mood.id === 'random' && <Shuffle className="w-4 h-4" />}
                  <span className="text-sm">{mood.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vocal Gender */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Vocal Gender</h3>
          <div className="grid grid-cols-2 gap-4">
            {vocalOptions.map((vocal) => (
              <button
                key={vocal.id}
                onClick={() => handleVocalSelect(vocal.id)}
                className={`
                  px-6 py-4 rounded-xl font-medium transition-all duration-300 shadow-card
                  ${selectedVocal === vocal.id
                    ? 'bg-melody-gradient text-white ring-2 ring-melody-purple/50 scale-105 shadow-glow'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-accent hover:scale-105 hover:shadow-glow'
                  }
                `}
              >
                {vocal.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className={isInlineMode ? "px-6 py-4 border-t border-border-subtle" : "fixed bottom-20 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-border-subtle"}>
        <div className={isInlineMode ? "" : "px-4 py-4"}>
          <button 
            onClick={handleGenerateSong}
            disabled={isGenerating || (!selectedStyle && !selectedMood && !selectedVocal)}
            className={`
              w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2
              ${isGenerating || (!selectedStyle && !selectedMood && !selectedVocal)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-melody-gradient text-white hover:shadow-glow'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Song...</span>
              </>
            ) : (
              <>
                <span>Generate Song</span>
                <Zap className="w-5 h-5" />
              </>
            )}
          </button>
          
          {/* Generation Status */}
          {generationTask && (
            <div className="mt-3 p-3 bg-bg-secondary rounded-lg">
              <p className="text-sm text-text-secondary">
                Status: <span className="text-melody-purple capitalize">{generationTask.status}</span>
              </p>
              {generationTask.status === 'completed' && generationTask.songUrl && (
                <p className="text-sm text-green-400 mt-1">
                  ✅ Your song is ready!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacing for fixed button */}
      {!isInlineMode && <div className="h-32"></div>}
    </div>
  )
} 