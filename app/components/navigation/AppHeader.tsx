'use client'

import React, { useState } from 'react'
import { Settings, User, ChevronDown } from 'lucide-react'

interface AppHeaderProps {
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export default function AppHeader({ onProfileClick, onSettingsClick }: AppHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown)
  }

  const handleSettingsClick = () => {
    setShowDropdown(false)
    onSettingsClick?.()
  }

  const handleProfileMenuClick = () => {
    setShowDropdown(false)
    onProfileClick?.()
  }

  return (
    <div className="bg-bg-primary border-b border-border-subtle">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-melody-gradient flex items-center justify-center shadow-glow">
            <span className="text-white text-lg font-bold">M</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">MelodyGram</h1>
          </div>
        </div>

        {/* Profile/Settings Button */}
        <div className="relative">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary hover:bg-bg-accent transition-colors duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-melody-gradient flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border-subtle rounded-xl shadow-xl py-2 animate-fade-in">
              <button
                onClick={handleProfileMenuClick}
                className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-accent transition-colors duration-150 flex items-center gap-3"
              >
                <User className="w-4 h-4 text-text-secondary" />
                <span>Edit Profile</span>
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-accent transition-colors duration-150 flex items-center gap-3"
              >
                <Settings className="w-4 h-4 text-text-secondary" />
                <span>Settings</span>
              </button>
              
              <div className="border-t border-border-subtle my-2"></div>
              
              <button className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors duration-150 flex items-center gap-3">
                <span className="w-4 h-4 text-center">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
} 