'use client'

import React, { useState } from 'react'
import { Upload, Sparkles, Music, User, Mic, ArrowLeft } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LyricsEditor from './LyricsEditor'
import PathNavigation from './PathNavigation'
import SingerSelection from '../singer/SingerSelection'

type Screen = 'creation' | 'singer' | 'custom' | 'music'

export default function CreationStudio() {
  const [songTitle, setSongTitle] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [currentScreen, setCurrentScreen] = useState<Screen>('creation')

  const handleNavigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const handleBackToCreation = () => {
    setCurrentScreen('creation')
  }

  // Render different screens based on current state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'singer':
        return <SingerSelection onBack={handleBackToCreation} />
      case 'custom':
        return (
          <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
            <button
              onClick={handleBackToCreation}
              className="absolute top-4 left-4 p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold text-text-primary">Custom Reference</h2>
              <p className="text-text-secondary">Upload reference tracks & set custom styles</p>
              <p className="text-text-muted text-sm">Coming soon...</p>
            </div>
          </div>
        )
      case 'music':
        return (
          <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
            <button
              onClick={handleBackToCreation}
              className="absolute top-4 left-4 p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎶</div>
              <h2 className="text-2xl font-bold text-text-primary">Music Library</h2>
              <p className="text-text-secondary">Browse our collection of backing tracks</p>
              <p className="text-text-muted text-sm">Coming soon...</p>
            </div>
          </div>
        )
      default:
        return renderCreationScreen()
    }
  }

  const renderCreationScreen = () => (
    <div className="min-h-screen bg-bg-primary">
      {/* Header with Song Title */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="px-4 py-4">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter your song title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-melody-purple focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-8 max-w-md mx-auto">
        {/* Image Upload Section */}
        <div className="animate-entrance">
          <ImageUpload 
            uploadedImage={uploadedImage}
            onImageUpload={setUploadedImage}
          />
        </div>

        {/* Lyrics Editor Section */}
        <div className="animate-entrance-delay-1">
          <LyricsEditor 
            lyrics={lyrics}
            onLyricsChange={setLyrics}
            imagePrompt={uploadedImage ? "Create lyrics inspired by the uploaded image" : undefined}
          />
        </div>

        {/* Path Navigation */}
        <div className="animate-entrance-delay-2">
          <PathNavigation onNavigate={handleNavigateToScreen} />
        </div>
      </div>
    </div>
  )

  return renderCurrentScreen()
} 