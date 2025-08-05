'use client'

import React, { useState, useEffect } from 'react'
import { Music, Loader2, Play, Pause, Volume2, Heart, Trash2, Check, Download } from 'lucide-react'
import { murekaApiService } from '../../services/murekaApi'
import { songStorageService, type AudioSelection } from '../../services/songStorage'
import { getCreditsForLength } from '../../services/creditSystem'

// Helper function to create clipped audio from a selection (Browser + Upload)
export const createClippedAudio = async (audioUrl: string, selection: AudioSelection): Promise<string | null> => {
  try {
    console.log('🔀 Creating clipped audio from:', audioUrl.substring(0, 50) + '...')
    console.log('🔀 Selection:', selection)
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Use our audio proxy to bypass CORS
    const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(audioUrl)}`
    console.log('🔀 Using audio proxy:', proxyUrl)
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio via proxy: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.floor(selection.startTime * sampleRate)
    const endSample = Math.floor(selection.endTime * sampleRate)
    const length = endSample - startSample
    
    // Create new buffer with selected segment
    const newBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      length,
      sampleRate
    )
    
    // Copy selected segment to new buffer
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel)
      const outputData = newBuffer.getChannelData(channel)
      
      for (let i = 0; i < length; i++) {
        outputData[i] = inputData[startSample + i] || 0
      }
    }
    
    // Convert buffer to MP3 blob (fallback to WAV if MP3 fails)
    let audioBlob: Blob
    let fileExtension: string
    
    try {
      audioBlob = await audioBufferToMp3Blob(newBuffer)
      fileExtension = 'mp3'
      console.log('✅ Created MP3 audio blob')
    } catch (mp3Error) {
      console.warn('⚠️ MP3 conversion failed, falling back to WAV:', mp3Error)
      audioBlob = await audioBufferToWavBlob(newBuffer)
      fileExtension = 'wav'
      console.log('✅ Created WAV audio blob as fallback')
    }
    
    audioContext.close()
    
    console.log(`✅ Created ${fileExtension.toUpperCase()} audio blob (${audioBlob.size} bytes), uploading to get public URL...`)
    console.log('🎵 Clipped buffer details:', {
      duration: length / audioBuffer.sampleRate,
      samples: length,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    })
    
    // Upload blob to get public URL that LemonSlice can access
    const formData = new FormData()
    formData.append('audio', audioBlob, `clipped.${fileExtension}`)
    
    const uploadResponse = await fetch('/api/upload-audio-blob', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`)
    }
    
    const uploadData = await uploadResponse.json()
    
    if (!uploadData.success) {
      throw new Error(`Upload failed: ${uploadData.error}`)
    }
    
    console.log('✅ Successfully uploaded clipped audio:', uploadData.url)
    console.log('🎵 Clipped duration:', selection.duration, 'seconds')
    
    return uploadData.url
    
  } catch (error) {
    console.error('❌ Error creating clipped audio:', error)
    return null
  }
}

// Helper function to convert AudioBuffer to MP3 Blob using lamejs
export const audioBufferToMp3Blob = async (buffer: AudioBuffer): Promise<Blob> => {
  // Dynamically import lamejs to avoid SSR issues
  const lamejs = await import('lamejs') as any
  
  const sampleRate = buffer.sampleRate
  const numberOfChannels = buffer.numberOfChannels
  const length = buffer.length
  
  // Convert AudioBuffer to 16-bit PCM
  const leftChannel = buffer.getChannelData(0)
  const rightChannel = numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel
  
  const left16 = new Int16Array(length)
  const right16 = new Int16Array(length)
  
  for (let i = 0; i < length; i++) {
    left16[i] = Math.max(-32768, Math.min(32767, leftChannel[i] * 32767))
    right16[i] = Math.max(-32768, Math.min(32767, rightChannel[i] * 32767))
  }
  
  // Initialize MP3 encoder
  console.log('🎵 Initializing MP3 encoder:', { numberOfChannels, sampleRate, length })
  const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, 128) // 128 kbps
  
  const mp3Data = []
  const blockSize = 1152 // MP3 frame size
  
  // Encode in blocks
  for (let i = 0; i < length; i += blockSize) {
    const leftChunk = left16.subarray(i, i + blockSize)
    const rightChunk = numberOfChannels > 1 ? right16.subarray(i, i + blockSize) : leftChunk
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }
  }
  
  // Finalize encoding
  const finalBuffer = mp3encoder.flush()
  if (finalBuffer.length > 0) {
    mp3Data.push(finalBuffer)
  }
  
  const totalBytes = mp3Data.reduce((total, chunk) => total + chunk.length, 0)
  console.log('🎵 Successfully encoded MP3 audio:', { totalBytes, chunks: mp3Data.length })
  return new Blob(mp3Data, { type: 'audio/mpeg' })
}

// Keep WAV function for backwards compatibility
export const audioBufferToWavBlob = (buffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve) => {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bytesPerSample = 2

    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample)
    const view = new DataView(arrayBuffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    // WAV header
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true)
    view.setUint16(32, numberOfChannels * bytesPerSample, true)
    view.setUint16(34, 8 * bytesPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }

    resolve(new Blob([arrayBuffer], { type: 'audio/wav' }))
  })
}

// Helper function for duration instructions
const createDurationInstruction = (seconds: number): string => {
  if (seconds <= 15) {
    return `IMPORTANT: Try to generate a song close to ${seconds} seconds. Keep it minimal - focus on a quick hook or chorus. Start vocals immediately (within 1-2 seconds) and END the song promptly after the lyrics finish with minimal instrumental outro.`
  } else if (seconds <= 30) {
    return `IMPORTANT: Try to generate a song close to ${seconds} seconds. Brief verse and chorus only. Start vocals immediately (within 1-2 seconds) and WRAP UP quickly after the lyrics are done - no extended instrumental sections.`
  } else if (seconds <= 60) {
    return `IMPORTANT: Try to generate a song close to ${seconds} seconds (1 minute). Standard verse-chorus structure. Start vocals quickly and conclude promptly after lyrics finish - minimize instrumental padding.`
  } else if (seconds <= 120) {
    return `IMPORTANT: Try to generate a song close to ${seconds} seconds (2 minutes). Full structure with verse, chorus, second verse, chorus. Keep tight timing - start and end efficiently around the lyrics.`
  } else {
    return `IMPORTANT: Try to generate a song close to ${seconds} seconds (${Math.floor(seconds/60)} minutes). Extended structure with multiple verses, choruses, and bridge sections. Aim for target duration while allowing natural musical flow.`
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
  activeAudioUrl?: string // URL of the song that should be highlighted as active
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
  // Audio selection fields
  fullAudioUrl?: string
  selectedAudioUrl?: string
  audioSelection?: AudioSelection
  originalDuration?: number
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
  onHistoryUpdate,
  activeAudioUrl
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
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playback' | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false)

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
          const updatedSongs = songs.map((song, index) => {
            // Create default audio selection for legacy songs
            const defaultDuration = song.actualDuration || song.targetDuration || 30
            const defaultSelection = song.audioSelection || {
              startTime: 0,
              endTime: Math.min(song.targetDuration || 30, defaultDuration),
              duration: Math.min(song.targetDuration || 30, defaultDuration)
            }
            
            return {
            ...song,
            id: song.id || `legacy_${Date.now()}_${index}`,
            favorite: song.favorite || false,
            // Default settings for legacy songs
            songLength: song.songLength || songLength, // Use current setting as fallback
              selectedVocal: song.selectedVocal || selectedVocal, // Use current setting as fallback
              // Audio selection fields
              fullAudioUrl: song.fullAudioUrl || song.audioUrl,
              originalDuration: song.originalDuration || defaultDuration,
              audioSelection: defaultSelection
            }
          })
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

  // Sync active song when parent navigates using arrows
  useEffect(() => {
    if (activeAudioUrl && generationHistory.length > 0) {
      const targetSong = generationHistory.find(song => song.audioUrl === activeAudioUrl)
      if (targetSong && generatedSong?.audioUrl !== activeAudioUrl) {
        setGeneratedSong(targetSong)
        setDuration(targetSong.targetDuration)
        
        // Reset audio state when switching songs externally
        setIsPlaying(false)
        setCurrentTime(0)
        if (audioElement) {
          audioElement.pause()
          audioElement.currentTime = 0
          setAudioElement(null)
        }
      }
    }
  }, [activeAudioUrl, generationHistory, generatedSong?.audioUrl, audioElement])

  const saveToSession = (songs: GeneratedSong[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(songs))
      } catch (error) {
        console.error('Failed to save generated songs:', error)
      }
    }
  }

  // Handle the first click - add to pending deletes or confirm deletion
  const handleDeleteClick = (trackId: string) => {
    if (pendingDeletes.has(trackId)) {
      // Second click - confirm deletion
      handleDeleteTrack(trackId)
    } else {
      // First click - add to pending deletes
      setPendingDeletes(prev => new Set(prev).add(trackId))
      
      // Auto-remove from pending after 5 seconds if not confirmed
      setTimeout(() => {
        setPendingDeletes(prev => {
          const newSet = new Set(prev)
          newSet.delete(trackId)
          return newSet
        })
      }, 5000)
    }
  }

  // Delete a specific track from history
  const handleDeleteTrack = (trackId: string) => {
    // Remove from pending deletes
    setPendingDeletes(prev => {
      const newSet = new Set(prev)
      newSet.delete(trackId)
      return newSet
    })
    
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
        
        // Get actual audio duration
        let actualDuration = songLength
        try {
          const audio = new Audio(audioUrl)
          await new Promise((resolve, reject) => {
            audio.addEventListener('loadedmetadata', () => {
              actualDuration = audio.duration
              resolve(actualDuration)
            })
            audio.addEventListener('error', reject)
          })
        } catch (error) {
          console.warn('Could not get actual audio duration, using target duration:', error)
        }

                  // Default selection to the target duration from the start
        const defaultSelection: AudioSelection = {
          startTime: 0,
          endTime: Math.min(songLength, actualDuration),
          duration: Math.min(songLength, actualDuration)
        }
        
        const newSong: GeneratedSong = {
          audioUrl,
          createdAt: new Date().toISOString(),
          // Use the selected duration for credits, not the full generated duration
          targetDuration: defaultSelection.duration,
          actualDuration: defaultSelection.duration,
          lyrics: cleanedLyrics,
          title: songTitle,
          id: `generation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          favorite: false,
          // Store generation settings for restoration
          songLength: songLength,
          selectedVocal: selectedVocal,
          // Audio selection fields
          fullAudioUrl: audioUrl,
          originalDuration: actualDuration,
          audioSelection: defaultSelection
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
        console.log('🎵 Actual duration:', actualDuration, 'vs target:', songLength)
        console.log('🎵 Default selection:', defaultSelection)
        
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
            setIsPlaying(false)
            setCurrentTime(0)
            console.log('🎵 Audio playback ended')
          })

          audio.addEventListener('error', (e) => {
            console.error('🎵 Audio playback error:', e)
            setIsPlaying(false)
          })

          audio.addEventListener('loadedmetadata', () => {
            console.log('🎵 Audio metadata loaded, duration:', audio.duration)
            setDuration(generatedSong.actualDuration || audio.duration)
          })

          audio.addEventListener('timeupdate', () => {
            const currentTime = audio.currentTime
            const selection = generatedSong.audioSelection
            
            // If we have an audio selection, handle playback within the selection
            if (selection) {
              // Auto-pause when reaching end of selection
              if (currentTime >= selection.endTime) {
              audio.pause()
                audio.currentTime = selection.startTime // Reset to selection start
              setIsPlaying(false)
                setCurrentTime(selection.startTime)
                console.log('🎵 Auto-paused at selection end, reset to selection start')
              } else {
                setCurrentTime(currentTime)
              }
            } else {
              setCurrentTime(currentTime)
            }
          })
          
          setAudioElement(audio)
        }

        // If we have an audio selection, start from selection start
        const selection = generatedSong.audioSelection
        if (selection) {
          // Always start from selection start when playing
          audio.currentTime = selection.startTime
          setCurrentTime(selection.startTime)
          console.log('🎵 Starting playback from selection start:', selection.startTime)
        }
        
        await audio.play()
        setIsPlaying(true)
        console.log('🎵 Audio playback started')
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
    
    // Reset audio state to selection start (or 0 if no selection)
    const startTime = song.audioSelection?.startTime || 0
    setIsPlaying(false)
    setCurrentTime(startTime)
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
    
    // Find the index of the selected song and update parent navigation state
    const selectedIndex = generationHistory.findIndex(s => s.audioUrl === song.audioUrl)
    if (onHistoryUpdate && selectedIndex !== -1) {
      onHistoryUpdate(generationHistory, selectedIndex)
    }
    
    // Calculate and notify generation number
    const generationNumber = generationHistory.length - generationHistory.findIndex(s => s.audioUrl === song.audioUrl)
    if (onGenerationInfoChange) {
      onGenerationInfoChange(generationNumber, generationHistory.length)
    }
    
    console.log('🔄 Switched to generation:', generationNumber, 'with lyrics:', song.lyrics?.substring(0, 50) + '...', 'title:', song.title)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElement || !duration || !generatedSong) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickPercent = clickX / rect.width
    
    const selection = generatedSong.audioSelection
    let newTime: number
    
    if (selection) {
      // Map click to within the selected segment
      newTime = selection.startTime + (clickPercent * selection.duration)
      newTime = Math.max(selection.startTime, Math.min(newTime, selection.endTime))
    } else {
      // No selection, use full duration
      newTime = Math.min(clickPercent * duration, duration)
    }
    
    audioElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Audio selection handlers for inline editing (preview only - actual clipping happens at MelodyGram generation)
  const updateAudioSelection = (selection: AudioSelection) => {
    if (!generatedSong) return

    try {
      // Round duration to whole seconds
      const roundedDuration = Math.round(selection.duration)
      const roundedSelection = {
        ...selection,
        duration: roundedDuration
      }
      
      // Calculate credits for the new selection duration
      const newCredits = getCreditsForLength(roundedDuration)
      const originalCredits = getCreditsForLength(generatedSong.targetDuration)
      
      // Reset playback position to start of selection
      setCurrentTime(roundedSelection.startTime)
      if (audioElement) {
        audioElement.currentTime = roundedSelection.startTime
        setIsPlaying(false) // Pause if playing to avoid confusion
      }
      
      // Update the song with selection data (auto-save) - this is just for preview
      const updatedSong: GeneratedSong = {
        ...generatedSong,
        audioSelection: roundedSelection,
        actualDuration: roundedDuration,
        // Update targetDuration to match selection for credit calculation
        targetDuration: roundedDuration
        // Keep original audioUrl - clipping will happen at MelodyGram generation
      }

      // Update in current song and history
      setGeneratedSong(updatedSong)
      
      const updatedHistory = generationHistory.map(song => 
        song.id === generatedSong.id ? updatedSong : song
      )
      setGenerationHistory(updatedHistory)
      saveToSession(updatedHistory)

      // Notify parent component about history update
      if (onHistoryUpdate) {
        const currentIndex = updatedHistory.findIndex(song => song.id === updatedSong.id)
        onHistoryUpdate(updatedHistory, currentIndex)
      }

      // Notify parent component that the main audio URL should update for preview
      if (onSongGenerated) {
        onSongGenerated(updatedSong.audioUrl)
      }

      console.log('✅ Audio selection auto-saved (preview only):', roundedSelection)
      console.log('🎵 Selected duration:', roundedDuration, 'seconds (rounded)')
      console.log('🎵 Playback position reset to start:', roundedSelection.startTime)
      console.log('🎬 Actual clipping will happen at MelodyGram generation')
      console.log('🎶 Preview will update to use new selection')
      console.log('💳 Credits adjusted from', originalCredits, 'to', newCredits, 'based on selection')
      
    } catch (error) {
      console.error('Error saving audio selection:', error)
    }
  }

  // Handle dragging of selection bars and playback position  
  const handleSelectionMouseDown = (e: React.MouseEvent, handle: 'start' | 'end' | 'playback') => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(handle)
    
    // Pause audio when starting to drag selection handles (but not playback scrubbing)
    if ((handle === 'start' || handle === 'end') && audioElement && !audioElement.paused) {
      audioElement.pause()
      setIsPlaying(false)
    }
  }

  const handleSelectionMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !generatedSong || !generatedSong.originalDuration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const timePosition = (x / rect.width) * generatedSong.originalDuration

    const currentSelection = generatedSong.audioSelection || {
      startTime: 0,
      endTime: generatedSong.originalDuration,
      duration: generatedSong.originalDuration
    }

    if (isDragging === 'playback') {
      // Handle playback position dragging
      const clampedTime = Math.max(currentSelection.startTime, Math.min(timePosition, currentSelection.endTime))
      
      // Update audio element current time
      if (audioElement) {
        audioElement.currentTime = clampedTime
      }
      setCurrentTime(clampedTime)
      
    } else {
      // Handle selection boundary dragging
      let newSelection = { ...currentSelection }

      if (isDragging === 'start') {
        newSelection.startTime = Math.max(0, Math.min(timePosition, currentSelection.endTime - 1))
      } else if (isDragging === 'end') {
        newSelection.endTime = Math.min(generatedSong.originalDuration, Math.max(timePosition, currentSelection.startTime + 1))
      }

      newSelection.duration = newSelection.endTime - newSelection.startTime
      updateAudioSelection(newSelection)
    }
  }

  const handleSelectionMouseUp = () => {
    if (isDragging) {
      // When we finish dragging, reset playback position to selection start
      if (generatedSong?.audioSelection && audioElement) {
        const startTime = generatedSong.audioSelection.startTime
        audioElement.currentTime = startTime
        setCurrentTime(startTime)
        console.log('🎵 Reset playback to selection start after drag:', startTime)
      }
    }
    setIsDragging(null)
  }

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(null)
      }

      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging])

  // Generate waveform data when a new song is selected
  const generateWaveform = async (audioUrl: string) => {
    if (!audioUrl || isLoadingWaveform) return

    try {
      setIsLoadingWaveform(true)
      console.log('🌊 Generating waveform for:', audioUrl.substring(0, 50) + '...')

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Sample the audio data for waveform visualization
      const rawData = audioBuffer.getChannelData(0) // Use left channel
      const samples = 100 // Number of waveform bars - reduced for cleaner look
      const blockSize = Math.floor(rawData.length / samples)
      const filteredData = []
      
      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j])
        }
        filteredData.push(sum / blockSize)
      }
      
      // Normalize the data
      const maxVal = Math.max(...filteredData)
      const normalizedData = filteredData.map(val => val / maxVal)
      
      setWaveformData(normalizedData)
      console.log('🌊 Waveform generated with', normalizedData.length, 'data points')
      
      audioContext.close()
    } catch (error) {
      console.error('Error generating waveform:', error)
      // Generate dummy waveform data as fallback
      const dummyData = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.1)
      setWaveformData(dummyData)
    } finally {
      setIsLoadingWaveform(false)
    }
  }

  // Generate waveform when song changes
  useEffect(() => {
    if (generatedSong?.fullAudioUrl || generatedSong?.audioUrl) {
      const audioUrl = generatedSong.fullAudioUrl || generatedSong.audioUrl
      generateWaveform(audioUrl)
    }
  }, [generatedSong?.fullAudioUrl, generatedSong?.audioUrl])



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
                {/* Song Title */}
                <h3 className="font-medium text-white mb-1">
                  {generatedSong.title || 'Untitled'}
                </h3>
                
                {/* Status and Timestamp */}
                <div className="flex items-center space-x-2">
                  {generatedSong.audioSelection && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                      {formatDuration(Math.round(generatedSong.audioSelection.startTime))}-{formatDuration(Math.round(generatedSong.audioSelection.endTime))} ({Math.round(generatedSong.audioSelection.duration)}s)
                    </span>
                  )}
                <p className="text-sm text-gray-400">
                  {new Date(generatedSong.createdAt).toLocaleString()}
                </p>
                </div>
              </div>
            </div>
            
                        {/* Play/Pause Button */}
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

          {/* Progress Bar with Waveform and Selection */}
          <div className="space-y-2">
            <div 
              className="relative h-16 bg-gray-800/50 rounded-lg cursor-pointer select-none overflow-hidden"
              onClick={handleProgressClick}
              onMouseMove={handleSelectionMouseMove}
              onMouseUp={handleSelectionMouseUp}
            >
              {/* Waveform Background */}
              {isLoadingWaveform ? (
                <div className="absolute inset-1 flex items-center justify-center">
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading waveform...</span>
                  </div>
                </div>
              ) : waveformData.length > 0 ? (
                <div className="absolute inset-1 flex items-end justify-between px-1">
                  {waveformData.map((amplitude, index) => (
                    <div
                      key={index}
                      className="bg-gray-500/40 rounded-sm transition-all duration-75"
                      style={{
                        height: `${Math.max(2, amplitude * 100)}%`,
                        width: `${100 / waveformData.length * 0.8}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="absolute inset-1 bg-gray-600/30 rounded-lg" />
              )}
              
              {generatedSong?.audioSelection && generatedSong.originalDuration && (
                <>
                  {/* Selected region overlay */}
                  <div 
                    className="absolute top-1 bottom-1 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-lg border-l-2 border-r-2 border-green-400/40"
                    style={{ 
                      left: `${(generatedSong.audioSelection.startTime / generatedSong.originalDuration) * 100}%`, 
                      width: `${(generatedSong.audioSelection.duration / generatedSong.originalDuration) * 100}%` 
                    }}
                  />
                  
                  {/* Progress within selection */}
                  <div 
                    className="absolute top-1 bottom-1 bg-gradient-to-r from-yellow-400/60 to-orange-400/60 rounded-lg"
                    style={{ 
                      left: `${(generatedSong.audioSelection.startTime / generatedSong.originalDuration) * 100}%`, 
                      width: (() => {
                        const selection = generatedSong.audioSelection
                        if (currentTime >= selection.startTime && currentTime <= selection.endTime) {
                          const progressWithinSelection = (currentTime - selection.startTime) / selection.duration
                          return `${progressWithinSelection * (selection.duration / generatedSong.originalDuration) * 100}%`
                        }
                        return '0%'
                      })()
                    }}
                  />
                  
                  {/* Current time indicator - draggable */}
                  {currentTime >= generatedSong.audioSelection.startTime && currentTime <= generatedSong.audioSelection.endTime && (
                    <div 
                      className={`absolute top-0 bottom-0 w-3 bg-yellow-400/80 rounded-full z-20 shadow-lg cursor-grab active:cursor-grabbing hover:bg-yellow-300 transition-colors ${
                        isDragging === 'playback' ? 'bg-yellow-300 scale-110' : ''
                      }`}
                      style={{ left: `${(currentTime / generatedSong.originalDuration) * 100 - 1.5}%` }}
                      onMouseDown={(e) => handleSelectionMouseDown(e, 'playback')}
                      title="Drag to scrub through audio"
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1 h-8 bg-white/90 rounded-full shadow-sm" />
                      </div>
                    </div>
                  )}
                  
                  {/* Start handle */}
                  <div 
                    className={`absolute top-0 bottom-0 w-4 bg-green-500 rounded-l-lg cursor-ew-resize z-30 hover:bg-green-400 transition-colors shadow-lg ${
                      isDragging === 'start' ? 'bg-green-400 shadow-xl scale-105' : ''
                    }`}
                    style={{ left: `${(generatedSong.audioSelection.startTime / generatedSong.originalDuration) * 100}%` }}
                    onMouseDown={(e) => handleSelectionMouseDown(e, 'start')}
                    title="Drag to adjust start time"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1 h-8 bg-white/90 rounded-full shadow-sm" />
                    </div>
                  </div>
                  
                  {/* End handle */}
                  <div 
                    className={`absolute top-0 bottom-0 w-4 bg-blue-500 rounded-r-lg cursor-ew-resize z-30 hover:bg-blue-400 transition-colors shadow-lg ${
                      isDragging === 'end' ? 'bg-blue-400 shadow-xl scale-105' : ''
                    }`}
                    style={{ left: `${((generatedSong.audioSelection.startTime + generatedSong.audioSelection.duration) / generatedSong.originalDuration) * 100 - 4}%` }}
                    onMouseDown={(e) => handleSelectionMouseDown(e, 'end')}
                    title="Drag to adjust end time"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1 h-8 bg-white/90 rounded-full shadow-sm" />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>0:00</span>
              {generatedSong?.audioSelection && (
                <>
                  <span className="text-green-400">Start: {formatDuration(generatedSong.audioSelection.startTime)}</span>
                  <span className="text-blue-400">End: {formatDuration(generatedSong.audioSelection.endTime)}</span>
                </>
              )}
              <span>{generatedSong?.originalDuration ? formatDuration(generatedSong.originalDuration) : '--:--'}</span>
            </div>
            
            {/* Waveform Instructions */}
            {waveformData.length > 0 && (
              <div className="text-xs text-gray-400 bg-gray-800/30 rounded-lg p-2 mt-2">
                                 <p>• Drag <span className="text-green-400">Green Bar</span> to Adjust Start </p><p>• Drag <span className="text-blue-400">Blue Bar</span> to Adjust End </p><p>• Drag <span className="text-yellow-400">Yellow Bar</span> to Pick a Spot</p>
              </div>
            )}
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
                      {/* Song Title - Can wrap to two lines */}
                      <p className={`text-xs font-medium mb-2 leading-tight line-clamp-2 ${
                        isCurrentSong ? 'text-white' : 'text-white'
                      }`}>
                        {song.title || 'Untitled'}
                      </p>
                      
                      {/* Details - Bottom Line */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(song.createdAt).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-400">
                            {song.audioSelection ? `${Math.round(song.audioSelection.duration)}s` : `${Math.round(song.targetDuration)}s`}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-purple-400">
                            {Math.round(getCreditsForLength(song.audioSelection ? song.audioSelection.duration : song.targetDuration))} credits
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col items-end space-y-1">
                      {/* Active Indicator */}
                      {isCurrentSong && (
                        <span className="text-xs text-green-400 font-medium">Active</span>
                      )}
                      
                      {/* Buttons Row */}
                      <div className="flex items-center space-x-2">
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent row click
                          handleDeleteClick(song.id!)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                          pendingDeletes.has(song.id!)
                            ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 animate-pulse'
                            : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30'
                        }`}
                        title={pendingDeletes.has(song.id!) ? "Click to confirm deletion" : "Delete this generation"}
                      >
                        {pendingDeletes.has(song.id!) ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
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
                </div>
              )
            })}
          </div>
        </div>
      )}


    </div>
  )
} 