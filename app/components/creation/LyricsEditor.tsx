'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { murekaApiService } from '../../services/murekaApi'
import TipButton from '../ui/TipButton'

interface LyricsEditorProps {
  lyrics: string
  onLyricsChange: (lyrics: string) => void
  onTitleChange?: (title: string) => void
  imagePrompt?: string // Add this to use image context for lyrics generation
  showValidation?: boolean
}

export default function LyricsEditor({ lyrics, onLyricsChange, onTitleChange, imagePrompt, showValidation = false }: LyricsEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)
  
  // Lyric generation options
  const [selectedStyle, setSelectedStyle] = useState<string>('pop')
  const [selectedMood, setSelectedMood] = useState<string>('uplifting')
  const [selectedGenre, setSelectedGenre] = useState<string>('pop')

  // Available options (aligned with Mureka API)
  const styles = [
    'pop', 'ballad', 'indie', 'rock', 'jazz', 'classical', 'electronic', 
    'hip-hop', 'r&b', 'country', 'folk', 'blues', 'reggae', 'alternative', 'funk'
  ]
  
  const moods = [
    'happy', 'uplifting', 'energetic', 'romantic', 'calm', 'dreamy', 
    'melancholic', 'sad', 'intense', 'chill', 'mysterious', 'playful'
  ]
  
  const genres = [
    'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'r&b', 
    'country', 'folk', 'blues', 'reggae', 'alternative', 'indie', 'funk'
  ]

  const handleGenerateLyrics = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      // Create a prompt based on custom input, image context, or use a default
      let prompt = customPrompt.trim()
      
      if (!prompt) {
        prompt = imagePrompt 
          ? `Create song lyrics inspired by this image description: ${imagePrompt}. Make it emotional and meaningful.`
          : 'Create beautiful song lyrics about love, life, and meaningful moments. Include verse and chorus structure.'
      }

      const response = await murekaApiService.generateLyrics({
        prompt,
        style: selectedStyle,
        mood: selectedMood,
        genre: selectedGenre,
        language: 'english'
      })
      
      if (response.lyrics) {
        onLyricsChange(response.lyrics)
      }
      
      if (response.title && onTitleChange) {
        onTitleChange(response.title)
      }
    } catch (error) {
      console.error('Error generating lyrics:', error)
      setError('Failed to generate lyrics. Please try again.')
      
      // Fallback to demo lyrics if API fails
      const fallbackLyrics = `Verse 1:
In the morning light, I see your face
Dancing shadows in this sacred space
Every heartbeat tells a story true
All my melodies belong to you

Chorus:
We're writing songs with our hearts tonight
Every word glowing in the starlight
This melody gram we're creating here
Will echo love throughout the year

Verse 2:
Whispered secrets in the evening glow
Harmonies that only we could know
Through the music, our souls collide
In this moment, we're alive`

      onLyricsChange(fallbackLyrics)
    } finally {
      setIsGenerating(false)
    }
  }

  const characterCount = lyrics.length
  const maxChars = 3000
  const isNearLimit = characterCount > maxChars * 0.8

  return (
    <div className="space-y-4" data-lyrics-editor>
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-text-primary">Lyrics</h2>
            <TipButton
              title="Writing Great Lyrics"
              content="Write from the heart! Include verses, a catchy chorus, and maybe a bridge. Don't worry about perfect rhymes - focus on telling your story and expressing emotions authentically."
              position="right"
              size="sm"
            />
          </div>
          {showValidation && lyrics.trim() !== '' && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            data-custom-prompt-btn
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              showPromptInput 
                ? 'bg-melody-purple text-white border-melody-purple' 
                : 'bg-bg-secondary text-text-secondary border-border-subtle hover:text-text-primary hover:border-melody-purple/30'
            }`}
            title="Customize lyrics prompt"
          >
            ✨ Custom
          </button>
          <button
            onClick={handleGenerateLyrics}
            disabled={isGenerating}
            data-generate-btn
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
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
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Custom Settings */}
      {showPromptInput && (
        <div className="space-y-6 p-4 bg-bg-secondary border border-border-subtle rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">Musical Style</h4>
            <button
              onClick={() => setShowPromptInput(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Lyric Generation Options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Musical Style */}
              <div>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
                >
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Mood
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
                >
                  {moods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-text-primary">Custom Prompt</h5>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want your lyrics to be about... (e.g., 'Write a song about overcoming challenges and finding strength', 'Create lyrics about a summer road trip with friends', 'Write emotional lyrics about missing someone')"
              className="w-full p-4 bg-bg-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary resize-none focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
              rows={6}
            />
            <div className="flex items-center justify-between text-sm">
              <p className="text-text-secondary">
                💡 Be specific about theme, mood, story, or emotions you want
              </p>
              <button
                onClick={() => setCustomPrompt('')}
                className="text-melody-purple hover:text-melody-purple/80 underline transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Textarea */}
      <div className="relative">
        <textarea
          value={lyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder="Write your lyrics here or tap Generate for AI assistance..."
          rows={12}
          maxLength={maxChars}
          className="input resize-none text-base leading-relaxed min-h-[300px]"
        />
        
        {/* Character Counter */}
        <div className={`
          absolute bottom-4 right-4 text-sm px-2 py-1 rounded-lg backdrop-blur-sm
          ${isNearLimit 
            ? 'text-melody-pink bg-melody-pink/10' 
            : 'text-text-muted bg-bg-primary/50'
          }
        `}>
          {characterCount}/{maxChars}
        </div>
      </div>
    </div>
  )
} 