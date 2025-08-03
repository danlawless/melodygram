'use client'

import React, { useState } from 'react'
import { Wand2, Loader2, User, Sparkles, Music, Heart, Palette } from 'lucide-react'
import { lyricsGenerationService } from '../../services/lyricsGeneration'
import { titleGenerationService } from '../../services/titleGeneration'
import TipButton from '../ui/TipButton'

interface LyricsEditorProps {
  lyrics: string
  onLyricsChange: (lyrics: string) => void
  selectedGender: string
  songTitle: string
  songLength: number // New: Required song length in seconds
  onTitleGenerated?: (title: string) => void // New: Callback when title is generated from lyrics
  showValidation?: boolean
}

export default function LyricsEditor({ 
  lyrics, 
  onLyricsChange, 
  selectedGender, 
  songTitle,
  songLength,
  onTitleGenerated,
  showValidation = false 
}: LyricsEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomOptions, setShowCustomOptions] = useState(false)
  
  // Custom generation options
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('pop')
  const [selectedMood, setSelectedMood] = useState<string>('uplifting')

  // Available options
  const styles = [
    'pop', 'rock', 'ballad', 'jazz', 'electronic', 'acoustic', 'classical',
    'hip-hop', 'r&b', 'country', 'folk', 'blues', 'reggae', 'alternative', 'funk'
  ]

  const moods = [
    'happy', 'uplifting', 'energetic', 'romantic', 'calm', 'dreamy', 
    'melancholic', 'sad', 'intense', 'chill', 'mysterious', 'playful'
  ]

  const handleGenerateLyrics = async () => {
    if (songLength <= 0) {
      setError('Please select a song length first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log(`🎵 Generating ${songLength}s lyrics${songTitle ? ` for "${songTitle}"` : ''}`)
      
      // Use custom options if available, otherwise use defaults
      const result = await lyricsGenerationService.generateLyrics({
        title: songTitle || undefined, // Pass current title if exists, otherwise let API generate one
        lengthInSeconds: songLength,
        vocalGender: selectedGender as 'male' | 'female',
        genre: showCustomOptions ? selectedStyle : 'pop',
        mood: showCustomOptions ? selectedMood : 'upbeat',
        customPrompt: showCustomOptions ? customPrompt : undefined
      })

      onLyricsChange(result.lyrics)
      
      console.log(`✅ Generated ${result.wordCount} words (estimated ${result.estimatedDuration}s)`)
      
      // Auto-generate title based on new lyrics
      if (onTitleGenerated && result.lyrics && result.lyrics.trim().length > 10) {
        console.log('🎯 Auto-generating title for new lyrics...')
        try {
          const titleResult = await titleGenerationService.generateTitle({
            lyrics: result.lyrics,
            currentTitle: songTitle, // Pass current title to avoid repetition
            style: showCustomOptions ? selectedStyle : 'pop',
            mood: showCustomOptions ? selectedMood : 'uplifting',
            selectedGender
          })
          
          onTitleGenerated(titleResult.title)
          console.log(`🎵 Auto-generated title: "${titleResult.title}"`)
        } catch (titleError) {
          console.warn('Title auto-generation failed, but lyrics were successful:', titleError)
          // Don't block lyrics generation if title generation fails
        }
      }
      
      // If the API returned a title directly, use that instead
      if (result.title && onTitleGenerated && !result.lyrics) {
        onTitleGenerated(result.title)
        console.log(`📝 API provided title: "${result.title}"`)
      }
      
    } catch (error) {
      console.error('Lyrics generation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate lyrics')
    } finally {
      setIsGenerating(false)
    }
  }

  const clearError = () => setError(null)

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <div className="space-y-4">
      {/* Header with Custom Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-text-primary">Lyrics</h2>
          {showValidation && lyrics.trim() !== '' && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          <TipButton
            title="Writing Great Lyrics"
            content="Great lyrics tell a story, evoke emotion, and flow naturally with the melody. For shorter songs (10-30s), focus on a single powerful message. For longer songs (60s+), develop themes across verses and choruses."
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCustomOptions(!showCustomOptions)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              showCustomOptions 
                ? 'bg-melody-purple text-white border-melody-purple' 
                : 'bg-bg-secondary text-text-secondary border-border-subtle hover:text-text-primary hover:border-melody-purple/30'
            }`}
            title="Customize lyrics generation"
          >
            ✨ Custom
          </button>
          
          {/* Show Generate button in header only when custom options are hidden */}
          {!showCustomOptions && (
            <button
              onClick={handleGenerateLyrics}
              disabled={isGenerating || songLength <= 0}
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
          )}
        </div>
      </div>

      {/* Length-aware generation info (only when custom options are hidden) */}
      {songLength > 0 && !showCustomOptions && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-300 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>
              AI will generate {songLength <= 30 ? 'concise, impactful' : songLength <= 60 ? 'structured verse-chorus' : 'full song'} lyrics 
              and a matching title for your {formatTime(songLength)} song
            </span>
          </div>
        </div>
      )}

      {/* Custom Options Panel */}
      {showCustomOptions && (
        <div className="space-y-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Lyrics Customization</h4>
            <button
              onClick={() => setShowCustomOptions(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Length info in custom options */}
          {songLength > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-300 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>
                  Generating {songLength <= 30 ? 'concise, impactful' : songLength <= 60 ? 'structured verse-chorus' : 'full song'} lyrics 
                  for your {formatTime(songLength)} song with custom style and mood
                </span>
              </div>
            </div>
          )}

          {/* Style and Mood Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Music className="w-4 h-4" />
                Style
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              >
                {styles.map((style) => (
                  <option key={style} value={style} className="bg-gray-800">
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood Selection */}
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
                {moods.map((mood) => (
                  <option key={mood} value={mood} className="bg-gray-800">
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Custom Theme (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want your lyrics to be about... (e.g., 'Write a song about overcoming challenges', 'Create lyrics about a summer road trip')"
              className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              💡 Be specific for best results.
            </p>
            <button
              onClick={() => setCustomPrompt('')}
              className="text-melody-purple hover:text-melody-purple/80 underline transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Generate Button - Full Width at Bottom */}
          <div className="pt-2">
            {songLength > 0 && (
              <div className="mb-3 text-center">
                <span className="text-sm text-gray-400 bg-purple-500/20 px-3 py-1 rounded-full">
                  {formatTime(songLength)} {selectedStyle} song with {selectedMood} mood
                </span>
              </div>
            )}
            <button
              onClick={handleGenerateLyrics}
              disabled={isGenerating || songLength <= 0}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Lyrics & Title...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Custom Lyrics</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
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

      {/* Lyrics Textarea */}
      <div className="space-y-2">
        <textarea
          value={lyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder={songLength > 0 
            ? `Write your ${formatTime(songLength)} song lyrics here... or click "Generate" for AI assistance`
            : "Select a song length first, then write your lyrics here..."
          }
          disabled={songLength <= 0}
          className={`w-full h-64 p-4 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 transition-all ${
            songLength <= 0 
              ? 'border-gray-600 focus:ring-gray-500 cursor-not-allowed opacity-50'
              : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/50'
          }`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        />
        
        {/* Word count and length guidance */}
        {lyrics.trim() && songLength > 0 && (
          <div className="flex justify-between text-sm text-gray-400">
            <span>
              {lyrics.trim().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <span>
              Target: {Math.floor(songLength * 2.5)} words for {formatTime(songLength)}
            </span>
          </div>
        )}
        
        {songLength <= 0 && (
          <div className="text-sm text-gray-500 italic">
            Please select a song length to enable lyrics editing
          </div>
        )}
      </div>
    </div>
  )
} 