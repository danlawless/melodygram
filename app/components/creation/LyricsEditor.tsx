'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { murekaApiService } from '../../services/murekaApi'

interface LyricsEditorProps {
  lyrics: string
  onLyricsChange: (lyrics: string) => void
  imagePrompt?: string // Add this to use image context for lyrics generation
}

export default function LyricsEditor({ lyrics, onLyricsChange, imagePrompt }: LyricsEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateLyrics = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      // Create a prompt based on image context or use a default
      const prompt = imagePrompt 
        ? `Create song lyrics inspired by this image description: ${imagePrompt}. Make it emotional and meaningful.`
        : 'Create beautiful song lyrics about love, life, and meaningful moments. Include verse and chorus structure.'

      const response = await murekaApiService.generateLyrics({
        prompt,
        style: 'pop',
        mood: 'uplifting',
        language: 'english'
      })
      
      // Format the lyrics with title if provided
      const formattedLyrics = response.title 
        ? `Title: ${response.title}\n\n${response.lyrics}`
        : response.lyrics

      onLyricsChange(formattedLyrics)
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
    <div className="space-y-4">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Lyrics</h2>
        <button
          onClick={handleGenerateLyrics}
          disabled={isGenerating}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
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

      {/* Helper Text */}
      <div className="text-sm text-text-secondary space-y-1">
        <p>💡 <strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-text-muted">
          <li>Use verse/chorus structure for best results</li>
          <li>Keep lines concise and rhythmic</li>
          <li>AI generation creates lyrics that match your photo's mood</li>
        </ul>
      </div>
    </div>
  )
} 