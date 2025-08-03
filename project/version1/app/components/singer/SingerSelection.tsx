'use client'

import React, { useState } from 'react'
import { ArrowLeft, Star, Heart, Zap } from 'lucide-react'

interface Singer {
  id: string
  name: string
  description: string
  imageUrl: string
  voiceType: string
  specialties: string[]
  rating: number
  isPopular?: boolean
}

const singers: Singer[] = [
  {
    id: 'aria',
    name: 'Aria',
    description: 'Ethereal voice perfect for ballads and emotional songs',
    imageUrl: '/avatars/aria.jpg',
    voiceType: 'Soprano',
    specialties: ['Ballads', 'Pop', 'Classical'],
    rating: 4.9,
    isPopular: true
  },
  {
    id: 'jazz',
    name: 'Jazz',
    description: 'Smooth and soulful, brings warmth to every note',
    imageUrl: '/avatars/jazz.jpg', 
    voiceType: 'Alto',
    specialties: ['Jazz', 'Blues', 'R&B'],
    rating: 4.8
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Powerful and energetic voice for high-energy songs',
    imageUrl: '/avatars/rock.jpg',
    voiceType: 'Tenor',
    specialties: ['Rock', 'Pop', 'Alternative'],
    rating: 4.7
  },
  {
    id: 'harmony',
    name: 'Harmony',
    description: 'Gentle and melodic, perfect for indie and acoustic',
    imageUrl: '/avatars/harmony.jpg',
    voiceType: 'Mezzo-soprano',
    specialties: ['Indie', 'Acoustic', 'Folk'],
    rating: 4.8,
    isPopular: true
  }
]

interface SingerSelectionProps {
  onBack: () => void
}

export default function SingerSelection({ onBack }: SingerSelectionProps) {
  const [selectedSinger, setSelectedSinger] = useState<string | null>(null)

  const handleSingerSelect = (singerId: string) => {
    setSelectedSinger(singerId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary">Choose Your Singer</h1>
            <p className="text-sm text-text-secondary">Select an AI voice that matches your style</p>
          </div>
          
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Singer Cards */}
      <div className="px-4 py-6 space-y-4 max-w-md mx-auto">
        {singers.map((singer, index) => (
          <div
            key={singer.id}
            className={`animate-entrance-delay-${index + 1}`}
          >
            <button
              onClick={() => handleSingerSelect(singer.id)}
              className={`
                w-full p-4 rounded-2xl transition-all duration-300 touch-target
                ${selectedSinger === singer.id
                  ? 'bg-melody-gradient shadow-glow scale-105'
                  : 'bg-bg-secondary hover:bg-bg-accent hover:scale-105 shadow-card'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-melody-gradient flex items-center justify-center text-2xl font-bold text-white">
                    {singer.name[0]}
                  </div>
                  {singer.isPopular && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-melody-pink rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Singer Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary">{singer.name}</h3>
                    <span className="px-2 py-1 rounded-full bg-bg-accent text-xs text-text-secondary">
                      {singer.voiceType}
                    </span>
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-2">{singer.description}</p>
                  
                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {singer.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 rounded-full bg-melody-purple/20 text-xs text-melody-purple"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-text-secondary">{singer.rating}</span>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedSinger === singer.id && (
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-melody-purple"></div>
                  </div>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      {selectedSinger && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-border-subtle safe-area-bottom">
          <div className="px-4 py-6">
            <button className="btn-primary w-full">
              <span>Continue with {singers.find(s => s.id === selectedSinger)?.name}</span>
              <Zap className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Spacing for fixed button */}
      {selectedSinger && <div className="h-24"></div>}
    </div>
  )
} 