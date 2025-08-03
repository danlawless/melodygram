'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X, 
  SkipBack, 
  SkipForward,
  Download,
  Share2,
  MoreHorizontal
} from 'lucide-react'

interface VideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
  jobId: string
  onDownload?: () => void
  onShare?: () => void
}

export default function VideoPlayer({ 
  isOpen, 
  onClose, 
  videoUrl, 
  title, 
  jobId,
  onDownload,
  onShare 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // Auto-hide controls after inactivity, but always show on hover
  useEffect(() => {
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }

    // Only auto-hide if playing and controls are shown
    if (isPlaying && showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false)
      }, 3000)
      setControlsTimeout(timeout)
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [showControls, isPlaying])

  // Show controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true)
  }

  // Show controls on mouse enter, hide on mouse leave (with delay)
  const handleMouseEnter = () => {
    setShowControls(true)
  }

  const handleMouseLeave = () => {
    // Hide controls immediately when mouse leaves if playing
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false)
      }, 500) // Small delay to prevent flickering
      setControlsTimeout(timeout)
    }
  }

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      
      // Auto-play when video loads
      if (isOpen) {
        video.play().then(() => {
          console.log('🎬 Auto-playing video:', title)
        }).catch(err => {
          console.log('⚠️ Auto-play blocked by browser (user interaction required):', err)
        })
      }
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
  }, [videoUrl, isOpen, title])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlayPause()
          break
        case 'Escape':
          onClose()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const progressBar = progressRef.current
    if (!video || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    video.currentTime = percentage * duration
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Completely Opaque Water Ripple Background */}
      <div className="absolute inset-0">
        {/* Solid base - completely opaque, no transparency */}
        <div className="absolute inset-0 bg-slate-900" />
        
        {/* Water ripple layers */}
        <div className="absolute inset-0">
          {/* Ripple 1 - Large slow ripples */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle 400px at 30% 40%, rgba(139, 92, 246, 0.15), transparent 50%),
                radial-gradient(circle 300px at 70% 60%, rgba(236, 72, 153, 0.12), transparent 50%),
                radial-gradient(circle 500px at 50% 80%, rgba(59, 130, 246, 0.1), transparent 50%)
              `,
              animation: 'water-ripple-1 12s ease-in-out infinite'
            }}
          />
          
          {/* Ripple 2 - Medium ripples */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle 250px at 80% 30%, rgba(139, 92, 246, 0.12), transparent 60%),
                radial-gradient(circle 350px at 20% 70%, rgba(236, 72, 153, 0.1), transparent 55%),
                radial-gradient(circle 200px at 60% 20%, rgba(59, 130, 246, 0.08), transparent 45%)
              `,
              animation: 'water-ripple-2 8s ease-in-out infinite reverse'
            }}
          />
          
          {/* Ripple 3 - Small fast ripples */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle 150px at 40% 70%, rgba(139, 92, 246, 0.1), transparent 50%),
                radial-gradient(circle 120px at 90% 50%, rgba(236, 72, 153, 0.08), transparent 40%),
                radial-gradient(circle 180px at 10% 30%, rgba(59, 130, 246, 0.06), transparent 45%),
                radial-gradient(circle 100px at 70% 90%, rgba(139, 92, 246, 0.07), transparent 35%)
              `,
              animation: 'water-ripple-3 6s ease-in-out infinite'
            }}
          />
          
          {/* Additional micro ripples for detail */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle 80px at 25% 25%, rgba(236, 72, 153, 0.08), transparent 40%),
                radial-gradient(circle 60px at 75% 75%, rgba(139, 92, 246, 0.06), transparent 35%),
                radial-gradient(circle 90px at 15% 85%, rgba(59, 130, 246, 0.05), transparent 30%),
                radial-gradient(circle 70px at 85% 15%, rgba(236, 72, 153, 0.07), transparent 40%),
                radial-gradient(circle 50px at 50% 50%, rgba(139, 92, 246, 0.04), transparent 25%)
              `,
              animation: 'water-ripple-micro 4s ease-in-out infinite reverse'
            }}
          />
        </div>
        
        {/* Subtle surface texture */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100px 50px at 20% 30%, rgba(255, 255, 255, 0.02), transparent),
              radial-gradient(ellipse 80px 40px at 60% 70%, rgba(255, 255, 255, 0.015), transparent),
              radial-gradient(ellipse 120px 60px at 80% 40%, rgba(255, 255, 255, 0.01), transparent),
              radial-gradient(ellipse 90px 45px at 30% 80%, rgba(255, 255, 255, 0.018), transparent)
            `,
            animation: 'water-surface 10s ease-in-out infinite'
          }}
        />
        
        {/* Gentle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/40" />
        
        {/* Final dark overlay for perfect video contrast */}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Video Container */}
      <div 
        className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center z-10"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full rounded-2xl shadow-2xl"
          onClick={togglePlayPause}
          poster="" // Could add a poster image here
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Controls Overlay */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Central Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all duration-300 group"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                <p className="text-gray-400 text-sm">Avatar #{jobId.substring(0, 8)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {onShare && (
                  <button 
                    onClick={onShare}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
                {onDownload && (
                  <button 
                    onClick={onDownload}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative group-hover:from-purple-400 group-hover:to-pink-400 transition-all"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-all hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-black" />
                  ) : (
                    <Play className="w-6 h-6 text-black ml-1" />
                  )}
                </button>

                <div className="flex items-center gap-2 text-white">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none slider"
                  />
                </div>

                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
} 