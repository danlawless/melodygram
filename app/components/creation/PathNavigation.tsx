'use client'

import React, { useState } from 'react'
import { Mic, Music, Wand2 } from 'lucide-react'

interface NavigationPath {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  emoji: string
}

const navigationPaths: NavigationPath[] = [
  {
    id: 'singer',
    icon: <Mic className="w-6 h-6" />,
    label: 'Singer',
    description: 'Choose AI vocalist',
    emoji: '🎤'
  },
  {
    id: 'custom',
    icon: <Wand2 className="w-6 h-6" />,
    label: 'Custom',
    description: 'Reference tracks & styles',
    emoji: '🎵'
  },
  {
    id: 'music',
    icon: <Music className="w-6 h-6" />,
    label: 'Music',
    description: 'Browse music library',
    emoji: '🎶'
  }
]

interface PathNavigationProps {
  onNavigate: (screen: 'singer' | 'custom' | 'music') => void
  isFormValid: boolean
  validationMessage?: string
}

export default function PathNavigation({ onNavigate, isFormValid, validationMessage }: PathNavigationProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const handlePathSelect = (pathId: string) => {
    if (!isFormValid) {
      // Add error haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]) // Error pattern
      }
      return
    }

    setSelectedPath(pathId)
    
    // Add success haptic feedback for mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    // Navigate to the selected screen
    onNavigate(pathId as 'singer' | 'custom' | 'music')
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-text-primary">Choose Your Path</h3>
        <p className="text-text-secondary">
          {isFormValid 
            ? 'Select how you want to create your melody' 
            : 'Complete all fields above to continue'
          }
        </p>
        {!isFormValid && validationMessage && (
          <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl">
            <p className="text-amber-600 text-sm font-medium">{validationMessage}</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center items-center gap-8">
        {navigationPaths.map((path, index) => (
          <div key={path.id} className={`animate-entrance-delay-${index + 1}`}>
            <button
              onClick={() => handlePathSelect(path.id)}
              disabled={!isFormValid}
              className={`
                group relative flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-300 touch-target
                ${!isFormValid
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : selectedPath === path.id
                    ? 'bg-melody-gradient shadow-glow scale-105'
                    : 'bg-bg-secondary hover:bg-bg-accent hover:scale-105 shadow-card'
                }
              `}
            >
              {/* Icon Circle */}
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                ${!isFormValid
                  ? 'bg-gray-500 text-gray-300'
                  : selectedPath === path.id
                    ? 'bg-white/20 text-white'
                    : 'bg-melody-gradient text-white group-hover:scale-110'
                }
              `}>
                {path.icon}
              </div>
              
              {/* Label */}
              <div className="text-center space-y-1">
                <div className={`
                  text-lg font-semibold transition-colors
                  ${!isFormValid
                    ? 'text-gray-400'
                    : selectedPath === path.id 
                      ? 'text-white' 
                      : 'text-text-primary'
                  }
                `}>
                  {path.emoji} {path.label}
                </div>
                <div className={`
                  text-xs transition-colors
                  ${!isFormValid
                    ? 'text-gray-500'
                    : selectedPath === path.id 
                      ? 'text-white/80' 
                      : 'text-text-muted'
                  }
                `}>
                  {path.description}
                </div>
              </div>

              {/* Selection indicator */}
              {selectedPath === path.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-melody-purple rounded-full"></div>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      {selectedPath && (
        <div className="animate-slide-up flex justify-center pt-4">
          <button className="btn-primary px-8 py-3 text-lg font-semibold">
            Continue to {navigationPaths.find(p => p.id === selectedPath)?.label}
          </button>
        </div>
      )}
    </div>
  )
} 