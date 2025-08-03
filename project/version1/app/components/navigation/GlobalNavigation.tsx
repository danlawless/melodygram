'use client'

import React from 'react'
import { Music2, Compass, User } from 'lucide-react'

interface GlobalNavigationProps {
  currentTab: 'create' | 'explore' | 'my'
  onTabChange: (tab: 'create' | 'explore' | 'my') => void
}

export default function GlobalNavigation({ currentTab, onTabChange }: GlobalNavigationProps) {
  const tabs = [
    {
      id: 'create' as const,
      label: 'Create',
      icon: Music2,
      emoji: '🎵'
    },
    {
      id: 'explore' as const,
      label: 'Explore',
      icon: Compass,
      emoji: '🔍'
    },
    {
      id: 'my' as const,
      label: 'My',
      icon: User,
      emoji: '👤'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-border-subtle safe-area-bottom z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-[80px]
                ${isActive 
                  ? 'bg-melody-gradient text-white shadow-glow scale-105' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }
              `}
            >
              <div className="flex items-center justify-center mb-1">
                {isActive ? (
                  <span className="text-lg">{tab.emoji}</span>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
} 