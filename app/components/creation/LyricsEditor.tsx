'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { murekaApiService } from '../../services/murekaApi'
import TipButton from '../ui/TipButton'

interface LyricsEditorProps {
  lyrics: string
  onLyricsChange: (lyrics: string) => void
  imagePrompt?: string // Add this to use image context for lyrics generation
  showValidation?: boolean
}

export default function LyricsEditor({ lyrics, onLyricsChange, imagePrompt, showValidation = false }: LyricsEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)

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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-green-600 text-sm font-medium">Complete</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPromptInput(!showPromptInput)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              showPromptInput 
                ? 'bg-melody-purple text-white border-melody-purple' 
                : 'bg-bg-secondary text-text-secondary border-border-subtle hover:text-text-primary hover:border-melody-purple/30'
            }`}
            title="Customize lyrics prompt"
          >
            ✨ Custom Prompt
          </button>
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
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Custom Prompt Input */}
      {showPromptInput && (
        <div className="space-y-4 p-4 bg-bg-secondary border border-border-subtle rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">Custom Lyrics Prompt</h4>
            <button
              onClick={() => setShowPromptInput(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          </div>
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