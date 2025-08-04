'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Music, Image as ImageIcon, User, Clock, Mic, ChevronLeft, ChevronRight } from 'lucide-react'

interface FinalPreviewProps {
  // Image data
  uploadedImageUrl?: string | null
  generatedImageUrl?: string | null
  
  // Song data
  songTitle: string
  songLength: number
  selectedVocal: string
  generatedSongUrl?: string | null
  currentGenerationNumber?: number
  totalGenerations?: number
  
  // Lyrics preview (should match the selected generation)
  lyrics: string
  
  // Navigation handlers
  onPreviousAvatar?: () => void
  onNextAvatar?: () => void
  onPreviousAudio?: () => void
  onNextAudio?: () => void
  hasMultipleAvatars?: boolean
  hasMultipleAudio?: boolean
  
  // Gender matching
  currentAvatarGender?: string // Gender of current avatar for matching
}

export default function FinalPreview({
  uploadedImageUrl,
  generatedImageUrl,
  songTitle,
  songLength,
  selectedVocal,
  generatedSongUrl,
  currentGenerationNumber,
  totalGenerations,
  lyrics,
  onPreviousAvatar,
  onNextAvatar,
  onPreviousAudio,
  onNextAudio,
  hasMultipleAvatars = false,
  hasMultipleAudio = false,
  currentAvatarGender
}: FinalPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Get the image URL to display
  const imageUrl = uploadedImageUrl || generatedImageUrl

  // Gender matching logic
  const getGenderMatch = () => {
    if (!currentAvatarGender || !selectedVocal) return null
    
    const voiceGender = selectedVocal.toLowerCase()
    const avatarGender = currentAvatarGender.toLowerCase()
    
    const isMatch = voiceGender === avatarGender
    
    return {
      isMatch,
      voiceGender,
      avatarGender,
      message: isMatch 
        ? `Perfect match: ${avatarGender === 'male' ? 'Male' : 'Female'} voice & avatar`
        : `Mismatch: ${voiceGender === 'male' ? 'Male' : 'Female'} voice with ${avatarGender === 'male' ? 'Male' : 'Female'} avatar`
    }
  }

  const genderMatch = getGenderMatch()

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format song length for display
  const formatSongLength = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }

  // Truncate lyrics for preview
  const getPreviewLyrics = (lyrics: string): string => {
    const words = lyrics.split(' ')
    if (words.length <= 15) return lyrics
    return words.slice(0, 15).join(' ') + '...'
  }

  const handlePlayPause = async () => {
    if (!generatedSongUrl) return

    try {
      if (audioElement && !audioElement.paused) {
        // Pause current audio
        audioElement.pause()
        audioElement.volume = 1.0
        setIsPlaying(false)
      } else {
        // Play or resume audio
        let audio = audioElement

        if (!audio) {
          // Create new audio element
          audio = new Audio(generatedSongUrl)
          
          audio.addEventListener('ended', () => {
            audio.currentTime = 0
            audio.volume = 1.0
            setIsPlaying(false)
            setCurrentTime(0)
          })

          audio.addEventListener('error', (e) => {
            console.error('🎵 Preview audio error:', e)
            setIsPlaying(false)
          })

          audio.addEventListener('loadedmetadata', () => {
            setDuration(songLength) // Use target duration
          })

          audio.addEventListener('timeupdate', () => {
            const currentTime = audio.currentTime
            const targetDuration = songLength
            const fadeInDuration = 0.5
            const fadeOutDuration = 0.5
            const fadeOutStartTime = targetDuration - fadeOutDuration
            
            // Smooth fade-in during the first 0.5 seconds
            if (currentTime <= fadeInDuration) {
              const fadeProgress = currentTime / fadeInDuration
              const volume = Math.min(1, fadeProgress)
              audio.volume = volume
            }
            // Smooth fade-out in the last 0.5 seconds  
            else if (currentTime >= fadeOutStartTime && currentTime < targetDuration) {
              const fadeProgress = (currentTime - fadeOutStartTime) / fadeOutDuration
              const volume = Math.max(0, 1 - fadeProgress)
              audio.volume = volume
            }
            // Full volume in the middle section
            else if (currentTime > fadeInDuration && currentTime < fadeOutStartTime) {
              audio.volume = 1.0
            }
            
            // Auto-pause when reaching target duration
            if (currentTime >= targetDuration) {
              audio.pause()
              audio.currentTime = 0
              audio.volume = 1.0
              setIsPlaying(false)
              setCurrentTime(0)
            } else {
              setCurrentTime(currentTime)
            }
          })
          
          setAudioElement(audio)
        }

        // If we're at or near the end, reset to beginning
        if (audio.currentTime >= songLength - 0.1) {
          audio.currentTime = 0
          setCurrentTime(0)
        }
        
        audio.volume = 0.0 // Start at 0 volume for fade-in
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('🎵 Preview playback error:', error)
      setIsPlaying(false)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    }
  }, [])

  if (!imageUrl || !generatedSongUrl || !songTitle.trim()) {
    return null // Don't show preview until everything is ready
  }

    return (
    <div className="relative bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-pink-900/30 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
      {/* Full-Size Avatar Display */}
      <div className="relative">
        <div className="w-full h-96 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.warn('🚫 Final preview avatar failed to load (likely expired URL):', imageUrl)
                // Replace with placeholder
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gray-700">
                      <div class="text-center text-gray-400">
                        <div class="text-4xl mb-2">🚫</div>
                        <div class="text-sm">Avatar Expired</div>
                        <div class="text-xs mt-1">Please regenerate</div>
                      </div>
                    </div>
                  `
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Avatar Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20 shadow-lg backdrop-blur-sm">
            {uploadedImageUrl ? 'Uploaded Avatar' : 'Generated Avatar'}
          </div>
        </div>

        {/* Avatar Navigation Arrows */}
        {hasMultipleAvatars && (
          <>
            <button
              onClick={onPreviousAvatar}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
              title="Previous Avatar"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={onNextAvatar}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
              title="Next Avatar"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Integrated Song Title and Audio Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-lg mb-1 truncate">{songTitle}</h4>
              <p className="text-gray-300 text-sm">
                {formatSongLength(songLength)} • {selectedVocal.charAt(0).toUpperCase() + selectedVocal.slice(1)} Voice
              </p>
              
              {/* Gender Match Indicator */}
              {genderMatch && (
                <div className={`flex items-center space-x-1 mt-1 ${
                  genderMatch.isMatch ? 'text-green-400' : 'text-amber-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    genderMatch.isMatch ? 'bg-green-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs">
                    {genderMatch.isMatch ? '✓ Perfect match' : '⚠ Voice/Avatar mismatch'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {/* Previous Audio Arrow */}
              {hasMultipleAudio && (
                <button
                  onClick={onPreviousAudio}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  title="Previous Audio"
                >
                  <ChevronLeft className="w-3 h-3 text-white" />
                </button>
              )}
              
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 rounded-full flex items-center justify-center transition-all duration-200 border border-green-500/30 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-green-400" />
                ) : (
                  <Play className="w-6 h-6 text-green-400 ml-0.5" />
                )}
              </button>
              
              {/* Next Audio Arrow */}
              {hasMultipleAudio && (
                <button
                  onClick={onNextAudio}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  title="Next Audio"
                >
                  <ChevronRight className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(isPlaying || currentTime > 0) && (
            <div className="mt-3 space-y-2">
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full transition-all duration-200 shadow-sm"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Elegant Footer Accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
    </div>
  )
} 