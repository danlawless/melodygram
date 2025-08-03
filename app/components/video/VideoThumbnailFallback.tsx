'use client'

import React from 'react'
import { Play, Film } from 'lucide-react'

interface VideoThumbnailFallbackProps {
  title: string
  className?: string
  onPlay: () => void
  status?: string
}

export default function VideoThumbnailFallback({ 
  title, 
  className = '', 
  onPlay,
  status = 'completed'
}: VideoThumbnailFallbackProps) {
  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={onPlay}>
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-blue-500/30 flex items-center justify-center">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">{title}</h4>
          <p className="text-white/60 text-xs">
            {status === 'completed' ? 'Ready to play' : 'Processing...'}
          </p>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
} 