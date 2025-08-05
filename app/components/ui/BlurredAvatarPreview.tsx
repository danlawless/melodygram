'use client'

import React from 'react'

interface BlurredAvatarPreviewProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  showStatusText?: boolean
  showSpinner?: boolean
}

export default function BlurredAvatarPreview({
  status,
  imageUrl,
  size = 'medium',
  className = '',
  showStatusText = true,
  showSpinner = true
}: BlurredAvatarPreviewProps) {
  
  if (status !== 'pending' && status !== 'processing') {
    return null
  }

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-full h-full',
    large: 'w-full h-full'
  }

  const spinnerSizes = {
    small: 'w-3 h-3',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  const textSizes = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-xs px-2 py-1',
    large: 'text-sm px-3 py-1'
  }

  return (
    <div className={`relative overflow-hidden ${sizeClasses[size]} ${className}`}>
      {/* Background pattern for generating effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-pink-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse" />
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05)_0%,transparent_50%)] animate-pulse" 
          style={{ animationDelay: '1s' }} 
        />
      </div>
      
      {/* Blurred avatar if available */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img 
            src={imageUrl} 
            alt="Avatar Preview" 
            className={`w-full h-full object-cover scale-110 transition-all duration-1000 ${
              size === 'small' ? 'blur-sm opacity-40' : 'blur-lg opacity-40'
            }`}
            onError={(e) => {
              // Hide broken images gracefully
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
        </div>
      )}
      
      {/* Status text */}
      {showStatusText && size !== 'small' && (
        <div className={`absolute ${size === 'large' ? 'bottom-4' : 'bottom-2'} left-1/2 transform -translate-x-1/2 z-20`}>
          <div className="bg-black/50 backdrop-blur-sm rounded-full border border-white/20">
            <span className={`text-white/80 font-medium ${textSizes[size]}`}>
              {status === 'processing' ? 'Generating...' : 'In Queue...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Spinner overlay */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative">
            <div className={`border-2 border-white/60 border-t-white rounded-full animate-spin ${spinnerSizes[size]}`} />
            <div 
              className={`absolute inset-0 border-2 border-transparent border-t-purple-400 rounded-full animate-spin ${spinnerSizes[size]}`}
              style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} 
            />
          </div>
        </div>
      )}
    </div>
  )
}