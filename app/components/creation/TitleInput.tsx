'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import TipButton from '../ui/TipButton'
import { titleGenerationService } from '../../services/titleGeneration'

interface TitleInputProps {
  title: string
  onTitleChange: (title: string) => void
  lyrics?: string
  selectedGender?: string
  showValidation?: boolean
  isAutoGenerating?: boolean
}

export default function TitleInput({ 
  title, 
  onTitleChange, 
  lyrics = '',
  selectedGender,
  showValidation = false,
  isAutoGenerating = false
}: TitleInputProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleRegenerateTitle = async () => {
    if (!lyrics || lyrics.trim().length < 10) {
      alert('Please write some lyrics first before generating a title!')
      return
    }

    // =============== COMPREHENSIVE GENERATE BUTTON LOGGING ===============
    const generateContext = {
      timestamp: new Date().toISOString(),
      buttonType: 'TITLE_GENERATION',
      user: {
        sessionId: Date.now(), // Simple session identifier
      },
      inputData: {
        currentTitle: title,
        lyrics: lyrics,
        selectedGender: selectedGender,
        lyricsLength: lyrics.length,
        lyricsWordCount: lyrics.trim().split(/\s+/).length
      },
      formValidation: {
        hasValidLyrics: lyrics && lyrics.trim().length >= 10,
        hasCurrentTitle: title.trim().length > 0,
        canRegenerate: lyrics && lyrics.trim().length >= 10 && !isAutoGenerating && !isGenerating
      },
      systemContext: {
        component: 'TitleInput',
        handler: 'handleRegenerateTitle',
        isAutoGenerating: isAutoGenerating,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }

    console.log('🎯 =================== TITLE GENERATE BUTTON CLICKED ===================')
    console.log('🎯 FULL CONTEXT:', JSON.stringify(generateContext, null, 2))
    console.log('🎯 ======================================================================')
    // =========================================================================

    setIsGenerating(true)

    try {
      console.log('🔄 Regenerating title, current:', title)
      
      const titleGenParams = {
        lyrics,
        currentTitle: title, // Pass current title so AI avoids repeating it
        style: 'pop',
        mood: 'upbeat',
        selectedGender
      }

      console.log('🎯 =================== TITLE GENERATION API CALL PARAMS ===================')
      console.log('🎯 PARAMETERS SENT TO TITLE API:', JSON.stringify(titleGenParams, null, 2))
      console.log('🎯 =========================================================================')

      const result = await titleGenerationService.generateTitle(titleGenParams)

      console.log('🎯 =================== TITLE GENERATION API RESPONSE ===================')
      console.log('🎯 RESPONSE FROM API:', JSON.stringify(result, null, 2))
      console.log('🎯 ====================================================================')
      
      console.log('✨ New title generated:', result.title)
      
      // Safety check: if generated title is the same as current, add variation
      let finalTitle = result.title
      if (finalTitle.toLowerCase() === title.toLowerCase()) {
        finalTitle = `${result.title} (v2)`
        console.log('⚠️ Generated title was same as current, adding variation:', finalTitle)
      }
      
      onTitleChange(finalTitle)
    } catch (error) {
      console.error('Title generation failed:', error)
      // GPT-4o-mini is more reliable, so show a simpler error message
      alert('Failed to generate title. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canRegenerate = lyrics && lyrics.trim().length >= 10 && !isAutoGenerating && !isGenerating

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-text-primary">MelodyGram Title</h2>
          {showValidation && title.trim() !== '' && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          <TipButton
            title="Song Title Tips"
            content="A great song title captures the essence of your lyrics in 1-5 words. It should be memorable, emotional, and give listeners a hint about the song's theme."
          />
        </div>

        {/* Regenerate button - only show when lyrics exist */}
        {canRegenerate && (
          <button
            onClick={handleRegenerateTitle}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate</span>
          </button>
        )}
      </div>

      {/* Title Input */}
      <div className="relative">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={lyrics && lyrics.trim().length >= 10 
            ? "Enter title or click Generate to create from lyrics..." 
            : "Enter your song title..."
          }
          className="w-full p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        />
        
        {(isAutoGenerating || isGenerating) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          </div>
        )}
      </div>

      {/* Status messages */}
      {isAutoGenerating && (
        <div className="flex items-center space-x-2 text-sm text-blue-300">
          <Sparkles className="w-4 h-4" />
          <span>Auto-generating title from your lyrics...</span>
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center space-x-2 text-sm text-purple-300">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Generating new title...</span>
        </div>
      )}

      {!canRegenerate && lyrics && lyrics.trim().length < 10 && (
        <div className="text-sm text-gray-500 italic">
          Write at least 10 characters of lyrics to enable title generation
        </div>
      )}
    </div>
  )
} 