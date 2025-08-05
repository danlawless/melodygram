'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Zap, Loader2, Wand2, Music, Upload, User, Play, Clock, ChevronDown, X, Terminal } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LyricsEditor from './LyricsEditor'
import SongGeneration from './SongGeneration'
import TitleInput from './TitleInput'
import FinalPreview from './FinalPreview'
import MelodyGramPreview from './MelodyGramPreview'
import TipButton from '../ui/TipButton'
import { lemonSliceApiService } from '../../services/lemonSliceApi'
import { songStorageService, SavedSong } from '../../services/songStorage'
import { genderDetectionService } from '../../services/genderDetection'
import { murekaApiService } from '../../services/murekaApi'
import { titleGenerationService } from '../../services/titleGeneration'
import SongLengthSelector from './SongLengthSelector'
// import CreditsSummary from './CreditsSummary' // Disabled for now
import PathNavigation from './PathNavigation'
import { toastService } from '../../services/toastService'
import { creditSystemService, getCreditsForLength } from '../../services/creditSystem'
import { debugLogger } from '../../services/debugLogger'
import DebugModal from '../debug/DebugModal'

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
  const [fullErrorDetails, setFullErrorDetails] = useState<{
    message: string
    stack?: string
    timestamp: string
    context?: any
  } | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  
  // Dry run results state
  const [dryRunResults, setDryRunResults] = useState<{
    success: boolean
    timestamp: string
    imageAnalysis: {
      originalUrl: string
      finalUrl: string
      isProxyUrl: boolean
      isDallEUrl: boolean
      isDirectImageUrl: boolean
    }
    audioAnalysis: {
      finalUrl: string
      isClipped: boolean
    }
    costAnalysis: {
      estimatedCost: string
      costStatus: string
    }
    apiParams: any
    warnings: string[]
    summary: string
  } | null>(null)
  const [showDryRunResults, setShowDryRunResults] = useState(false)
  const [isTitleGenerating, setIsTitleGenerating] = useState(false)
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null)
  const [songLength, setSongLength] = useState<number>(30) // Default song length
  const [generatedSongUrl, setGeneratedSongUrl] = useState<string | null>(null)
  const [isSongGenerating, setIsSongGenerating] = useState(false)
  const [currentGenerationNumber, setCurrentGenerationNumber] = useState<number>(0)
  const [totalGenerations, setTotalGenerations] = useState<number>(0)
  
  // Navigation state for cached avatars and songs
  const [avatarHistory, setAvatarHistory] = useState<any[]>([])
  const [songHistory, setSongHistory] = useState<any[]>([])
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState<number>(0)
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0)
  
  // Gender alignment lock state
  const [genderAlignmentLocked, setGenderAlignmentLocked] = useState<boolean>(false)
  
  // Modal state
  const [showCreditConfirmModal, setShowCreditConfirmModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDebugModal, setShowDebugModal] = useState(false)
  const [isDebugMode, setIsDebugMode] = useState(false)
  
  // Dry run state for testing without generating
  const [isDryRunEnabled, setIsDryRunEnabled] = useState(false)
  
  // Clear dry run results when dry run is disabled
  useEffect(() => {
    if (!isDryRunEnabled && dryRunResults) {
      setDryRunResults(null)
      setShowDryRunResults(false)
    }
  }, [isDryRunEnabled, dryRunResults])

  // Check for debug mode on mount
  useEffect(() => {
    setIsDebugMode(debugLogger.isDebugMode())
  }, [])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showCreditConfirmModal || showDebugModal) {
      document.body.style.overflow = 'hidden'
      console.log('🔒 Background scrolling disabled (modal open)')
    } else {
      document.body.style.overflow = 'unset'
      console.log('🔓 Background scrolling enabled (modal closed)')
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCreditConfirmModal, showDebugModal])

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
            hasGeneratedImage: !!session.hasGeneratedImage,
            hasUploadedImage: !!session.hasUploadedImage,
            hasCurrentAvatar: !!session.currentAvatarUrl,
            avatarIndex: session.currentAvatarIndex,
            storageOptimized: true
          })
          
          let restored = []
          if (session.lyrics) { setLyrics(session.lyrics); restored.push('lyrics') }
          if (session.songTitle) { setSongTitle(session.songTitle); restored.push('title') }
          if (session.selectedVocal) { setSelectedVocal(session.selectedVocal); restored.push('vocal') }
          if (session.songLength) { setSongLength(session.songLength); restored.push('length') }
                    // Handle both old format (with full URLs) and new format (boolean flags)
          if (session.generatedImageUrl && typeof session.generatedImageUrl === 'string') {
            // Old format - check if URL is still valid but don't restore to save space
            const isExpiredDalleUrl = session.generatedImageUrl.includes('blob.core.windows.net') && 
                                    session.generatedImageUrl.includes('se=')
            
            if (isExpiredDalleUrl) {
              console.log('🔴 Found expired DALL-E URL in old session format, clearing...')
            } else {
              console.log('🎨 Found generated image in old session format, not restoring to save storage space')
            }
          } else if (session.hasGeneratedImage) {
            console.log('🎨 Session had generated image, but not restored to save storage space')
          }
          if (session.generatedSongUrl) {
            setGeneratedSongUrl(session.generatedSongUrl);
            restored.push('generated-song')
            console.log('🎵 Restored generated song URL:', session.generatedSongUrl?.substring(0, 50) + '...')
          }
          // Handle both old format (with blob URLs) and new format (boolean flags)
          if (session.uploadedImageUrl && typeof session.uploadedImageUrl === 'string') {
            console.log('📸 Found uploaded image in old session format, not restoring to save storage space')
          } else if (session.hasUploadedImage) {
            console.log('📸 Session had uploaded image, but not restored to save storage space')
          }
          
          // Restore the currently selected avatar from avatar history if available
          if (session.currentAvatarUrl) {
            console.log('🎭 Attempting to restore selected avatar:', session.currentAvatarUrl.substring(0, 50) + '...')
            setGeneratedImageUrl(session.currentAvatarUrl)
            if (session.currentAvatarIndex !== undefined) {
              setCurrentAvatarIndex(session.currentAvatarIndex)
            }
            restored.push('selected-avatar')
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
        // Don't save expired DALL-E URLs
        const cleanGeneratedImageUrl = generatedImageUrl && 
          generatedImageUrl.includes('blob.core.windows.net') && 
          generatedImageUrl.includes('se=') ? null : generatedImageUrl
        
        const session = {
          lyrics,
          songTitle,
          selectedVocal,
          songLength,
          // Don't store full base64 images or blob URLs in session to avoid quota issues
          hasGeneratedImage: !!cleanGeneratedImageUrl,
          generatedSongUrl,
          hasUploadedImage: !!uploadedImageUrl,
          uploadedImageName: uploadedImage?.name || null,
          // Store the currently selected avatar info to restore on page refresh
          currentAvatarUrl: cleanGeneratedImageUrl || uploadedImageUrl,
          currentAvatarIndex: currentAvatarIndex,
          lastUpdated: new Date().toISOString()
        }
        
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session))
          console.log('💾 Saved creation session:', {
            songLengthSeconds: songLength,
            hasGeneratedImage: !!cleanGeneratedImageUrl,
            hasUploadedImage: !!uploadedImageUrl,
            lyricsCharCount: lyrics?.length || 0,
            titleCharCount: songTitle?.length || 0,
            currentAvatarSaved: !!session.currentAvatarUrl,
            avatarIndex: session.currentAvatarIndex,
            storageOptimized: true
          })
        } catch (error) {
          console.error('Failed to save session:', error)
        }
      }, 500) // Debounce saves by 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [lyrics, songTitle, selectedVocal, songLength, generatedImageUrl, generatedSongUrl, uploadedImageUrl, currentAvatarIndex])

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
    // Smart alignment will handle any incompatibilities
  }

  // Handle generation info updates from SongGeneration component
  const handleGenerationInfoChange = (generationNumber: number, totalCount: number) => {
    setCurrentGenerationNumber(generationNumber)
    setTotalGenerations(totalCount)
  }

  // Helper functions for smart avatar navigation
  const findNextAvatar = (startIndex: number, direction: 'next' | 'prev'): number => {
    // Always allow avatar navigation regardless of lock state
    // The smart alignment will handle finding compatible songs after avatar changes
    if (direction === 'next') {
      return startIndex < avatarHistory.length - 1 ? startIndex + 1 : 0
    } else {
      return startIndex > 0 ? startIndex - 1 : avatarHistory.length - 1
    }
  }

  // Navigation functions for avatars
  const handlePreviousAvatar = () => {
    if (avatarHistory.length > 1) {
      const newIndex = findNextAvatar(currentAvatarIndex, 'prev')
      setCurrentAvatarIndex(newIndex)
      setGeneratedImageUrl(avatarHistory[newIndex].imageUrl)
      console.log(`🎭 Navigated to avatar: ${avatarHistory[newIndex].gender} (Lock: ${genderAlignmentLocked ? 'ON - will find matching song' : 'OFF'})`)
    }
  }

  const handleNextAvatar = () => {
    if (avatarHistory.length > 1) {
      const newIndex = findNextAvatar(currentAvatarIndex, 'next')
      setCurrentAvatarIndex(newIndex)
      setGeneratedImageUrl(avatarHistory[newIndex].imageUrl)
      console.log(`🎭 Navigated to avatar: ${avatarHistory[newIndex].gender} (Lock: ${genderAlignmentLocked ? 'ON - will find matching song' : 'OFF'})`)
    }
  }

  // Helper function for smart song navigation
  const findNextCompatibleSong = (startIndex: number, direction: 'next' | 'prev'): number => {
    if (!genderAlignmentLocked || avatarHistory.length === 0) {
      // If not locked, use simple navigation
      if (direction === 'next') {
        return startIndex < songHistory.length - 1 ? startIndex + 1 : 0
      } else {
        return startIndex > 0 ? startIndex - 1 : songHistory.length - 1
      }
    }

    // When locked, find next song that matches current avatar gender
    const currentAvatarGender = avatarHistory[currentAvatarIndex]?.gender
    if (!currentAvatarGender) return startIndex

    let searchIndex = startIndex
    let attempts = 0
    const maxAttempts = songHistory.length

    do {
      if (direction === 'next') {
        searchIndex = searchIndex < songHistory.length - 1 ? searchIndex + 1 : 0
      } else {
        searchIndex = searchIndex > 0 ? searchIndex - 1 : songHistory.length - 1
      }
      
      attempts++
      
      // Check if this song is compatible with current avatar
      const song = songHistory[searchIndex]
      if (song?.selectedVocal === currentAvatarGender) {
        return searchIndex
      }
      
    } while (searchIndex !== startIndex && attempts < maxAttempts)

    // If no compatible song found, stay at current position
    return startIndex
  }

  // Navigation functions for songs
  const handlePreviousSong = () => {
    if (songHistory.length > 1) {
      const newIndex = findNextCompatibleSong(currentSongIndex, 'prev')
      if (newIndex !== currentSongIndex) {
        setCurrentSongIndex(newIndex)
        setGeneratedSongUrl(songHistory[newIndex].audioUrl)
        setSongTitle(songHistory[newIndex].title || songTitle)
        setSelectedVocal(songHistory[newIndex].selectedVocal || selectedVocal)
        setSongLength(songHistory[newIndex].songLength || songLength)
        console.log(`🎵 Navigated to compatible song: ${songHistory[newIndex].selectedVocal} voice`)
      }
    }
  }

  const handleNextSong = () => {
    if (songHistory.length > 1) {
      const newIndex = findNextCompatibleSong(currentSongIndex, 'next')
      if (newIndex !== currentSongIndex) {
        setCurrentSongIndex(newIndex)
        setGeneratedSongUrl(songHistory[newIndex].audioUrl)
        setSongTitle(songHistory[newIndex].title || songTitle)
        setSelectedVocal(songHistory[newIndex].selectedVocal || selectedVocal)
        setSongLength(songHistory[newIndex].songLength || songLength)
        console.log(`🎵 Navigated to compatible song: ${songHistory[newIndex].selectedVocal} voice`)
      }
    }
  }

  // Callbacks to receive history updates from child components
  const handleAvatarHistoryUpdate = (history: any[], currentIndex: number = 0) => {
    setAvatarHistory(history)
    setCurrentAvatarIndex(currentIndex)
    // Auto-alignment is handled by useEffect
  }

  const handleSongHistoryUpdate = (history: any[], currentIndex: number = 0) => {
    setSongHistory(history)
    setCurrentSongIndex(currentIndex)
    // Update generation number to match the selected song index
    const generationNumber = currentIndex + 1
    setCurrentGenerationNumber(generationNumber)
    console.log('🔄 Song history updated - currentIndex:', currentIndex, 'generationNumber:', generationNumber)
  }

  // Smart alignment system: find compatible song when locked on mismatch
  const smartAlignment = useCallback(() => {
    if (!genderAlignmentLocked || avatarHistory.length === 0 || songHistory.length === 0) return

    const currentAvatarGender = avatarHistory[currentAvatarIndex]?.gender
    const currentSong = songHistory[currentSongIndex]
    
    // When locked, if there's a mismatch, find the next compatible song
    if (currentAvatarGender && currentSong?.selectedVocal !== currentAvatarGender) {
      
      // Manual search for compatible song to avoid dependency issues
      let searchIndex = currentSongIndex
      let attempts = 0
      const maxAttempts = songHistory.length
      let foundIndex = currentSongIndex

      do {
        searchIndex = searchIndex < songHistory.length - 1 ? searchIndex + 1 : 0
        attempts++
        
        const song = songHistory[searchIndex]
        if (song?.selectedVocal === currentAvatarGender) {
          foundIndex = searchIndex
          break
        }
        
      } while (searchIndex !== currentSongIndex && attempts < maxAttempts)
      
      if (foundIndex !== currentSongIndex) {
        console.log(`🔒 Smart Lock: ${currentAvatarGender} avatar needs ${currentAvatarGender} song → Found "${songHistory[foundIndex]?.title}" (${songHistory[foundIndex]?.selectedVocal})`)
        setCurrentSongIndex(foundIndex)
        setGeneratedSongUrl(songHistory[foundIndex].audioUrl)
        setSongTitle(songHistory[foundIndex].title || songTitle)
        setSelectedVocal(songHistory[foundIndex].selectedVocal || selectedVocal)
        setSongLength(songHistory[foundIndex].songLength || songLength)
        
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15)
        }
      } else {
        // If no compatible song found, fall back to aligning voice to avatar
        console.log(`🔒 No compatible ${currentAvatarGender} song found, aligning voice: ${selectedVocal} → ${currentAvatarGender}`)
        setSelectedVocal(currentAvatarGender)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15)
        }
      }
    }
  }, [avatarHistory, currentAvatarIndex, selectedVocal, genderAlignmentLocked, songHistory, currentSongIndex, songTitle])

  // Auto-align when lock state, avatar, or voice selection changes
  useEffect(() => {
    if (genderAlignmentLocked) {
      smartAlignment()
    }
  }, [genderAlignmentLocked, currentAvatarIndex, avatarHistory, selectedVocal, currentSongIndex, smartAlignment])

  // Handle gender alignment toggle
  const handleGenderAlignmentToggle = () => {
    setGenderAlignmentLocked(!genderAlignmentLocked)
    
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20)
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

  const handleGenerateMelodyGramClick = () => {
    if (!isFormValid()) return
    
    // Show confirmation modal instead of immediately generating
    setShowCreditConfirmModal(true)
  }

  const handleGenerateMelodyGram = async (dryRun: boolean = false) => {
    // Close the modal
    setShowCreditConfirmModal(false)
    
    // Start debug logging if debug mode is enabled
    if (isDebugMode) {
      debugLogger.startCapturing()
      console.log('🐛 =================== DEBUG MODE ACTIVATED ===================')
      console.log('🐛 All logs are being captured for debugging purposes')
      console.log('🐛 =========================================================')
    }
    
    if (dryRun) {
      console.log('🧪 =================== DRY RUN MODE - NO ACTUAL API CALLS ===================')
      console.log('🧪 This will test everything without sending to LemonSlice (no cost)')
      console.log('🧪 ========================================================================')
    }

    // =============== COMPREHENSIVE GENERATE BUTTON LOGGING ===============
    const generateContext = {
      timestamp: new Date().toISOString(),
      buttonType: 'MELODYGRAM_GENERATION',
      user: {
        sessionId: Date.now(), // Simple session identifier
      },
      inputData: {
        songTitle: songTitle,
        lyrics: lyrics,
        selectedVocal: selectedVocal,
        songLength: songLength,
        uploadedImage: uploadedImage ? 'PROVIDED' : 'NOT_PROVIDED',
        generatedImageUrl: generatedImageUrl ? 'PROVIDED' : 'NOT_PROVIDED',
        generatedSongUrl: generatedSongUrl ? 'PROVIDED' : 'NOT_PROVIDED',
        currentGenerationNumber: currentGenerationNumber,
        totalGenerations: totalGenerations
      },
      formValidation: {
        isFormValid: isFormValid(),
        songTitleLength: songTitle.length,
        lyricsLength: lyrics.length,
        hasAudio: !!generatedSongUrl,
        hasImage: !!(uploadedImage || generatedImageUrl)
      },
      systemContext: {
        component: 'CreationStudio',
        handler: 'handleGenerateMelodyGram',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }

    console.log('🎬 =================== MELODYGRAM GENERATE BUTTON CLICKED ===================')
    console.log('🎬 FULL CONTEXT:', JSON.stringify(generateContext, null, 2))
    console.log('🎬 ========================================================================')
    // =========================================================================

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

    console.log('🎬 Created song object for storage:', JSON.stringify(newSong, null, 2))

    try {
      setIsGenerating(true)
      setGenerationError(null) // Clear any previous errors
      setFullErrorDetails(null) // Clear full error details
      setShowErrorDetails(false) // Reset error details expansion
      
      // Save initial song to storage
      songStorageService.saveSong(newSong)
      console.log('🎬 Melody Gram creation started:', songTitle)
      console.log('🎵 Original song URL:', generatedSongUrl)
      
      // Step 0: Create clipped audio if user has made a selection  
      let finalAudioUrl = generatedSongUrl
      
      console.log('🔍 DEBUG: Checking for audio selection...')
      console.log('🔍 songHistory length:', songHistory?.length || 0)
      console.log('🔍 currentSongIndex:', currentSongIndex)
      
      if (songHistory && songHistory.length > 0) {
        const currentSong = songHistory[currentSongIndex] // Use correct index
        console.log('🔍 currentSong exists:', !!currentSong)
        console.log('🔍 currentSong.audioSelection:', currentSong?.audioSelection)
        console.log('🔍 currentSong properties:', currentSong ? Object.keys(currentSong) : 'none')
        
        const audioUrl = currentSong?.fullAudioUrl || currentSong?.audioUrl || generatedSongUrl
        
        if (currentSong?.audioSelection && audioUrl) {
          console.log('🔀 ✅ FOUND audio selection, creating clipped version...')
          console.log('🔀 Selection:', currentSong.audioSelection)
          console.log('🔀 From audio URL:', audioUrl.substring(0, 50) + '...')
          
          // 🚨 CRITICAL: ALWAYS clip audio - NEVER send full audio to LemonSlice!
          console.log('🔀 🎯 MANDATORY AUDIO CLIPPING: Creating clipped version...')
          console.log('🔀 This is NON-NEGOTIABLE to prevent expensive full-audio LemonSlice calls')
          
          try {
            const { createClippedAudio } = await import('./SongGeneration')
            const clippedAudioUrl = await createClippedAudio(audioUrl, currentSong.audioSelection)
            
            if (clippedAudioUrl) {
              finalAudioUrl = clippedAudioUrl
              console.log('✅ 🎉 SUCCESSFULLY created clipped audio for MelodyGram:', clippedAudioUrl.substring(0, 50) + '...')
              console.log('🎵 Clipped duration:', currentSong.audioSelection.duration, 'seconds')
              console.log('🎵 Original vs clipped:', (currentSong.originalDuration || 'unknown'), 's →', currentSong.audioSelection.duration, 's')
              console.log('💰 Cost savings: Using', currentSong.audioSelection.duration, 'sec instead of full', (currentSong.originalDuration || 'unknown'), 'sec')
            } else {
              console.error('❌ 🚨 CRITICAL: createClippedAudio returned null - THIS SHOULD NEVER HAPPEN!')
              throw new Error('Audio clipping failed - cannot proceed with full audio')
            }
          } catch (error) {
            console.error('❌ 🚨 CRITICAL ERROR: Audio clipping failed:', error)
            console.error('🚨 Cannot send full audio to LemonSlice - this would be expensive!')
            throw new Error(`Audio clipping failed: ${error.message}. Full audio cannot be sent to LemonSlice.`)
          }
        } else {
          console.error('❌ 🚨 CRITICAL: Missing audio selection data!')
          console.error('   - Has audioSelection:', !!currentSong?.audioSelection)
          console.error('   - Has audioUrl:', !!audioUrl)
          console.error('🚨 CANNOT proceed without audio selection - would send full audio to LemonSlice!')
          
          throw new Error('Audio selection required. Cannot send full audio to LemonSlice - this would be expensive and is prohibited.')
        }
      } else {
        console.error('❌ 🚨 CRITICAL: No songHistory found!')
        console.error('🚨 Cannot proceed without song history and audio selection')
        throw new Error('Song history required for audio clipping. Cannot send full audio to LemonSlice.')
      }
      console.log('🎵 Final audio URL for MelodyGram:', finalAudioUrl)
      
      // Step 1: Create avatar with LemonSlice API using final audio
      if (generatedImageUrl) {
        // Only create avatar if we have a generated image URL (not uploaded file)
        // LemonSlice API v2 requires public URLs for both image and audio
                console.log('🎭 Creating avatar with LemonSlice API...')
        
        // Extract the actual DALL-E URL if it's coming through our proxy
        console.log('🖼️ =================== IMAGE URL DEBUGGING ===================')
        console.log('🖼️ Original generatedImageUrl:', generatedImageUrl)
        console.log('🖼️ Starts with proxy?', generatedImageUrl.startsWith('/api/proxy-image'))
        
        let actualImageUrl = generatedImageUrl
        if (generatedImageUrl.startsWith('/api/proxy-image') || generatedImageUrl.includes('/api/proxy-image')) {
          console.log('🖼️ Detected proxy URL, extracting original...')
          // Extract the original URL from the proxy URL
          try {
            const url = new URL(generatedImageUrl, `http://localhost:3000`)
            console.log('🖼️ Parsed URL object:', url.href)
            console.log('🖼️ URL param exists:', url.searchParams.has('url'))
            
            const originalUrl = url.searchParams.get('url')
            console.log('🖼️ Extracted URL parameter:', originalUrl)
            
            if (originalUrl) {
              actualImageUrl = originalUrl // DON'T decode - keep URL encoding intact for Azure signatures!
              console.log('🔗 ✅ Successfully extracted original DALL-E URL (FULL - ENCODED):')
              console.log('🔗 ' + actualImageUrl)
            } else {
              console.error('❌ No URL parameter found in proxy URL!')
              console.log('🖼️ Will use original URL as fallback')
            }
          } catch (error) {
            console.error('❌ Error parsing proxy URL:', error)
            console.log('🖼️ Will use original URL as fallback')
          }
        } else {
          console.log('🖼️ URL is already direct (not a proxy URL)')
        }
        
        console.log('🖼️ Final actualImageUrl:', actualImageUrl)
        console.log('🖼️ ===========================================================')
        
        let fixedImageUrl = actualImageUrl
        
        console.log('🎭 Using Image URL:', fixedImageUrl)
        console.log('🎭 Audio URL:', finalAudioUrl)
        
        try {
          // COST PROTECTION: Estimate cost before proceeding (same as working test)
          const { estimateLemonSliceCost, checkCostLimit, COST_LIMITS } = await import('../../utils/costEstimator')
          const costEstimate = estimateLemonSliceCost('256', 15) // Assume 15 seconds for avatar
          const costCheck = checkCostLimit(costEstimate, COST_LIMITS.PRODUCTION)
          
          console.log(`💰 Estimated cost: $${costEstimate.costUSD} (15s @ 256px)`)
          console.log(costCheck.message)
          
          if (!costCheck.allowed) {
            throw new Error(`Cost limit exceeded: ${costCheck.message}`)
          }
          
          if (costEstimate.warning) {
            console.log(`⚠️ ${costEstimate.warning}`)
          }

          console.log('🎬 Starting avatar creation...')
          console.log('⏰ Expected processing time: 2-10 minutes depending on song length')
          
          const lemonSliceParams = {
            image: fixedImageUrl,
            audio: finalAudioUrl!,
            title: songTitle, // Pass the song title
            songLength: songLength, // Pass song length for better generation
            model: 'V2.5' as const, // Using V2.5 model (not V2.7)
            resolution: '256' as const, // Lower resolution for cost savings (recommended by LemonSlice)
            animation_style: 'autoselect' as 'autoselect',
            expressiveness: 0.8,
            crop_head: false
          }
          
          console.log('🎭 =================== LEMONSLICE API CALL PARAMS ===================')
          console.log('🎭 PARAMETERS SENT TO LEMONSLICE:', JSON.stringify(lemonSliceParams, null, 2))
          console.log('🎭 ================================================================')
          
          if (dryRun) {
            console.log('🧪 =================== DRY RUN RESULTS ===================')
            console.log('🧪 SUCCESS! All parameters prepared correctly.')
            console.log('🧪')
            console.log('🧪 📸 IMAGE ANALYSIS:')
            console.log('🧪   Original URL:', generatedImageUrl)
            console.log('🧪   Final URL (FULL):', fixedImageUrl)
            console.log('🧪   Is proxy URL:', fixedImageUrl?.includes('/api/proxy-image') ? 'YES ❌ (BAD!)' : 'NO ✅ (GOOD!)')
            console.log('🧪   Is DALL-E URL:', fixedImageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net') ? 'YES ✅ (GOOD!)' : 'NO ❌ (BAD!)')
            console.log('🧪')
            console.log('🧪 🎵 AUDIO ANALYSIS:')
            console.log('🧪   Final URL (FULL):', finalAudioUrl)
            console.log('🧪   Is clipped:', finalAudioUrl?.includes('temp-audio') ? 'YES ✅ (GOOD!)' : 'NO ❌ (using full song - EXPENSIVE!)')
            console.log('🧪')
            if (fixedImageUrl?.includes('/api/proxy-image')) {
              console.log('🧪 ❌ WARNING: Still using proxy URL for image! LemonSlice cannot access this.')
              console.log('🧪 ❌ This will cause the generation to fail.')
            } else if (fixedImageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net')) {
              console.log('🧪 ✅ PERFECT! Using direct DALL-E URL that LemonSlice can access.')
            } else {
              console.log('🧪 ⚠️  Unknown image URL format. Check if LemonSlice can access this URL.')
            }
            console.log('🧪')
            console.log('🧪 Everything looks good! Uncheck dry run to proceed with real generation.')
            console.log('🧪 ====================================================')
            
            // Capture structured dry run results for UI display
            const isProxyUrl = fixedImageUrl?.includes('/api/proxy-image') || false
            const isDallEUrl = fixedImageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net') || false
            const isDirectImageUrl = Boolean(fixedImageUrl && (
              fixedImageUrl.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i) !== null ||
              fixedImageUrl.includes('temp-avatars') ||
              fixedImageUrl.includes('ngrok') ||
              isDallEUrl
            ))
            const isClipped = finalAudioUrl?.includes('temp-audio') || false
            
            const warnings: string[] = []
            let summary: string
            
            if (isProxyUrl) {
              warnings.push('⚠️ Still using proxy URL for image! LemonSlice cannot access this.')
              warnings.push('⚠️ This will cause the generation to fail.')
              summary = '❌ Issues found - Generation will likely fail due to proxy URL'
            } else if (isDirectImageUrl) {
              if (isDallEUrl) {
                summary = '✅ Perfect! Using direct DALL-E URL that LemonSlice can access.'
              } else {
                summary = '✅ Good! Using direct image URL that LemonSlice should be able to access.'
              }
            } else {
              warnings.push('⚠️ Unusual image URL format. Verify LemonSlice can access this URL.')
              summary = '⚠️ Unusual image URL format - may need verification'
            }
            
            if (!isClipped) {
              warnings.push('⚠️ Using full song instead of clipped audio - this will be expensive!')
            }
            
            setDryRunResults({
              success: true,
              timestamp: new Date().toISOString(),
              imageAnalysis: {
                originalUrl: generatedImageUrl || 'None',
                finalUrl: fixedImageUrl || 'None',
                isProxyUrl,
                isDallEUrl,
                isDirectImageUrl
              },
              audioAnalysis: {
                finalUrl: finalAudioUrl || 'None',
                isClipped
              },
              costAnalysis: {
                estimatedCost: `$${costEstimate.costUSD}`,
                costStatus: costCheck.message || 'Within limits'
              },
              apiParams: lemonSliceParams,
              warnings,
              summary
            })
            
            setShowDryRunResults(true)
            
            // Show success notification for dry run
            console.log('🧪 Dry run completed successfully! Check console logs above for detailed results.')
            return
          }
          
          const avatarResponse = await lemonSliceApiService.createAvatar(lemonSliceParams)
          
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
            
            // 🔍 GENDER DETECTION & CORRECTION STEP
            // Only proceed if selectedVocal is male or female
            if (selectedVocal === 'male' || selectedVocal === 'female') {
              let finalGender: 'male' | 'female' = selectedVocal // Now TypeScript knows this is safe
              
              try {
                // Use the image URL from the creation response since AvatarTaskStatus doesn't have img_url
                const imageUrlForAnalysis = avatarResponse.img_url
                
                if (imageUrlForAnalysis) {
                console.log('🔍 Running gender detection on generated avatar...')
                
                const genderAnalysis = await genderDetectionService.analyzeAvatarGender(
                  imageUrlForAnalysis,
                  selectedVocal
                )
                
                // Log any mismatches for analytics
                genderDetectionService.logGenderMismatch(genderAnalysis, avatarResult.job_id || avatarResponse.job_id)
                
                // Get the corrected gender (will be original if no correction needed)
                finalGender = genderDetectionService.getCorrectedGender(genderAnalysis)
                
                if (genderAnalysis.correctionNeeded) {
                  console.log(`🔧 Gender correction applied: ${selectedVocal} → ${finalGender}`)
                  console.log(`   Reason: ${genderAnalysis.reasoning}`)
                  
                  // 🎯 UPDATE UI TO REFLECT CORRECTED GENDER
                  setSelectedVocal(finalGender)
                  console.log(`🎨 UI updated to show corrected gender: ${finalGender}`)
                  
                  // 🎨 SHOW USER-FRIENDLY NOTIFICATION
                  toastService.info(
                    `Avatar Gender Adjusted`, 
                    `AI detected your avatar appears ${finalGender}. Gender selection updated automatically for better audio sync.`,
                    8000 // Show for 8 seconds
                  )
                } else {
                  console.log(`✅ Avatar gender matches selection: ${selectedVocal}`)
                }
                } else {
                  console.log('⚠️ Skipping gender detection - no image URL available')
                }
              } catch (genderError) {
                console.warn('⚠️ Gender detection failed, using original selection:', genderError)
                // Continue with original selection if detection fails
              }
              
              // Update song storage with corrected gender
              songStorageService.updateSong(songId, { 
                videoUrl: avatarResult.video_url,
                thumbnailUrl: avatarResult.thumbnail_url,
                duration: avatarResult.duration,
                completedAt: new Date().toISOString(),
                progress: 100,
                genre: 'Pop', // Default for now
                mood: finalGender === 'male' ? 'Confident' : 'Happy', // Use corrected gender for mood
                vocalGender: finalGender // Store the corrected gender for future reference
              })
            } else {
              console.log('⚠️ Skipping gender detection - unsupported gender selection:', selectedVocal)
              
              // Update song storage without gender correction
              songStorageService.updateSong(songId, { 
                videoUrl: avatarResult.video_url,
                thumbnailUrl: avatarResult.thumbnail_url,
                duration: avatarResult.duration,
                completedAt: new Date().toISOString(),
                progress: 100,
                genre: 'Pop', // Default for now
                mood: 'Happy' // Default mood
              })
            }
            
            setAvatarVideoUrl(avatarResult.video_url) // Update state with video URL
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
          audioUrl: finalAudioUrl!, // Save the final (potentially clipped) audio URL
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
      
      // Capture full error details for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const fullError = {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        context: {
          lyrics: lyrics?.substring(0, 100) + (lyrics?.length > 100 ? '...' : ''),
          selectedVocal,
          songLength,
          hasUploadedImage: !!uploadedImage,
          hasGeneratedImage: !!generatedImageUrl
        }
      }
      
      setFullErrorDetails(fullError)
      
      // Log full error to debug system
      console.error('🚨 Full generation error details:', fullError)
      
      // Show user-friendly error message
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
      
      // Stop debug logging and show modal if debug mode is enabled
      if (isDebugMode) {
        debugLogger.stopCapturing()
        console.log('🐛 =================== DEBUG MODE COMPLETE ===================')
        console.log('🐛 Log capture stopped. Click the debug button to view logs.')
        console.log('🐛 ========================================================')
        
        // Auto-show debug modal after generation completes
        setTimeout(() => {
          setShowDebugModal(true)
        }, 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Elegant Header */}
      <div className="bg-black border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-6 pt-4 pb-6">
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
            
            <div className="flex items-center space-x-3">
              {/* Debug Button - Only show in debug mode */}
              {isDebugMode && (
                <button
                  onClick={() => setShowDebugModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  title="Open debug console"
                >
                  <Terminal className="w-4 h-4" />
                  <span className="hidden sm:inline">Debug</span>
                </button>
              )}
              
              {/* Tip Button */}
              <TipButton
                title="Song Creation Tips"
                content="Start by choosing your vocal preference, then add your content. Your gender selection will influence the avatar generation, lyrics style, and vocal characteristics throughout the entire creation process."
                position="bottom"
              />
            </div>
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
                  <div className="text-2xl mb-2">
                    🎤
                    {genderAlignmentLocked && selectedVocal === 'male' && <span className="ml-1">🔒</span>}
                  </div>
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
                  <div className="text-2xl mb-2">
                    🎙️
                    {genderAlignmentLocked && selectedVocal === 'female' && <span className="ml-1">🔒</span>}
                  </div>
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
            onHistoryUpdate={handleAvatarHistoryUpdate}
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
            onGenerationInfoChange={handleGenerationInfoChange}
            onLyricsChange={setLyrics}
            onTitleChange={setSongTitle}
            onSongLengthChange={setSongLength}
            onVocalChange={setSelectedVocal}
            showValidation={true}
            onHistoryUpdate={handleSongHistoryUpdate}
            activeAudioUrl={songHistory[currentSongIndex]?.audioUrl}
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

        {/* Final Preview Section */}
        {isFormValid() && (
          <div className="animate-entrance-delay-7">
            <FinalPreview
              uploadedImageUrl={uploadedImageUrl}
              generatedImageUrl={generatedImageUrl}
              songTitle={songTitle}
              songLength={songLength}
              selectedVocal={selectedVocal}
              generatedSongUrl={generatedSongUrl}
              currentGenerationNumber={currentGenerationNumber}
              totalGenerations={totalGenerations}
              lyrics={lyrics}
              audioSelection={songHistory && songHistory.length > 0 ? songHistory[currentSongIndex]?.audioSelection : undefined}
              hasMultipleAvatars={avatarHistory.length > 1}
              hasMultipleAudio={(() => {
                if (!genderAlignmentLocked) return songHistory.length > 1
                // When locked, check if there are multiple songs that match current avatar gender
                const currentAvatarGender = avatarHistory[currentAvatarIndex]?.gender
                if (!currentAvatarGender) return songHistory.length > 1
                const compatibleCount = songHistory.filter(song => song?.selectedVocal === currentAvatarGender).length
                return compatibleCount > 1
              })()}
              onPreviousAvatar={handlePreviousAvatar}
              onNextAvatar={handleNextAvatar}
              onPreviousAudio={handlePreviousSong}
              onNextAudio={handleNextSong}
              currentAvatarGender={avatarHistory[currentAvatarIndex]?.gender}
              genderAlignmentLocked={genderAlignmentLocked}
              onGenderAlignmentToggle={handleGenderAlignmentToggle}
            />
          </div>
        )}

        {/* Generate Melody Gram Button */}
        <div className="animate-entrance-delay-8">
          {/* Error Message */}
          {generationError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <p className="text-red-600 dark:text-red-400 text-sm flex-1">{generationError}</p>
                {fullErrorDetails && (
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="ml-3 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 underline flex-shrink-0 transition-colors"
                    title="Click to see full error details"
                  >
                    {showErrorDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                )}
              </div>
              
              {/* Full Error Details (Expandable) */}
              {showErrorDetails && fullErrorDetails && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-red-600 dark:text-red-400">Timestamp:</strong>
                      <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">
                        {new Date(fullErrorDetails.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div>
                      <strong className="text-red-600 dark:text-red-400">Error Message:</strong>
                      <pre className="ml-2 mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
{fullErrorDetails.message}
                      </pre>
                    </div>
                    
                    {fullErrorDetails.context && (
                      <div>
                        <strong className="text-red-600 dark:text-red-400">Context:</strong>
                        <pre className="ml-2 mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
{JSON.stringify(fullErrorDetails.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {fullErrorDetails.stack && (
                      <div>
                        <strong className="text-red-600 dark:text-red-400">Stack Trace:</strong>
                        <pre className="ml-2 mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto">
{fullErrorDetails.stack}
                        </pre>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(fullErrorDetails, null, 2))
                          // Could add a toast notification here
                        }}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Copy Error
                      </button>
                      <button
                        onClick={() => setShowDebugModal(true)}
                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                      >
                        Open Debug Console
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center space-y-4">
            <button
              onClick={handleGenerateMelodyGramClick}
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
                  {isDryRunEnabled ? (
                    <>
                      <Terminal className="w-6 h-6" />
                      <span>🧪 Dry Run MelodyGram</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      <span>Generate MelodyGram</span>
                    </>
                  )}
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

      {/* Credit Confirmation Modal */}
      {showCreditConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={(e) => {
            // Only close modal if clicking directly on backdrop, not on modal content
            if (e.target === e.currentTarget) {
              setShowCreditConfirmModal(false)
            }
          }}
        >
          <div className="min-h-screen flex items-start justify-center p-4 py-8">
            <div 
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-4xl shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => {
                // Prevent backdrop click when clicking on modal content
                e.stopPropagation()
              }}
            >
            <div className="text-center space-y-4 pb-24">
              {/* Header */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">Confirm MelodyGram Generation</h3>
              </div>

              {/* Credit Information */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Song Duration:</span>
                  <span className="text-white font-medium">
                    {(() => {
                      if (songHistory && songHistory.length > 0) {
                        const currentSong = songHistory[currentSongIndex]
                        if (currentSong?.audioSelection) {
                          return `${Math.round(currentSong.audioSelection.duration)}s (selected)`
                        }
                        return `${Math.round(currentSong?.targetDuration || songLength)}s`
                      }
                      return `${songLength}s`
                    })()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Credit Cost:</span>
                  <span className="text-purple-400 font-bold text-lg">
                    {(() => {
                      if (songHistory && songHistory.length > 0) {
                        const currentSong = songHistory[currentSongIndex]
                        if (currentSong?.audioSelection) {
                          return `${getCreditsForLength(currentSong.audioSelection.duration)} credits`
                        }
                        return `${getCreditsForLength(currentSong?.targetDuration || songLength)} credits`
                      }
                      return `${getCreditsForLength(songLength)} credits`
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-300">Your Balance:</span>
                  <span className="text-green-400 font-medium">
                    {creditSystemService.getUserCredits().balance} credits
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">After Generation:</span>
                  <span className={`font-medium ${
                    (() => {
                      const costCredits = (() => {
                        if (songHistory && songHistory.length > 0) {
                          const currentSong = songHistory[currentSongIndex]
                          if (currentSong?.audioSelection) {
                            return getCreditsForLength(currentSong.audioSelection.duration)
                          }
                          return getCreditsForLength(currentSong?.targetDuration || songLength)
                        }
                        return getCreditsForLength(songLength)
                      })()
                      const remaining = creditSystemService.getUserCredits().balance - costCredits
                      return remaining >= 0 ? 'text-green-400' : 'text-red-400'
                    })()
                  }`}>
                    {(() => {
                      const costCredits = (() => {
                        if (songHistory && songHistory.length > 0) {
                          const currentSong = songHistory[currentSongIndex]
                          if (currentSong?.audioSelection) {
                            return getCreditsForLength(currentSong.audioSelection.duration)
                          }
                          return getCreditsForLength(currentSong?.targetDuration || songLength)
                        }
                        return getCreditsForLength(songLength)
                      })()
                      const remaining = creditSystemService.getUserCredits().balance - costCredits
                      return `${remaining} credits`
                    })()}
                  </span>
                </div>
              </div>


              {/* Insufficient Credits Warning */}
              {(() => {
                const costCredits = (() => {
                  if (songHistory && songHistory.length > 0) {
                    const currentSong = songHistory[currentGenerationNumber]
                    if (currentSong?.audioSelection) {
                      return getCreditsForLength(currentSong.audioSelection.duration)
                    }
                    return getCreditsForLength(currentSong?.targetDuration || songLength)
                  }
                  return getCreditsForLength(songLength)
                })()
                const hasEnoughCredits = creditSystemService.getUserCredits().balance >= costCredits
                
                if (!hasEnoughCredits) {
                  return (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-sm text-red-400">
                        ⚠️ Insufficient credits! You need {costCredits - creditSystemService.getUserCredits().balance} more credits.
                      </p>
                    </div>
                  )
                }
                return null
              })()}

              {/* Expandable Preview Section */}
              <div className="space-y-3">
                  {/* Toggle Preview Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPreview(!showPreview)
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${showPreview ? 'rotate-180' : ''}`} 
                    />
                    <span className="text-sm font-medium">Preview</span>
                  </button>

                  {/* Collapsible Preview Content */}
                  {showPreview && (
                    <div className="animate-in slide-in-from-top-5 duration-300 space-y-4">
                      <MelodyGramPreview
                        uploadedImage={uploadedImage}
                        generatedImageUrl={generatedImageUrl}
                        songTitle={songTitle}
                        lyrics={lyrics}
                        generatedSongUrl={generatedSongUrl}
                        audioSelection={
                          songHistory && songHistory.length > 0 && songHistory[currentSongIndex] 
                            ? songHistory[currentSongIndex].audioSelection 
                            : null
                        }
                        selectedVocal={selectedVocal}
                        songLength={songLength}
                        onClose={() => setShowPreview(false)}
                      />
                      
                      {/* Dry Run Checkbox */}
                      <div className="flex items-center justify-center pt-3 border-t border-gray-700/50">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isDryRunEnabled}
                            onChange={(e) => setIsDryRunEnabled(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300">
                            🧪 Dry Run Mode
                          </span>
                          <span className="text-xs text-gray-500">
                            (Test URLs & flow without generating)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

              {/* Dry Run Results Display */}
              {dryRunResults && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-5 shadow-lg">
                  <div className="text-center">
                    {/* Header */}
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                        <span className="text-xl">🧪</span>
                      </div>
                      <div className="text-center">
                        <h4 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold text-lg">
                          Dry Run Results
                        </h4>
                        <span className="text-xs text-purple-500 dark:text-purple-400 opacity-75">
                          {new Date(dryRunResults.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Summary */}
                    <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-100 dark:border-purple-800">
                      <p className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent text-base font-semibold">
                        {dryRunResults.summary}
                      </p>
                    </div>
                    
                    {/* Warnings */}
                    {dryRunResults.warnings.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {dryRunResults.warnings.map((warning, index) => (
                          <div key={index} className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700 px-4 py-3 rounded-lg">
                            <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                              {warning}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Status - Centered Grid */}
                    <div className="flex justify-center mb-5">
                      <div className="grid grid-cols-3 gap-8 text-sm">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 flex items-center justify-center shadow-md">
                            <span className="text-2xl">{dryRunResults.imageAnalysis.isDirectImageUrl ? '✅' : (dryRunResults.imageAnalysis.isProxyUrl ? '❌' : '⚠️')}</span>
                          </div>
                          <span className="text-purple-700 dark:text-purple-300 font-semibold">Image URL</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 flex items-center justify-center shadow-md">
                            <span className="text-2xl">{dryRunResults.audioAnalysis.isClipped ? '✅' : '⚠️'}</span>
                          </div>
                          <span className="text-purple-700 dark:text-purple-300 font-semibold">Audio Clipped</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 flex items-center justify-center shadow-md">
                            <span className="text-2xl">💰</span>
                          </div>
                          <span className="text-purple-700 dark:text-purple-300 font-semibold">{dryRunResults.costAnalysis.estimatedCost}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show Details Button */}
                    <button
                      onClick={() => setShowDryRunResults(!showDryRunResults)}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                      title="Click to see full dry run details"
                    >
                      {showDryRunResults ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  {/* Full Dry Run Details (Expandable) */}
                  {showDryRunResults && (
                    <div className="mt-5 pt-4 border-t border-purple-200 dark:border-purple-700">
                      <div className="space-y-4 text-sm">
                        {/* Image Analysis */}
                        <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">📸</span>
                            <strong className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">Image Analysis</strong>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Original:</span> <span className="font-mono text-gray-700 dark:text-gray-300 break-all ml-2">{dryRunResults.imageAnalysis.originalUrl}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Final:</span> <span className="font-mono text-gray-700 dark:text-gray-300 break-all ml-2">{dryRunResults.imageAnalysis.finalUrl}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Is Proxy:</span> <span className={`ml-2 font-medium ${dryRunResults.imageAnalysis.isProxyUrl ? 'text-red-600' : 'text-green-600'}`}>{dryRunResults.imageAnalysis.isProxyUrl ? 'YES ❌' : 'NO ✅'}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Is Direct URL:</span> <span className={`ml-2 font-medium ${dryRunResults.imageAnalysis.isDirectImageUrl ? 'text-green-600' : 'text-red-600'}`}>{dryRunResults.imageAnalysis.isDirectImageUrl ? 'YES ✅' : 'NO ❌'}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Is DALL-E:</span> <span className={`ml-2 font-medium ${dryRunResults.imageAnalysis.isDallEUrl ? 'text-green-600' : 'text-gray-500'}`}>{dryRunResults.imageAnalysis.isDallEUrl ? 'YES ✅' : 'NO'}</span></div>
                          </div>
                        </div>
                        
                        {/* Audio Analysis */}
                        <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">🎵</span>
                            <strong className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">Audio Analysis</strong>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">URL:</span> <span className="font-mono text-gray-700 dark:text-gray-300 break-all ml-2">{dryRunResults.audioAnalysis.finalUrl}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Is Clipped:</span> <span className={`ml-2 font-medium ${dryRunResults.audioAnalysis.isClipped ? 'text-green-600' : 'text-orange-600'}`}>{dryRunResults.audioAnalysis.isClipped ? 'YES ✅' : 'NO ⚠️'}</span></div>
                          </div>
                        </div>
                        
                        {/* Cost Analysis */}
                        <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">💰</span>
                            <strong className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">Cost Analysis</strong>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Estimated Cost:</span> <span className="text-gray-700 dark:text-gray-300 ml-2 font-medium">{dryRunResults.costAnalysis.estimatedCost}</span></div>
                            <div><span className="text-purple-600 dark:text-purple-400 font-medium">Status:</span> <span className="text-gray-700 dark:text-gray-300 ml-2">{dryRunResults.costAnalysis.costStatus}</span></div>
                          </div>
                        </div>
                        
                        {/* API Parameters */}
                        <div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">🔧</span>
                            <strong className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">API Parameters</strong>
                          </div>
                          <pre className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-3 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto border border-purple-100 dark:border-purple-800">
{JSON.stringify(dryRunResults.apiParams, null, 2)}
                          </pre>
                        </div>
                        
                        <div className="pt-3 border-t border-purple-200 dark:border-purple-700 text-center">
                          <button
                            onClick={() => setDryRunResults(null)}
                            className="px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white text-xs font-medium rounded-lg transition-all duration-200"
                          >
                            Clear Results
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCreditConfirmModal(false)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGenerateMelodyGram(isDryRunEnabled)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  disabled={(() => {
                    const costCredits = (() => {
                      if (songHistory && songHistory.length > 0) {
                        const currentSong = songHistory[currentSongIndex]
                        if (currentSong?.audioSelection) {
                          return getCreditsForLength(currentSong.audioSelection.duration)
                        }
                        return getCreditsForLength(currentSong?.targetDuration || songLength)
                      }
                      return getCreditsForLength(songLength)
                    })()
                    return creditSystemService.getUserCredits().balance < costCredits
                  })()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    (() => {
                      const costCredits = (() => {
                        if (songHistory && songHistory.length > 0) {
                          const currentSong = songHistory[currentSongIndex]
                          if (currentSong?.audioSelection) {
                            return getCreditsForLength(currentSong.audioSelection.duration)
                          }
                          return getCreditsForLength(currentSong?.targetDuration || songLength)
                        }
                        return getCreditsForLength(songLength)
                      })()
                      const hasEnoughCredits = creditSystemService.getUserCredits().balance >= costCredits
                      return hasEnoughCredits 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    })()
                  }`}
                >
                  {(() => {
                    const costCredits = (() => {
                      if (songHistory && songHistory.length > 0) {
                        const currentSong = songHistory[currentSongIndex]
                        if (currentSong?.audioSelection) {
                          return getCreditsForLength(currentSong.audioSelection.duration)
                        }
                        return getCreditsForLength(currentSong?.targetDuration || songLength)
                      }
                      return getCreditsForLength(songLength)
                    })()
                    const hasEnoughCredits = creditSystemService.getUserCredits().balance >= costCredits
                    if (!hasEnoughCredits) return 'Insufficient Credits'
                    return isDryRunEnabled ? '🧪 Dry Run MelodyGram' : 'Generate MelodyGram'
                  })()}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Debug Modal */}
      <DebugModal 
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
      />
    </div>
  )
} 