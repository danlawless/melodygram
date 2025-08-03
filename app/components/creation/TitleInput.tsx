'use client'

import React from 'react'
import TipButton from '../ui/TipButton'

interface TitleInputProps {
  title: string
  onTitleChange: (title: string) => void
  showValidation?: boolean
  showError?: boolean
}

export default function TitleInput({ title, onTitleChange, showValidation = false, showError = false }: TitleInputProps) {
  return (
    <div className="space-y-4">
      {/* Header with Validation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-text-primary">Song Title</h2>
          <TipButton
            title="Crafting Your Song Title"
            content="A great song title captures the essence of your lyrics and draws listeners in. Keep it memorable, emotional, and true to your song's message."
            position="right"
            size="sm"
          />
        </div>
        {showValidation && title.trim() !== '' && (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="relative">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter your song title..."
          className={`w-full p-4 bg-bg-primary border rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors text-lg font-medium ${
            showValidation && title.trim() !== ''
              ? 'border-green-500 bg-bg-primary'
              : showError && title.trim() === ''
                ? 'border-red-300 bg-bg-primary'
                : 'border-border-subtle'
          }`}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 right-3 text-xs text-text-secondary">
          {title.length}/100
        </div>
      </div>
      
      {/* Validation message */}
      {showError && title.trim() === '' && (
        <p className="text-red-600 text-sm">Please enter a song title</p>
      )}
    </div>
  )
} 