'use client'

import React from 'react'
import { Music2, User } from 'lucide-react'

interface GlobalNavigationProps {
  currentTab: 'create' | 'my'
  onTabChange: (tab: 'create' | 'my') => void
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
      id: 'my' as const,
      label: 'My Videos',
      icon: User,
      emoji: '📱'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-border-subtle safe-area-bottom z-50">
      <div className="flex items-center justify-center gap-6 px-6 py-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center px-12 py-3 rounded-2xl transition-all duration-300 min-w-[180px] min-h-[60px]
                ${isActive 
                  ? 'bg-melody-gradient text-white shadow-glow shadow-melody-purple/40 scale-105 transform' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:scale-102 bg-bg-accent/50'
                }
              `}
            >
              <div className="flex items-center justify-center mb-2">
                {isActive ? (
                  <span className="text-2xl">{tab.emoji}</span>
                ) : (
                  <Icon className="w-7 h-7" />
                )}
              </div>
              <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
} 