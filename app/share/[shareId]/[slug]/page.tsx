'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Share2, Download, Heart, Sparkles, Users, Zap, ArrowRight, Music, Star, Clock, Eye } from 'lucide-react'
import { ShareData } from '../../../api/share/route'

interface SharePageProps {
  params: {
    shareId: string
    slug: string
  }
}

export default function SharePage({ params }: SharePageProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    fetchShareData()
  }, [params.shareId])

  const fetchShareData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/share?id=${params.shareId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load shared content')
      }

      setShareData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    const video = document.querySelector('video') as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMuteToggle = () => {
    const video = document.querySelector('video') as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleCreateYourOwn = () => {
    // Redirect to main app or show signup modal
    if (typeof window !== 'undefined') {
      window.location.href = '/?ref=shared-video'
    }
  }

  const handleShare = async () => {
    if (navigator.share && shareData) {
      try {
        await navigator.share({
          title: `${shareData.title} - MelodyGram`,
          text: 'Check out this amazing AI-generated singing avatar!',
          url: window.location.href
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading shared MelodyGram...</p>
        </div>
      </div>
    )
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-4">Oops! Content Not Found</h1>
          <p className="text-gray-300 mb-6">
            {error || 'This shared MelodyGram may have expired or been removed.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Create Your Own MelodyGram
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">MelodyGram</span>
          </div>
          <button
            onClick={handleCreateYourOwn}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Create Yours
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Video Player Section */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/50 backdrop-blur-sm border border-white/20">
              <video
                src={shareData.videoUrl}
                className="w-full h-auto max-h-[600px] object-cover"
                poster={shareData.thumbnailUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls={false}
                muted={isMuted}
                playsInline
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                    </button>
                    <button
                      onClick={handleMuteToggle}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handlePlayPause}
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-300"
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Video Stats */}
            <div className="flex items-center justify-center gap-6 mt-4 text-white/60 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{shareData.views} views</span>
              </div>
              {shareData.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round(shareData.duration)}s</span>
                </div>
              )}
              {shareData.genre && (
                <div className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  <span>{shareData.genre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content & CTA Section */}
          <div className="text-white space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {shareData.title}
              </h1>
              <p className="text-gray-300 text-lg">
                Created with AI-powered singing avatar technology
              </p>
            </div>

            {shareData.lyrics && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Lyrics
                </h3>
                <div className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {shareData.lyrics}
                </div>
              </div>
            )}

            {/* Features Highlight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="font-semibold mb-1">AI Generated</h4>
                <p className="text-sm text-gray-300">Custom song from lyrics</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Users className="w-8 h-8 text-pink-400 mb-2" />
                <h4 className="font-semibold mb-1">Talking Avatar</h4>
                <p className="text-sm text-gray-300">Your photo comes alive</p>
              </div>
            </div>

            {/* Main CTA */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold mb-2">Create Your Own MelodyGram!</h3>
              <p className="text-gray-300 mb-4">
                Transform your photos into singing avatars with custom AI-generated songs. It's free to get started!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCreateYourOwn}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share This
                </button>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                Join thousands creating amazing AI avatar videos
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">MelodyGram</span>
          </div>
          <p className="text-sm">
            Transform your photos into singing avatars with AI-generated music
          </p>
        </div>
      </footer>
    </div>
  )
}