'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Volume2, Image as ImageIcon, X } from 'lucide-react'
import { useGlobalAudioManager } from '../../services/audioManager'

interface MelodyGramPreviewProps {
  // Image data
  uploadedImage?: File | null
  generatedImageUrl?: string | null
  
  // Audio data
  songTitle: string
  lyrics: string
  generatedSongUrl?: string | null
  audioSelection?: {
    startTime: number
    endTime: number
    duration: number
  } | null
  
  // Metadata
  selectedVocal: string
  songLength: number
  
  // Close handler
  onClose?: () => void
}

export default function MelodyGramPreview({
  uploadedImage,
  generatedImageUrl,
  songTitle,
  lyrics,
  generatedSongUrl,
  audioSelection,
  selectedVocal,
  songLength,
  onClose
}: MelodyGramPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Global audio manager integration
  const audioManager = useGlobalAudioManager('melodygram-preview', 'MelodyGram Preview')

  // Get image URL (uploaded or generated)
  useEffect(() => {
    if (uploadedImage) {
      const url = URL.createObjectURL(uploadedImage)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (generatedImageUrl) {
      setImageUrl(generatedImageUrl)
    } else {
      setImageUrl(null)
    }
  }, [uploadedImage, generatedImageUrl])

  // Register with global audio manager
  useEffect(() => {
    const stopCallback = () => {
      console.log('🎵 🛑 MelodyGram Preview: Stopped by global audio manager')
      if (audioElement && !audioElement.paused) {
        audioElement.pause()
      }
      setIsPlaying(false)
    }

    audioManager.registerPlayer(audioElement, stopCallback)
    
    return () => {
      audioManager.unregisterPlayer()
    }
  }, [audioElement])

  // Update audio element reference in manager when it changes
  useEffect(() => {
    audioManager.updateElement(audioElement)
  }, [audioElement])

  const handlePlayPause = async () => {
    if (!generatedSongUrl) {
      console.log('🎵 ❌ No audio URL available for preview')
      return
    }

    try {
      if (audioElement && !audioElement.paused) {
        // Pause current audio
        audioElement.pause()
        setIsPlaying(false)
        audioManager.stopPlaying()
      } else {
        // Notify global audio manager that we're starting playback
        audioManager.startPlaying()
        
        // Play or resume audio
        let audio = audioElement

        if (!audio) {
          // Create new audio element with proxy
          const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(generatedSongUrl)}`
          audio = new Audio(proxyUrl)
          console.log('🎵 Created preview audio element:', generatedSongUrl?.substring(0, 50) + '...')
          console.log('🎵 Using audio proxy for preview:', proxyUrl)
          
          // Mobile compatibility
          audio.preload = 'metadata'
          audio.crossOrigin = 'anonymous'
          
          let isSeekingToStart = false // Prevent infinite loop
          
          audio.addEventListener('ended', () => {
            // Reset to selection start or beginning
            const resetTime = audioSelection ? audioSelection.startTime : 0
            audio.currentTime = resetTime
            setIsPlaying(false)
            setCurrentTime(0)
            console.log('🎵 Preview audio ended, reset to:', resetTime)
          })

          audio.addEventListener('error', (e) => {
            console.error('🎵 Preview audio error:', e)
            setIsPlaying(false)
          })

          audio.addEventListener('loadedmetadata', () => {
            // Use selected segment duration if available, otherwise target duration
            const previewDuration = audioSelection ? audioSelection.duration : songLength
            setDuration(previewDuration)
            console.log('🎵 Preview audio metadata loaded, duration:', previewDuration)
          })

          audio.addEventListener('timeupdate', () => {
            const currentTime = audio.currentTime
            
            if (audioSelection) {
              // When we have an audio selection, play only that segment
              const relativeTime = currentTime - audioSelection.startTime // Time within selection
              
              // Auto-pause when reaching end of selection
              if (currentTime >= audioSelection.endTime) {
                console.log('🎵 Preview reached end of selection, resetting to start')
                audio.pause()
                isSeekingToStart = true
                audio.currentTime = audioSelection.startTime
                setIsPlaying(false)
                setCurrentTime(0) // Reset to start of selection for display
                setTimeout(() => { isSeekingToStart = false }, 100)
                return
              }
              
              // If we're before the selection start, jump to start (with loop prevention)
              if (currentTime < audioSelection.startTime && !isSeekingToStart) {
                console.log('🎵 Preview before selection start, jumping to:', audioSelection.startTime)
                isSeekingToStart = true
                audio.currentTime = audioSelection.startTime
                setCurrentTime(0)
                setTimeout(() => { isSeekingToStart = false }, 100)
                return
              }
              
              // Update display time relative to selection
              setCurrentTime(Math.max(0, relativeTime))
            } else {
              // No selection, play normally
              setCurrentTime(currentTime)
            }
          })

          audio.addEventListener('play', () => {
            setIsPlaying(true)
            console.log('🎵 Preview audio started playing')
          })

          audio.addEventListener('pause', () => {
            setIsPlaying(false)
            console.log('🎵 Preview audio paused')
          })

          setAudioElement(audio)
        }

        // Start playback
        if (audioSelection) {
          // Jump to selection start time
          console.log('🎵 Setting preview playback to selection start:', audioSelection.startTime)
          audio.currentTime = audioSelection.startTime
        }

        console.log('🎵 ▶️ Starting preview audio playback...')
        await audio.play()
      }
    } catch (error) {
      console.error('🎵 ❌ Preview audio playback error:', error)
      setIsPlaying(false)
    }
  }

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get preview lyrics (first few lines)
  const getPreviewLyrics = (lyrics: string): string => {
    const lines = lyrics.split('\n').filter(line => line.trim())
    return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '')
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-white">MelodyGram Preview</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center">
            <ImageIcon className="w-4 h-4 mr-1" />
            Avatar Image
          </h4>
          <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image selected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Preview & Info */}
        <div className="space-y-3">
          {/* Song Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Song Information</h4>
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Title:</span>
                <span className="text-white font-medium">{songTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Voice:</span>
                <span className="text-white capitalize">{selectedVocal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Length:</span>
                <span className="text-white">{songLength}s</span>
              </div>
              {audioSelection && (
                <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
                  <span className="text-gray-400">Clip:</span>
                  <span className="text-blue-400 font-medium">
                    {formatTime(audioSelection.startTime)} - {formatTime(audioSelection.endTime)} 
                    ({Math.round(audioSelection.duration)}s)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Audio Player */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 flex items-center">
              <Volume2 className="w-4 h-4 mr-1" />
              Audio Preview
            </h4>
            <div className="bg-gray-800/50 rounded-lg p-4">
              {generatedSongUrl ? (
                <div className="space-y-3">
                  {/* Play Button */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handlePlayPause}
                      className="w-14 h-14 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 rounded-full flex items-center justify-center transition-all duration-200 border border-green-500/30 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm touch-manipulation"
                      title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 text-green-400" />
                      ) : (
                        <Play className="w-7 h-7 text-green-400 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Time Display */}
                  <div className="text-center">
                    <span className="text-sm text-gray-400">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    {audioSelection && (
                      <p className="text-xs text-blue-400 mt-1">
                        Playing clipped segment only
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No audio generated yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Lyrics Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Lyrics Preview</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {getPreviewLyrics(lyrics)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Test Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-sm text-blue-400">
          📱 <strong>Mobile Test:</strong> Tap the play button above to test audio playback on your device. 
          Verify the image displays correctly and audio plays the selected segment only.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-sm text-yellow-400">
          🧪 <strong>Dry Run Mode:</strong> This is a preview only. No credits will be charged and no MelodyGram will be created until you proceed with the actual generation.
        </p>
      </div>
    </div>
  )
}