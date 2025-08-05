'use client'

import React, { useState, useEffect } from 'react'
import { X, Share2, Copy, ExternalLink, Loader2, Check, Users, Heart, Zap, Star } from 'lucide-react'
import { shareService, ShareOptions } from '../../services/shareService'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareOptions: ShareOptions
}

interface SocialPlatform {
  name: string
  icon: string
  color: string
  url: string
}

export default function ShareModal({ isOpen, onClose, shareOptions }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [socialUrls, setSocialUrls] = useState<any>(null)

  useEffect(() => {
    if (isOpen && !shareUrl) {
      generateShareLink()
    }
  }, [isOpen])

  const generateShareLink = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await shareService.createShareLink(shareOptions)
      
      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl)
        
        // Generate social sharing URLs
        const socialUrls = shareService.generateSocialShareUrls(
          result.shareUrl,
          shareOptions.title,
          shareOptions.lyrics?.slice(0, 100) + '...'
        )
        setSocialUrls(socialUrls)
      } else {
        setError(result.error || 'Failed to create share link')
      }
    } catch (err) {
      setError('Failed to generate share link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleSocialShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
  }

  const handleNativeShare = async () => {
    if (!shareUrl) return
    
    const success = await shareService.shareUrl(
      shareUrl,
      shareOptions.title,
      'Check out my AI-generated singing avatar!'
    )
    
    if (success) {
      onClose()
    }
  }

  if (!isOpen) return null

  const socialPlatforms: SocialPlatform[] = socialUrls ? [
    { name: 'Twitter', icon: '𝕏', color: 'hover:bg-black', url: socialUrls.twitter },
    { name: 'Facebook', icon: 'f', color: 'hover:bg-blue-600', url: socialUrls.facebook },
    { name: 'LinkedIn', icon: 'in', color: 'hover:bg-blue-700', url: socialUrls.linkedin },
    { name: 'WhatsApp', icon: '💬', color: 'hover:bg-green-500', url: socialUrls.whatsapp },
    { name: 'Telegram', icon: '✈️', color: 'hover:bg-blue-500', url: socialUrls.telegram },
    { name: 'Reddit', icon: '🔴', color: 'hover:bg-orange-600', url: socialUrls.reddit },
    { name: 'Email', icon: '📧', color: 'hover:bg-gray-600', url: socialUrls.email },
  ] : []

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Share Your MelodyGram</h3>
              <p className="text-sm text-gray-400">Let others enjoy your creation!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Video Preview */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h4 className="font-medium text-white mb-2 truncate">{shareOptions.title}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {shareOptions.genre && (
                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  {shareOptions.genre}
                </span>
              )}
              {shareOptions.mood && (
                <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded">
                  {shareOptions.mood}
                </span>
              )}
            </div>
          </div>

          {/* Share URL Section */}
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-gray-400">Creating your shareable link...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={generateShareLink}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {shareUrl && (
            <>
              {/* Copy Link */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Share Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Native Share Button */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share via...
                </button>
              )}

              {/* Social Media Buttons */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Share on Social Media</label>
                <div className="grid grid-cols-4 gap-2">
                  {socialPlatforms.slice(0, 8).map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform.name, platform.url)}
                      className={`aspect-square bg-gray-700 ${platform.color} text-white rounded-lg flex items-center justify-center text-lg font-bold transition-all hover:scale-105`}
                      title={`Share on ${platform.name}`}
                    >
                      {platform.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-medium text-white">Boost Your Reach</span>
                </div>
                <p className="text-xs text-gray-300 mb-3">
                  Your shared link includes an attractive player and encourages others to create their own MelodyGrams!
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Public viewing
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Auto sign-up prompts
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    SEO optimized
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}