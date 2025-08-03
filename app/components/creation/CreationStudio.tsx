'use client'

import React, { useState } from 'react'
import { Upload, Sparkles, Music, User, Mic, ArrowLeft } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LyricsEditor from './LyricsEditor'
import TitleInput from './TitleInput'
import PathNavigation from './PathNavigation'
import SingerSelection from '../singer/SingerSelection'
import CustomOptions from './CustomOptions'
import MusicLibrary from './MusicLibrary'
import TipButton from '../ui/TipButton'

type ExpandedPath = 'singer' | 'custom' | 'music' | null

export default function CreationStudio() {
  const [songTitle, setSongTitle] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [expandedPath, setExpandedPath] = useState<ExpandedPath>(null)

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

  const handlePathExpand = (path: 'singer' | 'custom' | 'music') => {
    // Only allow expansion if form is valid
    if (isFormValid()) {
      setExpandedPath(expandedPath === path ? null : path)
      
      // Smooth scroll to the expanded section
      setTimeout(() => {
        const element = document.getElementById(`${path}-section`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const handlePathCollapse = () => {
    setExpandedPath(null)
    
    // Scroll back to path navigation
    setTimeout(() => {
      const element = document.getElementById('path-navigation')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleGenerateSong = async (selectedTrack?: any) => {
    // TODO: Implement song generation with Mureka API
    console.log('Generating song with:', {
      title: songTitle,
      lyrics,
      selectedTrack,
      uploadedImage
    })
    
    // For now, just collapse the expanded section
    handlePathCollapse()
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header with Song Title */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="px-4 py-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-text-primary">Create Your Song</h1>
              <TipButton
                title="Song Creation Tips"
                content="Fill in your song title, upload an inspiring image, and write your lyrics. Each element helps our AI create a more personalized song that matches your vision."
                position="bottom"
              />
            </div>
            <p className="text-sm text-text-secondary">Add lyrics and choose your path</p>
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
            onTitleChange={setSongTitle}
            imagePrompt={uploadedImage ? "Create lyrics inspired by the uploaded image" : undefined}
            showValidation={true}
          />
        </div>

        {/* Title Input Section */}
        <div className="animate-entrance-delay-1">
          <TitleInput 
            title={songTitle}
            onTitleChange={setSongTitle}
            showValidation={true}
          />
        </div>

        {/* Path Navigation */}
        <div id="path-navigation" className="animate-entrance-delay-2">
          <PathNavigation 
            onNavigate={handlePathExpand}
            isFormValid={isFormValid()}
            validationMessage={getValidationMessage()}
            expandedPath={expandedPath}
          />
        </div>

        {/* Expanded Path Sections */}
        {expandedPath === 'singer' && (
          <div id="singer-section" className="mt-8 animate-entrance">
            <SingerSelection 
              lyrics={lyrics}
              title={songTitle}
              isInlineMode={true}
            />
          </div>
        )}

        {expandedPath === 'custom' && (
          <div id="custom-section" className="mt-8 animate-entrance">
            <CustomOptions 
              lyrics={lyrics}
              title={songTitle}
              isInlineMode={true}
            />
          </div>
        )}

        {expandedPath === 'music' && (
          <div id="music-section" className="mt-8 animate-entrance">
            <MusicLibrary 
              lyrics={lyrics}
              title={songTitle}
              onGenerate={handleGenerateSong}
              isInlineMode={true}
            />
          </div>
        )}
      </div>
    </div>
  )
} 