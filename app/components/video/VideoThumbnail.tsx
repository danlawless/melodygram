'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import VideoThumbnailFallback from './VideoThumbnailFallback'

interface VideoThumbnailProps {
  videoUrl: string
  title: string
  className?: string
  onPlay: () => void
  showPlayButton?: boolean
}

export default function VideoThumbnail({ 
  videoUrl, 
  title, 
  className = '', 
  onPlay, 
  showPlayButton = true 
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let timeoutId: NodeJS.Timeout

    const handleLoadedData = () => {
      console.log('✅ Video thumbnail loaded:', videoUrl)
      setIsLoaded(true)
      setIsLoading(false)
      setHasError(false)
      setDuration(video.duration)
      // Set to first frame for thumbnail
      video.currentTime = 0.1
      if (timeoutId) clearTimeout(timeoutId)
    }

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      video.currentTime = 0.1 // Reset to thumbnail frame
    }

    const handleCanPlay = () => {
      console.log('✅ Video can play, showing thumbnail:', videoUrl)
      setIsLoaded(true)
      setIsLoading(false)
      setHasError(false)
      setDuration(video.duration)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const handleError = (e: any) => {
      console.error('❌ Video thumbnail error:', videoUrl, e)
      setHasError(true)
      setIsLoading(false)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const handleLoadStart = () => {
      console.log('🔄 Loading video thumbnail:', videoUrl)
      setIsLoading(true)
      setHasError(false)
      
      // Set timeout to show fallback if video doesn't load in 5 seconds
      timeoutId = setTimeout(() => {
        console.log('⏱️ Video thumbnail timeout, showing fallback:', videoUrl)
        setHasError(true)
        setIsLoading(false)
      }, 5000)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)

    // Force reload
    video.load()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [videoUrl, isDragging])

  // Handle progress bar scrubbing
  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    const progressBar = progressRef.current
    if (!video || !progressBar || !duration) return

    const rect = progressBar.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    
    video.currentTime = Math.max(0, Math.min(newTime, duration))
    setCurrentTime(video.currentTime)
  }

  // Handle progress bar dragging
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    handleProgressClick(e)

    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current
      const progressBar = progressRef.current
      if (!video || !progressBar || !duration) return

      const rect = progressBar.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(x / rect.width, 1))
      const newTime = percentage * duration
      
      video.currentTime = newTime
      setCurrentTime(newTime)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle inline play/pause toggle
  const handleThumbnailClick = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  // Handle "Watch" button click (opens full player)
  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent thumbnail click
    onPlay()
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // If there's an error loading the video, show the fallback component
  if (hasError) {
    return (
      <VideoThumbnailFallback
        title={title}
        className={className}
        onPlay={onPlay}
        status="completed"
      />
    )
  }

  return (
    <div 
      className={`relative group cursor-pointer ${className}`} 
      onClick={handleThumbnailClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Thumbnail (paused at first frame) */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        
        {/* Actual Video Element as Thumbnail */}
        <video
          ref={videoRef}
          src={videoUrl}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          muted={!isPlaying}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          poster=""
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          controls={false} // Always hide native controls
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Controls Overlay */}
        {showPlayButton && (
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Play/Pause Button */}
            <div className={`w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </div>
        )}

        {/* Interactive Progress Bar */}
        {isLoaded && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 group-hover:h-2 transition-all duration-200">
            <div
              ref={progressRef}
              className="relative w-full h-full cursor-pointer"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              {/* Progress Background */}
              <div className="absolute inset-0 bg-white/20" />
              
              {/* Progress Fill */}
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-150 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
              
              {/* Progress Handle (visible on hover) */}
              <div 
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1/2 transition-all duration-200 opacity-0 group-hover:opacity-100"
                style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>
        )}

        {/* Time Display (on hover) */}
        {isLoaded && duration > 0 && showControls && (
          <div className="absolute bottom-3 left-3 text-white text-xs bg-black/50 backdrop-blur-sm rounded px-2 py-1 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}

        {/* Watch Button (Full Player) */}
        {showPlayButton && isLoaded && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWatchClick}
              className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition-colors"
            >
              Watch
            </button>
          </div>
        )}

        {/* Always Show Play Button for Loading State */}
        {isLoading && showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 