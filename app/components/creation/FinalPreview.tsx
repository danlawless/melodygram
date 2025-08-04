'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Music, Image as ImageIcon, User, Clock, Mic } from 'lucide-react'

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
  lyrics
}: FinalPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Get the image URL to display
  const imageUrl = uploadedImageUrl || generatedImageUrl

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
    <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Preview Your MelodyGram</h3>
        <p className="text-gray-400 text-sm">Review everything before generating your final video</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-500" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              {uploadedImageUrl ? 'Uploaded Avatar' : 'Generated Avatar'}
            </p>
          </div>
        </div>

        {/* Right: Song Details */}
        <div className="space-y-4">
          {/* Song Title */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-2">
              <Music className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Song Title</span>
            </div>
            <p className="text-white font-semibold text-lg">{songTitle}</p>
          </div>

          {/* Song Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Duration</span>
              </div>
              <p className="text-white font-medium">{formatSongLength(songLength)}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-1">
                <Mic className="w-4 h-4 text-pink-400" />
                <span className="text-xs text-gray-400">Voice</span>
              </div>
              <p className="text-white font-medium capitalize">{selectedVocal}</p>
            </div>
          </div>

          {/* Lyrics Preview */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Lyrics Preview</span>
            </div>
            <p className="text-gray-300 text-sm italic leading-relaxed">
              "{getPreviewLyrics(lyrics)}"
            </p>
          </div>

          {/* Audio Player */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-green-400" />
                </div>
                                 <div>
                   <p className="text-white font-medium text-sm">Preview Audio</p>
                   <p className="text-gray-400 text-xs">
                     {currentGenerationNumber && totalGenerations 
                       ? `Generation ${currentGenerationNumber} of ${totalGenerations} • Click to preview`
                       : 'Click to preview your song'
                     }
                   </p>
                 </div>
              </div>
              
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-green-500/20 hover:bg-green-500/30 rounded-full flex items-center justify-center transition-colors border border-green-500/30 flex-shrink-0"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-green-400" />
                ) : (
                  <Play className="w-6 h-6 text-green-400" />
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {(isPlaying || currentTime > 0) && (
              <div className="space-y-2">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-200"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 