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

  // Validation logic
  const isFormValid = () => {
    return songTitle.trim() !== '' && 
           lyrics.trim() !== '' && 
           uploadedImage !== null
  }

  const getValidationMessage = () => {
    const missing: string[] = []
    if (songTitle.trim() === '') missing.push('song title')
    if (lyrics.trim() === '') missing.push('lyrics')
    if (uploadedImage === null) missing.push('image')
    
    if (missing.length === 0) return ''
    if (missing.length === 1) return `Please add a ${missing[0]}`
    if (missing.length === 2) return `Please add ${missing[0]} and ${missing[1]}`
    return `Please add ${missing[0]}, ${missing[1]}, and ${missing[2]}`
  }

  const handleNavigateToScreen = (screen: Screen) => {
    // Only allow navigation if form is valid
    if (isFormValid()) {
      setCurrentScreen(screen)
    }
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
          
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Enter your song title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className={`
                w-full bg-bg-secondary border rounded-xl px-4 py-3 pr-12 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all
                ${songTitle.trim() !== '' 
                  ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' 
                  : 'border-border-subtle focus:ring-melody-purple/20 focus:border-melody-purple'
                }
              `}
            />
            {songTitle.trim() !== '' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            )}
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
            showValidation={true}
          />
        </div>

        {/* Lyrics Editor Section */}
        <div className="animate-entrance-delay-1">
          <LyricsEditor 
            lyrics={lyrics}
            onLyricsChange={setLyrics}
            imagePrompt={uploadedImage ? "Create lyrics inspired by the uploaded image" : undefined}
            showValidation={true}
          />
        </div>

        {/* Path Navigation */}
        <div className="animate-entrance-delay-2">
          <PathNavigation 
            onNavigate={handleNavigateToScreen}
            isFormValid={isFormValid()}
            validationMessage={getValidationMessage()}
          />
        </div>
      </div>
    </div>
  )

  return renderCurrentScreen()
} 