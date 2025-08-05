'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react'
import { useGlobalAudioManager } from '../../services/audioManager'

interface MiniVideoPlayerProps {
  isVisible: boolean
  videoUrl: string
  title: string
  jobId: string
  onExpand: () => void
  onClose: () => void
}

export default function MiniVideoPlayer({ 
  isVisible, 
  videoUrl, 
  title, 
  jobId,
  onExpand,
  onClose 
}: MiniVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Global audio manager integration
  const audioManager = useGlobalAudioManager(`mini-video-player-${jobId}`, 'Mini Video Player')

  // Register/unregister with global audio manager
  useEffect(() => {
    const stopCallback = () => {
      console.log('🎵 🛑 Mini Video Player: Stopped by global audio manager')
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
      setIsPlaying(false)
    }

    audioManager.registerPlayer(videoRef.current, stopCallback)
    
    return () => {
      audioManager.unregisterPlayer()
    }
  }, [videoRef.current, jobId])

  // Update video element reference in manager when it changes
  useEffect(() => {
    audioManager.updateElement(videoRef.current)
  }, [videoRef.current])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [videoUrl])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      audioManager.stopPlaying()
    } else {
      // Notify global audio manager that we're starting playback
      audioManager.startPlaying()
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center gap-4 p-4 max-w-7xl mx-auto">
        {/* Video Thumbnail */}
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-16 h-12 rounded-lg object-cover cursor-pointer"
            onClick={onExpand}
            muted={isMuted}
          />
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onExpand}>
            <Maximize className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate cursor-pointer hover:underline" onClick={onExpand}>
            {title}
          </h4>
          <p className="text-gray-400 text-xs truncate">
            Avatar #{jobId.substring(0, 8)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex flex-1 max-w-md items-center gap-3">
          <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer group">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative group-hover:from-purple-400 group-hover:to-pink-400 transition-all"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-all hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black" />
            ) : (
              <Play className="w-5 h-5 text-black ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none slider"
            />
          </div>

          {/* Expand Button */}
          <button
            onClick={onExpand}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
            title="Expand Player"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Styles for Slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
} 