'use client'

import React, { useState } from 'react'
import { Upload, Sparkles, Music, User, Mic, ArrowLeft } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LyricsEditor from './LyricsEditor'
import PathNavigation from './PathNavigation'
import SingerSelection from '../singer/SingerSelection'
import CustomOptions from './CustomOptions'
import MusicLibrary from './MusicLibrary'

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

  const handleGenerateSong = async (selectedTrack?: any) => {
    // TODO: Implement song generation with Mureka API
    console.log('Generating song with:', {
      title: songTitle,
      lyrics,
      selectedTrack,
      uploadedImage
    })
    
    // For now, just navigate back to creation
    handleBackToCreation()
  }

  // Render different screens based on current state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'singer':
        return (
          <SingerSelection 
            onBack={handleBackToCreation}
            lyrics={lyrics}
            title={songTitle}
          />
        )
      case 'custom':
        return (
          <CustomOptions 
            onBack={handleBackToCreation}
            lyrics={lyrics}
            title={songTitle}
          />
        )
      case 'music':
        return (
          <MusicLibrary 
            onBack={handleBackToCreation}
            lyrics={lyrics}
            title={songTitle}
            onGenerate={handleGenerateSong}
          />
        )
      default:
        return renderCreationScreen()
    }
  }

  const renderCreationScreen = () => (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header with Song Title */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="px-4 py-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-text-primary">Create Your Song</h1>
            <p className="text-sm text-text-secondary">Add lyrics and choose your path</p>
          </div>
          
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