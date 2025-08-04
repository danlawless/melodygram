'use client'

import React, { useState, useEffect } from 'react'
import { Music, Loader2, Play, Pause, Volume2, Heart, Trash2 } from 'lucide-react'
import { murekaApiService } from '../../services/murekaApi'
import { songStorageService } from '../../services/songStorage'
import { getCreditsForLength } from '../../services/creditSystem'

// Helper function for duration instructions
const createDurationInstruction = (seconds: number): string => {
  if (seconds <= 15) {
    return `IMPORTANT: Generate a VERY SHORT song of exactly ${seconds} seconds. Keep it minimal - just a quick hook or chorus. Start vocals immediately (within 1-2 seconds) and END the song promptly after the lyrics finish with minimal instrumental outro.`
  } else if (seconds <= 30) {
    return `IMPORTANT: Generate a SHORT song of exactly ${seconds} seconds. Brief verse and chorus only. Start vocals immediately (within 1-2 seconds) and WRAP UP quickly after the lyrics are done - no extended instrumental sections.`
  } else if (seconds <= 60) {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (1 minute). Standard verse-chorus structure. Start vocals quickly and conclude promptly after lyrics finish - minimize instrumental padding.`
  } else if (seconds <= 120) {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (2 minutes). Full structure with verse, chorus, second verse, chorus. Keep tight timing - start and end efficiently around the lyrics.`
  } else {
    return `IMPORTANT: Generate a song of exactly ${seconds} seconds (${Math.floor(seconds/60)} minutes). Extended structure with multiple verses, choruses, and bridge. Maintain target duration by balancing intro/outro with vocal content.`
  }
}

interface SongGenerationProps {
  lyrics: string
  songTitle: string
  selectedVocal: string
  songLength: number
  onSongGenerated?: (audioUrl: string) => void
  onGenerationStateChange?: (isGenerating: boolean) => void
  onGenerationInfoChange?: (generationNumber: number, totalCount: number) => void
  onLyricsChange?: (lyrics: string) => void
  onTitleChange?: (title: string) => void
  onSongLengthChange?: (songLength: number) => void
  onVocalChange?: (vocal: string) => void
  showValidation?: boolean
  onHistoryUpdate?: (history: GeneratedSong[], currentIndex: number) => void
}

interface GeneratedSong {
  audioUrl: string
  createdAt: string
  targetDuration: number
  actualDuration?: number
  isPlaying?: boolean
  // Store the lyrics and title used to generate this song
  lyrics: string
  title: string
  // New fields for track management
  favorite?: boolean
  id?: string
  // Generation settings to restore
  songLength: number
  selectedVocal: string
}

export default function SongGeneration({ 
  lyrics, 
  songTitle, 
  selectedVocal, 
  songLength,
  onSongGenerated,
  onGenerationStateChange,
  onGenerationInfoChange,
  onLyricsChange,
  onTitleChange,
  onSongLengthChange,
  onVocalChange,
  showValidation = false,
  onHistoryUpdate
}: SongGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<GeneratedSong[]>([])
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Session storage for generated songs
  const SESSION_KEY = 'melodygram_generated_songs'

  // Load generated songs from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSongs = localStorage.getItem(SESSION_KEY)
        if (savedSongs) {
          const songs = JSON.parse(savedSongs) as GeneratedSong[]
          // Add backward compatibility for existing songs without new fields
          const updatedSongs = songs.map((song, index) => ({
            ...song,
            id: song.id || `legacy_${Date.now()}_${index}`,
            favorite: song.favorite || false,
            // Default settings for legacy songs
            songLength: song.songLength || songLength, // Use current setting as fallback
            selectedVocal: song.selectedVocal || selectedVocal // Use current setting as fallback
          }))
          setGenerationHistory(updatedSongs)
          
          // Notify parent component about initial history
          if (onHistoryUpdate && updatedSongs.length > 0) {
            onHistoryUpdate(updatedSongs, 0) // Most recent song is at index 0
          }
          
          if (updatedSongs.length > 0) {
            const mostRecentSong = updatedSongs[0]
            setGeneratedSong(mostRecentSong)
            setDuration(mostRecentSong.targetDuration)
            
            // Restore all settings from the most recent generation
            if (onLyricsChange && mostRecentSong.lyrics) {
              onLyricsChange(mostRecentSong.lyrics)
            }
            if (onTitleChange && mostRecentSong.title) {
              onTitleChange(mostRecentSong.title)
            }
            if (onSongLengthChange && mostRecentSong.songLength) {
              onSongLengthChange(mostRecentSong.songLength)
            }
            if (onVocalChange && mostRecentSong.selectedVocal) {
              onVocalChange(mostRecentSong.selectedVocal)
            }
            
            // Notify parent about current generation (most recent is #1)
            if (onGenerationInfoChange) {
              onGenerationInfoChange(1, updatedSongs.length)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load generated songs:', error)
      }
    }
  }, [])

  const saveToSession = (songs: GeneratedSong[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(songs))
      } catch (error) {
        console.error('Failed to save generated songs:', error)
      }
    }
  }

  // Delete a specific track from history
  const handleDeleteTrack = (trackId: string) => {
    const updatedHistory = generationHistory.filter(song => song.id !== trackId)
    setGenerationHistory(updatedHistory)
    saveToSession(updatedHistory)
    
    // If we deleted the currently playing song, switch to the most recent
    if (generatedSong?.id === trackId && updatedHistory.length > 0) {
      const newCurrentSong = updatedHistory[0]
      setGeneratedSong(newCurrentSong)
      setDuration(newCurrentSong.targetDuration)
      setIsPlaying(false)
      setCurrentTime(0)
      
      // Clean up old audio element
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
        setAudioElement(null)
      }
    } else if (generatedSong?.id === trackId && updatedHistory.length === 0) {
      // No tracks left
      setGeneratedSong(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
        setAudioElement(null)
      }
    }
    
    // Notify parent about updated generation info
    if (onGenerationInfoChange) {
      const currentIndex = updatedHistory.findIndex(song => song.id === generatedSong?.id)
      onGenerationInfoChange(currentIndex + 1, updatedHistory.length)
    }
  }

  // Toggle favorite status of a track
  const handleToggleFavorite = (trackId: string) => {
    const updatedHistory = generationHistory.map(song => 
      song.id === trackId ? { ...song, favorite: !song.favorite } : song
    )
    setGenerationHistory(updatedHistory)
    saveToSession(updatedHistory)
    
    // Update current song if it's the one being favorited
    if (generatedSong?.id === trackId) {
      setGeneratedSong(prev => prev ? { ...prev, favorite: !prev.favorite } : null)
    }
  }

  // Check if form is valid for song generation
  const isFormValid = (): boolean => {
    return (
      lyrics.trim() !== '' &&
      songTitle.trim() !== '' &&
      selectedVocal !== '' &&
      songLength > 0
    )
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGenerateSong = async () => {
    if (!isFormValid()) {
      setGenerationError('Please fill in all required fields')
      return
    }

    // =============== COMPREHENSIVE GENERATE BUTTON LOGGING ===============
    const generateContext = {
      timestamp: new Date().toISOString(),
      buttonType: 'SONG_GENERATION',
      user: {
        sessionId: Date.now(), // Simple session identifier
      },
      inputData: {
        songTitle: songTitle,
        lyrics: lyrics,
        selectedVocal: selectedVocal,
        songLength: songLength,
        originalLyricsLength: lyrics.length,
        lyricsWordCount: lyrics.trim().split(/\s+/).length
      },
      formValidation: {
        isFormValid: isFormValid(),
        hasLyrics: lyrics.trim().length > 0,
        hasSongTitle: songTitle.trim().length > 0,
        hasValidSongLength: songLength > 0,
        hasValidVocal: !!selectedVocal
      },
      previousGeneration: {
        hasExistingGeneration: !!generatedSong,
        currentGenerationNumber: generationHistory.length + 1,
        totalPreviousGenerations: generationHistory.length
      },
      systemContext: {
        component: 'SongGeneration',
        handler: 'handleGenerateSong',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }

    console.log('🎵 =================== SONG GENERATE BUTTON CLICKED ===================')
    console.log('🎵 FULL CONTEXT:', JSON.stringify(generateContext, null, 2))
    console.log('🎵 =====================================================================')
    // =========================================================================

    try {
      setIsGenerating(true)
      setGenerationError(null)
      setGenerationStatus('Starting song generation...')
      
      if (onGenerationStateChange) {
        onGenerationStateChange(true)
      }

      // Clean lyrics for short songs - remove [brackets] which are just instructions
      let cleanedLyrics = lyrics
      if (songLength <= 30) {
        cleanedLyrics = lyrics.replace(/\[.*?\]/g, '').trim()
        console.log('🎵 Removed brackets from lyrics for short song:', cleanedLyrics.length, 'chars vs', lyrics.length, 'original')
      }

      // Create prompt based on song length
      let prompt: string
      
      if (lyrics.trim()) {
        const durationInstruction = createDurationInstruction(songLength)
        
        // For short songs, emphasize getting straight to vocals AND wrapping up quickly
        const vocalStartInstruction = songLength <= 30 
          ? '. IMPORTANT: Start vocals immediately with minimal or no instrumental intro. Jump straight into singing the lyrics within the first 1-2 seconds. CRITICAL: End the song promptly after the lyrics finish - no extended instrumental outro or fade. Maximize vocal content, minimize instrumental sections at both start AND end. NOTE: Any structural markers like [Verse] or [Chorus] have been removed from the lyrics to keep them clean and flowing.'
          : ''
        
        prompt = `${durationInstruction}. Style: pop, ${selectedVocal === 'male' ? 'confident male vocal' : 'happy female vocal'}. Use ONLY the provided lyrics, do not add extra content${vocalStartInstruction}`
        console.log(`🎵 Created prompt with ${songLength}s duration instructions${songLength <= 30 ? ' + quick start/end + clean lyrics' : ''}`)
      }
      
      console.log('🎵 Generating song with Mureka...')
      console.log('🎵 Original Lyrics:', lyrics)
      console.log('🎵 Cleaned Lyrics:', cleanedLyrics)
      console.log('🎵 Generated Prompt:', prompt)
      
      const murekaParams = {
        lyrics: cleanedLyrics,
        prompt: prompt,
        model: 'mureka-7'
      }
      
      console.log('🎵 =================== MUREKA API CALL PARAMS ===================')
      console.log('🎵 PARAMETERS SENT TO MUREKA:', JSON.stringify(murekaParams, null, 2))
      console.log('🎵 =============================================================')
      
      const response = await murekaApiService.generateSong(murekaParams)
      
      console.log('🎵 =================== MUREKA API RESPONSE ===================')
      console.log('🎵 RESPONSE FROM MUREKA:', JSON.stringify(response, null, 2))
      console.log('🎵 ===========================================================')
      console.log('🎵 Song generation response:', response)
      
      // Poll for completion
      const maxAttempts = 60 // 5 minutes max wait
      const pollInterval = 5000 // 5 seconds
      let attempts = 0
      let consecutiveFailures = 0
      const maxFailures = 10
      let songCompleted = false
      let audioUrl: string | null = null
      
      setGenerationStatus('Song generation in progress...')
      
      while (attempts < maxAttempts && !songCompleted) {
        attempts++
        console.log(`🔄 Checking song status (attempt ${attempts}/${maxAttempts})...`)
        
        try {
                     const statusResponse = await murekaApiService.querySongTask(response.id)
          console.log('🔄 Song status:', statusResponse.status)
          console.log('🔍 Full status response:', statusResponse)
          
          setGenerationStatus(`Generating song...`)
          
          if (statusResponse.status === 'succeeded') {
            songCompleted = true
            
            // Check multiple possible fields for audio URL
            audioUrl = statusResponse.audio_url || 
                      statusResponse.songUrl || 
                      statusResponse.choices?.[0]?.url ||
                      statusResponse.data?.audio_url ||
                      statusResponse.data?.songUrl ||
                      statusResponse.url
            
            if (audioUrl) {
              console.log('✅ Song generation completed:', audioUrl)
            } else {
              console.error('❌ No audio URL found in success response:', statusResponse)
              throw new Error('Song generated but no audio URL was provided')
            }
          } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
            throw new Error(`Song generation failed: ${statusResponse.message || statusResponse.error || 'Unknown error'}`)
          }
        } catch (error) {
          consecutiveFailures++
          console.warn(`⚠️ Song status check failed (${consecutiveFailures}/${maxFailures}):`, error)
          setGenerationStatus(`Checking status... (attempt ${consecutiveFailures}/${maxFailures})`)
          
          if (consecutiveFailures >= maxFailures) {
            throw new Error(`Song generation failed after ${maxFailures} attempts. Please try again.`)
          }
        }
        
        if (!songCompleted) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      }
      
      if (!songCompleted) {
        throw new Error('Song generation timed out. Please try again.')
      }

      if (audioUrl) {
        // Clean up old audio element when new song is generated
        if (audioElement) {
          audioElement.pause()
          audioElement.currentTime = 0
          setAudioElement(null)
        }
        
        // Reset audio state
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(songLength) // Use target duration
        
        const newSong: GeneratedSong = {
          audioUrl,
          createdAt: new Date().toISOString(),
          targetDuration: songLength,
          lyrics: cleanedLyrics,
          title: songTitle,
          id: `generation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          favorite: false,
          // Store generation settings for restoration
          songLength: songLength,
          selectedVocal: selectedVocal
        }
        
        setGeneratedSong(newSong)
        
        // Keep favorites and limit non-favorites to total of 10
        const favorites = generationHistory.filter(song => song.favorite)
        const nonFavorites = generationHistory.filter(song => !song.favorite)
        const remainingSlots = Math.max(0, 10 - favorites.length - 1) // -1 for new song
        const keptNonFavorites = nonFavorites.slice(0, remainingSlots)
        
        const updatedHistory = [newSong, ...favorites, ...keptNonFavorites]
        setGenerationHistory(updatedHistory)
        saveToSession(updatedHistory)
        
        // Notify parent component about history update
        if (onHistoryUpdate) {
          onHistoryUpdate(updatedHistory, 0) // New song is always at index 0
        }
        
        // Notify parent component about new generation
        if (onSongGenerated) {
          onSongGenerated(audioUrl)
        }
        
        // Notify parent about generation info (new song is generation #1)
        if (onGenerationInfoChange) {
          onGenerationInfoChange(1, updatedHistory.length)
        }
        
        setGenerationStatus('')
        console.log('✅ Song generation completed successfully!')
        console.log('🎵 New song URL:', audioUrl?.substring(0, 50) + '...')
        
      } else {
        throw new Error('No audio URL received from song generation')
      }
    } catch (error) {
      console.error('Song generation failed:', error)
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate song')
      setGenerationStatus('')
    } finally {
      setIsGenerating(false)
      if (onGenerationStateChange) {
        onGenerationStateChange(false)
      }
    }
  }

  const handlePlayPause = async () => {
    if (!generatedSong) return

    try {
      if (audioElement && !audioElement.paused) {
        // Pause current audio
        audioElement.pause()
        audioElement.volume = 1.0 // Reset volume when manually paused
        setIsPlaying(false)
        console.log('🎵 Audio paused')
      } else {
        // Play or resume audio
        let audio = audioElement

        if (!audio) {
          // Create new audio element
          console.log('🎵 Creating new audio element:', generatedSong.audioUrl?.substring(0, 50) + '...')
          audio = new Audio(generatedSong.audioUrl)
          
          audio.addEventListener('ended', () => {
            audio.currentTime = 0 // Reset to beginning for replay
            audio.volume = 1.0 // Reset volume when ended
            setIsPlaying(false)
            setCurrentTime(0)
            console.log('🎵 Audio playback ended, ready for replay')
          })

          audio.addEventListener('error', (e) => {
            console.error('🎵 Audio playback error:', e)
            setIsPlaying(false)
          })

          audio.addEventListener('loadstart', () => {
            console.log('🎵 Audio loading started')
          })

          audio.addEventListener('canplay', () => {
            console.log('🎵 Audio can play')
          })

          audio.addEventListener('loadedmetadata', () => {
            console.log('🎵 Audio metadata loaded, actual duration:', audio.duration)
            // Keep using target duration for display and credits
            setDuration(generatedSong.targetDuration)
          })

          audio.addEventListener('timeupdate', () => {
            const currentTime = audio.currentTime
            const targetDuration = generatedSong.targetDuration
            const fadeInDuration = 0.5 // 0.5 seconds fade-in
            const fadeOutDuration = 0.5 // 0.5 seconds fade-out
            const fadeOutStartTime = targetDuration - fadeOutDuration
            
            // Smooth fade-in during the first 0.5 seconds
            if (currentTime <= fadeInDuration) {
              const fadeProgress = currentTime / fadeInDuration
              const volume = Math.min(1, fadeProgress) // Fade from 0 to 1
              audio.volume = volume
            }
            // Smooth fade-out in the last 0.5 seconds  
            else if (currentTime >= fadeOutStartTime && currentTime < targetDuration) {
              const fadeProgress = (currentTime - fadeOutStartTime) / fadeOutDuration
              const volume = Math.max(0, 1 - fadeProgress) // Fade from 1 to 0
              audio.volume = volume
            }
            // Full volume in the middle section
            else if (currentTime > fadeInDuration && currentTime < fadeOutStartTime) {
              audio.volume = 1.0
            }
            
            // Auto-pause when reaching target duration
            if (currentTime >= targetDuration) {
              audio.pause()
              audio.currentTime = 0 // Reset to beginning for replay
              audio.volume = 1.0 // Reset volume for next play
              setIsPlaying(false)
              setCurrentTime(0) // Show 0:00 on UI
              console.log('🎵 Auto-paused at target duration with fade-in/out, ready for replay:', targetDuration + 's')
            } else {
              setCurrentTime(currentTime)
            }
          })
          
          setAudioElement(audio)
        }

        // If we're at or near the end, reset to beginning for replay
        if (audio.currentTime >= generatedSong.targetDuration - 0.1) {
          audio.currentTime = 0
          setCurrentTime(0)
          console.log('🎵 Resetting to beginning for replay')
        }
        
        audio.volume = 0.0 // Start at 0 volume for smooth fade-in
        await audio.play()
        setIsPlaying(true)
        console.log('🎵 Audio playback started with fade-in for:', generatedSong.audioUrl?.substring(0, 50) + '...')
      }
    } catch (error) {
      console.error('🎵 Audio playback error:', error)
      setIsPlaying(false)
    }
  }

  const handleSelectPreviousSong = (song: GeneratedSong) => {
    // Stop and completely reset current audio
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      setAudioElement(null)
    }
    
    // Reset all audio state
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(song.targetDuration)
    
    // Set new song
    setGeneratedSong(song)
    if (onSongGenerated) {
      onSongGenerated(song.audioUrl)
    }
    
    // Update all settings to match the selected generation
    if (onLyricsChange && song.lyrics) {
      onLyricsChange(song.lyrics)
    }
    if (onTitleChange && song.title) {
      onTitleChange(song.title)
    }
    if (onSongLengthChange && song.songLength) {
      onSongLengthChange(song.songLength)
    }
    if (onVocalChange && song.selectedVocal) {
      onVocalChange(song.selectedVocal)
    }
    
    // Calculate and notify generation number
    const generationNumber = generationHistory.length - generationHistory.findIndex(s => s.audioUrl === song.audioUrl)
    if (onGenerationInfoChange) {
      onGenerationInfoChange(generationNumber, generationHistory.length)
    }
    
    console.log('🔄 Switched to generation:', generationNumber, 'with lyrics:', song.lyrics?.substring(0, 50) + '...', 'title:', song.title)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElement || !duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickPercent = clickX / rect.width
    const newTime = Math.min(clickPercent * duration, generatedSong?.targetDuration || duration)
    
    audioElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="space-y-6">
      {/* Generate Song Button */}
      <div className="space-y-4">
        <button
          onClick={handleGenerateSong}
          disabled={isGenerating || !isFormValid()}
          className={`w-full h-12 rounded-xl flex items-center justify-center space-x-3 text-white font-medium transition-all ${
            isGenerating
              ? 'bg-gray-600 cursor-not-allowed'
              : isFormValid()
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] shadow-lg'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{generationStatus || 'Generating...'}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Music className="w-5 h-5" />
              <span>{generatedSong ? 'Regenerate Song' : 'Generate Song'}</span>
            </div>
          )}
        </button>

        {!isFormValid() && !isGenerating && (
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {selectedVocal === '' && "Choose Voice Style • "}
              {songLength <= 0 && "Select Song Length • "}
              {lyrics.trim() === '' && "Add Lyrics • "}
              {songTitle.trim() === '' && "Add Song Title"}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {generationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{generationError}</p>
        </div>
      )}

      {/* Generated Song Player */}
      {generatedSong && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                {/* Song Title - First Line */}
                <h3 className="font-medium text-white mb-1">
                  {generatedSong.title || 'Untitled'}
                </h3>
                
                {/* Generation Info - Second Line */}
                <p className="text-sm text-green-400 mb-1">
                  ✅ Generation {generationHistory.length - generationHistory.findIndex(song => song.audioUrl === generatedSong.audioUrl)} {isPlaying ? '• Playing' : '• Ready'}
                </p>
                
                {/* Timestamp - Third Line */}
                <p className="text-sm text-gray-400">
                  {new Date(generatedSong.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-green-500/20 hover:bg-green-500/30 rounded-full flex items-center justify-center transition-colors border border-green-500/30 flex-shrink-0"
              title={isPlaying ? 'Pause' : (currentTime === 0 && !isPlaying ? 'Play' : 'Replay')}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-green-400" />
              ) : (
                <Play className="w-6 h-6 text-green-400" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div 
              className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-200"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatDuration(currentTime)}</span>
              <span>{duration > 0 ? formatDuration(duration) : '--:--'}</span>
            </div>
          </div>
        </div>
      )}

      {/* All Generations */}
      {generationHistory.length > 1 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">All Generations</h4>
            <p className="text-xs text-gray-500">{generationHistory.length} versions</p>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {generationHistory.map((song, index) => {
              const isCurrentSong = generatedSong?.audioUrl === song.audioUrl
              const generationNumber = generationHistory.length - index
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isCurrentSong 
                      ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  onClick={() => {
                    if (!isCurrentSong) {
                      handleSelectPreviousSong(song)
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {/* Generation Icon - Click to Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // Prevent row click
                        handleToggleFavorite(song.id!)
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-105 ${
                        song.favorite
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30'
                          : isCurrentSong 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-pink-500/20 hover:border-pink-500/30'
                            : 'bg-white/10 text-gray-400 border border-gray-500/30 hover:bg-pink-500/20 hover:border-pink-500/30'
                      }`}
                      title={song.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {song.favorite ? (
                        <Heart className="w-4 h-4 fill-current" />
                      ) : (
                        generationNumber
                      )}
                    </button>
                    
                    {/* Generation Info */}
                    <div className="flex-1 min-w-0">
                      {/* Song Title - First Line */}
                      <p className={`text-sm font-medium mb-1 ${
                        isCurrentSong ? 'text-white' : 'text-white'
                      }`}>
                        {song.title || 'Untitled'}
                      </p>
                      
                      {/* Generation Info - Second Line */}
                      <p className={`text-xs mb-1 ${
                        isCurrentSong ? 'text-green-400' : 'text-gray-300'
                      }`}>
                        ✅ Generation {generationNumber}
                        {isCurrentSong && <span className="ml-1">• Active</span>}
                      </p>
                      
                      {/* Details - Third Line */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(song.createdAt).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-400">
                            {song.targetDuration}s
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-purple-400">
                            {getCreditsForLength(song.targetDuration)} credits
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent row click
                          handleDeleteTrack(song.id!)
                        }}
                        className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors border border-red-500/30"
                        title="Delete this generation"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      
                      {/* Play/Pause Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent row click
                          if (!isCurrentSong) {
                            handleSelectPreviousSong(song)
                          }
                          // Small delay to ensure song is set before playing
                          setTimeout(() => handlePlayPause(), 100)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                          isCurrentSong && isPlaying
                            ? 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
                            : 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
                        } border`}
                        title={isCurrentSong && isPlaying ? 'Pause' : 'Play'}
                      >
                        {isCurrentSong && isPlaying ? (
                          <Pause className="w-4 h-4 text-red-400" />
                        ) : (
                          <Play className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


    </div>
  )
} 