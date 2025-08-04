'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Zap, Loader2, Wand2, Music, Upload, User, Play, Clock } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LyricsEditor from './LyricsEditor'
import SongGeneration from './SongGeneration'
import TitleInput from './TitleInput'
import TipButton from '../ui/TipButton'
import { lemonSliceApiService } from '../../services/lemonSliceApi'
import { songStorageService, SavedSong } from '../../services/songStorage'
import { murekaApiService } from '../../services/murekaApi'
import { titleGenerationService } from '../../services/titleGeneration'
import SongLengthSelector from './SongLengthSelector'
// import CreditsSummary from './CreditsSummary' // Disabled for now
import PathNavigation from './PathNavigation'
import { creditSystemService } from '../../services/creditSystem'

// Helper function for duration instructions
const createDurationInstruction = (seconds: number): string => {
  if (seconds <= 15) {
    return `IMPORTANT: Generate a VERY SHORT song of exactly ${seconds} seconds. Keep it minimal - just a quick hook or chorus.`
  } else if (seconds <= 30) {
    return `IMPORTANT: Generate a SHORT song of exactly ${seconds} seconds. Brief verse and chorus only.`
  } else if (seconds <= 60) {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (1 minute). Standard verse-chorus structure.`
  } else if (seconds <= 120) {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (2 minutes). Full structure with verse, chorus, second verse, chorus.`
  } else {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (${Math.floor(seconds/60)} minutes). Extended structure with multiple verses, choruses, and bridge.`
  }
}

interface VocalOption {
  id: string
  name: string
  value: string
}

const vocalOptions: VocalOption[] = [
  { id: 'female', name: 'Female Singer', value: 'female' },
  { id: 'male', name: 'Male Singer', value: 'male' }
]

export default function CreationStudio() {
  const [songTitle, setSongTitle] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [selectedVocal, setSelectedVocal] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isTitleGenerating, setIsTitleGenerating] = useState(false)
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null)
  const [songLength, setSongLength] = useState<number>(30) // Default song length
  const [generatedSongUrl, setGeneratedSongUrl] = useState<string | null>(null)
  const [isSongGenerating, setIsSongGenerating] = useState(false)

  // Session storage key
  const SESSION_KEY = 'melodygram_creation_session'

  // Load session data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY)
        if (savedSession) {
          const session = JSON.parse(savedSession)
          console.log('📂 Restoring creation session:', {
            hasLyrics: !!session.lyrics,
            hasTitle: !!session.songTitle,
            hasVocal: !!session.selectedVocal,
            songLength: session.songLength,
            hasGeneratedImageUrl: !!session.generatedImageUrl,
            hasUploadedImageUrl: !!session.uploadedImageUrl,
            generatedImageUrl: session.generatedImageUrl ? session.generatedImageUrl.substring(0, 50) + '...' : null,
            uploadedImageUrl: session.uploadedImageUrl ? session.uploadedImageUrl.substring(0, 50) + '...' : null
          })
          
          let restored = []
          if (session.lyrics) { setLyrics(session.lyrics); restored.push('lyrics') }
          if (session.songTitle) { setSongTitle(session.songTitle); restored.push('title') }
          if (session.selectedVocal) { setSelectedVocal(session.selectedVocal); restored.push('vocal') }
          if (session.songLength) { setSongLength(session.songLength); restored.push('length') }
          if (session.generatedImageUrl) { 
            setGeneratedImageUrl(session.generatedImageUrl); 
            restored.push('generated-image')
            console.log('🎨 Restored generated image URL:', session.generatedImageUrl?.substring(0, 50) + '...')
          }
          if (session.generatedSongUrl) {
            setGeneratedSongUrl(session.generatedSongUrl);
            restored.push('generated-song')
            console.log('🎵 Restored generated song URL:', session.generatedSongUrl?.substring(0, 50) + '...')
          }
          if (session.uploadedImageUrl) {
            // Convert blob URL back to File object
            try {
              fetch(session.uploadedImageUrl)
                .then(res => res.blob())
                .then(blob => {
                  const fileName = session.uploadedImageName || 'restored-image.png'
                  const file = new File([blob], fileName, { type: blob.type })
                  setUploadedImage(file)
                  console.log('📸 Restored uploaded image from blob URL:', fileName)
                })
                .catch(error => {
                  console.error('Failed to restore uploaded image from blob URL:', error)
                })
              restored.push('uploaded-image')
            } catch (error) {
              console.error('Failed to restore uploaded image:', error)
            }
          }
          
          if (restored.length > 0) {
            console.log(`✅ Restored: ${restored.join(', ')}`)
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error)
      }
    }
  }, [])

  // Convert uploaded image to blob URL for storage  
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  // Convert uploaded file to blob URL whenever it changes
  useEffect(() => {
    if (uploadedImage) {
      const blobUrl = URL.createObjectURL(uploadedImage)
      setUploadedImageUrl(blobUrl)
      console.log('📸 Created blob URL for uploaded image:', {
        fileName: uploadedImage.name,
        fileSize: uploadedImage.size,
        blobUrl: blobUrl
      })
      
      // Cleanup function to revoke old blob URL
      return () => {
        if (uploadedImageUrl) {
          URL.revokeObjectURL(uploadedImageUrl)
        }
      }
    } else {
      setUploadedImageUrl(null)
    }
  }, [uploadedImage])

  // Save session data whenever state changes (debounced to prevent excessive saves)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        const session = {
          lyrics,
          songTitle,
          selectedVocal,
          songLength,
          generatedImageUrl,
          generatedSongUrl,
          uploadedImageUrl,
          uploadedImageName: uploadedImage?.name || null,
          lastUpdated: new Date().toISOString()
        }
        
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session))
          console.log('💾 Saved creation session:', {
            songLengthSeconds: songLength,
            hasGeneratedImage: !!generatedImageUrl,
            hasUploadedImage: !!uploadedImageUrl,
            generatedImageUrl: generatedImageUrl ? generatedImageUrl.substring(0, 50) + '...' : null,
            uploadedImageUrl: uploadedImageUrl ? uploadedImageUrl.substring(0, 50) + '...' : null,
            lyricsCharCount: lyrics?.length || 0,
            titleCharCount: songTitle?.length || 0
          })
        } catch (error) {
          console.error('Failed to save session:', error)
        }
      }, 500) // Debounce saves by 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [lyrics, songTitle, selectedVocal, songLength, generatedImageUrl, generatedSongUrl, uploadedImageUrl])

  // Debug song length changes
  useEffect(() => {
    console.log(`⏱️ Song length changed to: ${songLength} seconds`)
  }, [songLength])

  // Clear session when song is successfully generated
  const clearSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
      console.log('🗑️ Cleared creation session')
    }
  }

  // Check if image is available (uploaded or generated)
  const hasImage = uploadedImage !== null || generatedImageUrl !== null
  
  // Check if avatar is complete (has image AND avatar video has been generated)
  const hasAvatarComplete = hasImage || avatarVideoUrl !== null

  // Validation logic
  const isFormValid = () => {
    return songTitle.trim() !== '' && 
           lyrics.trim() !== '' && 
           songLength > 0 &&
           hasImage &&
           selectedVocal !== '' &&
           generatedSongUrl !== null  // Require a generated song
  }

  const handleVocalSelect = (vocalId: string) => {
    setSelectedVocal(vocalId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  // Auto-generate title when lyrics change (with debounce)
  const generateTitleFromLyrics = useCallback(async (lyricsText: string) => {
    console.log('🎯 Title generation check:', { 
      lyricsLength: lyricsText?.trim().length, 
      selectedVocal, 
      currentTitle: songTitle 
    })
    
    if (!lyricsText || lyricsText.trim().length < 20) {
      console.log('⚠️ Not enough lyrics for title generation')
      return
    }
    
    if (!selectedVocal) {
      console.log('⚠️ No vocal selection yet for title generation')
      return
    }

    // Check current title state
    const currentTitleState = songTitle || ''
    if (currentTitleState.trim() !== '' && currentTitleState !== 'Untitled Song') {
      console.log('⚠️ Title already exists, skipping auto-generation:', currentTitleState)
      return
    }

    console.log('🎵 Starting auto-title generation...')
    setIsTitleGenerating(true)
    try {
      const result = await titleGenerationService.generateTitle({
        lyrics: lyricsText,
        selectedGender: selectedVocal
      })
      
      console.log('✅ Title generated successfully:', result.title)
      setSongTitle(result.title)
    } catch (error) {
      console.error('❌ Title auto-generation failed:', error)
      // GPT-4o-mini has higher rate limits, so failures are less expected
      // But still handle them gracefully without bothering the user
    } finally {
      setIsTitleGenerating(false)
    }
  }, [selectedVocal, songTitle]) // Include songTitle to prevent stale closures

  // Debounced title generation - only for manual lyrics typing
  useEffect(() => {
    if (!lyrics || lyrics.trim().length < 20) {
      return // Exit early if not enough lyrics
    }
    
    console.log('⏱️ Setting up title generation timeout...')
    const timeoutId = setTimeout(() => {
      // Only auto-generate if title is empty or default
      const currentTitle = songTitle || ''
      if (currentTitle.trim() === '' || currentTitle === 'Untitled Song') {
        console.log('🔄 Auto-generating title after lyrics change...')
        generateTitleFromLyrics(lyrics)
      } else {
        console.log('✋ Skipping auto-generation, title already exists:', currentTitle)
      }
    }, 1500) // Reduced from 2 seconds since GPT-4o-mini is faster and has higher limits

    return () => {
      console.log('🚫 Clearing title generation timeout')
      clearTimeout(timeoutId)
    }
  }, [lyrics, selectedVocal, generateTitleFromLyrics]) // Removed isSongGenerating since no rate limiting needed

  const handleGenerateMelodyGram = async () => {
    if (!isFormValid()) return

    // Reset avatar video URL when starting new generation
    setAvatarVideoUrl(null)

    // Create initial song entry
    const songId = songStorageService.generateSongId()
    const newSong: SavedSong = {
      id: songId,
      title: songTitle,
      lyrics: lyrics,
      vocalGender: selectedVocal as 'male' | 'female',
      imageUrl: generatedImageUrl || undefined,
      audioUrl: generatedSongUrl || undefined, // Use pre-generated song
      createdAt: new Date().toISOString(),
      status: 'generating',
      plays: 0,
      progress: 0,
      songLength: songLength // Add song length to the new song
    }

    try {
      setIsGenerating(true)
      setGenerationError(null) // Clear any previous errors
      
      // Save initial song to storage
      songStorageService.saveSong(newSong)
      console.log('🎬 Melody Gram creation started:', songTitle)
      console.log('🎵 Using pre-generated song:', generatedSongUrl)
      
      // Step 1: Create avatar with LemonSlice API using pre-generated song
      if (generatedImageUrl) {
        // Only create avatar if we have a generated image URL (not uploaded file)
        // LemonSlice API v2 requires public URLs for both image and audio
                console.log('🎭 Creating avatar with LemonSlice API...')
        
        // Fix image URL to include extension if missing (LemonSlice may require it)
        let fixedImageUrl = generatedImageUrl
        if (!generatedImageUrl.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)) {
          fixedImageUrl = generatedImageUrl.includes('?') 
            ? generatedImageUrl.replace('?', '.png?') 
            : generatedImageUrl + '.png'
          console.log('⚠️ Added .png extension to image URL')
        }
        
        console.log('🎭 Using Image URL:', fixedImageUrl)
        console.log('🎭 Audio URL:', generatedSongUrl)
        
        try {
          // COST PROTECTION: Estimate cost before proceeding (same as working test)
          const { estimateLemonSliceCost, checkCostLimit, COST_LIMITS } = await import('../../utils/costEstimator')
          const costEstimate = estimateLemonSliceCost('320', 15) // Assume 15 seconds for avatar
          const costCheck = checkCostLimit(costEstimate, COST_LIMITS.PRODUCTION)
          
          console.log(`💰 Estimated cost: $${costEstimate.costUSD} (15s @ 320px)`)
          console.log(costCheck.message)
          
          if (!costCheck.allowed) {
            throw new Error(`Cost limit exceeded: ${costCheck.message}`)
          }
          
          if (costEstimate.warning) {
            console.log(`⚠️ ${costEstimate.warning}`)
          }

          console.log('🎬 Starting avatar creation...')
          
          const avatarResponse = await lemonSliceApiService.createAvatar({
            image: fixedImageUrl,
            audio: generatedSongUrl!,
            title: songTitle, // Pass the song title
            songLength: songLength, // Pass song length for better generation
            model: 'V2.5', // Using V2.5 model (not V2.7)
            resolution: '320', // Standard resolution for faster processing
            animation_style: 'autoselect',
            expressiveness: 0.8,
            crop_head: false
          })
          
          console.log('✅ Avatar job created:', avatarResponse.job_id)
          
          // Store the task ID immediately so it can be matched with the job later
          songStorageService.updateSong(songId, { 
            taskId: avatarResponse.job_id
          })
          
          // Check if setup is required (API key missing)
          if (avatarResponse && typeof avatarResponse === 'object' && 'setup_required' in avatarResponse) {
            throw new Error('LemonSlice API setup required. Please check SETUP_ENVIRONMENT.md for instructions.')
          }
          
          if (!avatarResponse?.job_id) {
            throw new Error('Failed to start avatar creation: No job ID returned')
          }
          
          // Step 4: Wait for avatar completion with progress tracking
          const avatarResult = await lemonSliceApiService.waitForCompletion(
            avatarResponse.job_id,
            (progress) => {
              // Handle undefined progress from LemonSlice API
              const progressPercent = progress || 0
              songStorageService.updateSong(songId, { progress: 60 + (progressPercent * 0.4) }) // Avatar creation takes 40% of total progress
            }
          )
          
          if (avatarResult?.video_url) {
            console.log('✅ Avatar generation completed:', avatarResult.video_url)
            setAvatarVideoUrl(avatarResult.video_url) // Update state with video URL
            songStorageService.updateSong(songId, { 
              videoUrl: avatarResult.video_url,
              thumbnailUrl: avatarResult.thumbnail_url,
              duration: avatarResult.duration,
              completedAt: new Date().toISOString(),
              progress: 100,
              genre: 'Pop', // Default for now
              mood: selectedVocal === 'male' ? 'Confident' : 'Happy'
            })
            console.log('🎉 Song and avatar creation completed successfully!')
            
            // Clear creation caches after successful generation to start fresh next time
            const { clearCreationCaches } = await import('../../utils/cacheManager')
            clearCreationCaches()
          } else {
            throw new Error('Avatar generation completed but no video URL returned')
          }
          
        } catch (avatarError) {
          console.error('❌ Avatar creation failed:', avatarError)
          throw new Error(`Avatar creation failed. ${avatarError instanceof Error ? avatarError.message : String(avatarError)}`)
        }
      } else {
        // No avatar generation - either no image or uploaded image (not supported by LemonSlice API v2)
        if (uploadedImage) {
          console.log('⚠️ Avatar generation skipped: Uploaded images not supported by LemonSlice API v2 (requires public URLs)')
        }
        
        songStorageService.updateSong(songId, {
          status: 'completed',
          audioUrl: generatedSongUrl!, // Save the audio URL
          completedAt: new Date().toISOString(),
          progress: 100,
          genre: 'Pop',
          mood: selectedVocal === 'male' ? 'Confident' : 'Happy'
        })
        
        console.log('🎉 Song creation completed successfully!')
        
        // Clear session after successful generation
        clearSession()
      }
      
    } catch (error) {
      console.error('❌ Error during song generation:', error)
      
      // Update song with error status
      songStorageService.updateSong(songId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Generation failed',
        progress: 0
      })
      
      // Show error to user in UI instead of popup
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('Too many consecutive API failures')) {
        setGenerationError('Unable to generate song right now. Please try again in a few minutes.')
      } else if (errorMessage.includes('timed out')) {
        setGenerationError('Song generation is taking longer than expected. Please try again.')
      } else if (errorMessage.includes('LemonSlice API setup required')) {
        setGenerationError('Avatar generation failed. API configuration needed. Please check SETUP_ENVIRONMENT.md for setup instructions.')
      } else if (errorMessage.includes('API authentication failed')) {
        setGenerationError('Avatar generation failed. API authentication failed. Please verify your LemonSlice API key in your environment variables.')
      } else if (errorMessage.includes('Network error')) {
        setGenerationError('Avatar generation failed. Network connection issue. Please check your internet connection and try again.')
      } else {
        setGenerationError('Unable to generate song. Please check your content and try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Elegant Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="p-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Studio</h1>
                <p className="text-gray-400">Bring your musical vision to life</p>
              </div>
            </div>
            
            {/* Tip Button */}
            <TipButton
              title="Song Creation Tips"
              content="Start by choosing your vocal preference, then add your content. Your gender selection will influence the avatar generation, lyrics style, and vocal characteristics throughout the entire creation process."
              position="bottom"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Voice Style Selection */}
        <div className="animate-entrance-delay-1">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-text-primary">Voice Style</h2>
              {selectedVocal !== '' && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVocalSelect('male')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedVocal === 'male'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎤</div>
                  <div className="font-semibold">Male Voice</div>
                  <div className="text-sm opacity-80">Masculine Focused</div>
                </div>
              </button>
              
              <button
                onClick={() => handleVocalSelect('female')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedVocal === 'female'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎙️</div>
                  <div className="font-semibold">Female Voice</div>
                  <div className="text-sm opacity-80">Feminine Focused</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="animate-entrance-delay-2">
          <ImageUpload
            uploadedImage={uploadedImage}
            onImageUpload={setUploadedImage}
            onImageGenerated={setGeneratedImageUrl}
            generatedImageUrl={generatedImageUrl}
            showValidation={hasAvatarComplete}
            selectedGender={selectedVocal as 'male' | 'female'}
          />
        </div>

        {/* Song Length Selector */}
        <div className="animate-entrance-delay-3">
          <SongLengthSelector 
            selectedLength={songLength}
            onLengthChange={setSongLength}
            showValidation={true}
          />
        </div>

        {/* Lyrics Editor */}
        <div className="animate-entrance-delay-4">
          <LyricsEditor
            lyrics={lyrics}
            onLyricsChange={setLyrics}
            selectedGender={selectedVocal}
            songTitle={songTitle}
            songLength={songLength}
            onTitleGenerated={setSongTitle}
            showValidation={true}
          />
        </div>

        {/* Song Generation - New section for Mureka */}
        <div className="animate-entrance-delay-5">
          <SongGeneration
            lyrics={lyrics}
            songTitle={songTitle}
            selectedVocal={selectedVocal}
            songLength={songLength}
            onSongGenerated={setGeneratedSongUrl}
            onGenerationStateChange={setIsSongGenerating}
            showValidation={true}
          />
        </div>

        {/* Title Input - Above Generate Button */}
        <div className="animate-entrance-delay-6">
          <TitleInput
            title={songTitle}
            onTitleChange={setSongTitle}
            lyrics={lyrics}
            selectedGender={selectedVocal}
            showValidation={true}
            isAutoGenerating={isTitleGenerating && !isSongGenerating}
          />
        </div>

        {/* Generate Melody Gram Button */}
        <div className="animate-entrance-delay-7">
          {/* Error Message */}
          {generationError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{generationError}</p>
            </div>
          )}

          <div className="text-center space-y-4">
            <button
              onClick={handleGenerateMelodyGram}
              disabled={!isFormValid() || isGenerating}
              className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 ${
                isFormValid() && !isGenerating
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Melody Gram...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-6 h-6" />
                  <span>Generate Melody Gram</span>
                </div>
              )}
            </button>

            {!isFormValid() && !isGenerating && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {selectedVocal === '' && "Choose Voice Style • "}
                  {!hasImage && "Upload an Avatar • "}
                  {songLength <= 0 && "Select a Song Length • "}
                  {lyrics.trim() === '' && "Write Lyrics • "}
                  {songTitle.trim() === '' && "Add a Song Title • "}
                  {generatedSongUrl === null && "Generate a Song"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credits Summary - Disabled for now */}
        {/* <div className="animate-entrance-delay-7">
          <CreditsSummary 
            songLength={songLength}
            songTitle={songTitle}
          />
        </div> */}
      </div>
    </div>
  )
} 