'use client'

import React, { useState } from 'react'
import { Settings, ArrowLeft, Bell, Volume2, Shield, HelpCircle } from 'lucide-react'

interface SettingsScreenProps {
  onBack: () => void
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400">Customize your app experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        
        {/* App Preferences */}
        <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-melody-purple" />
            App Preferences
          </h3>
          
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-secondary" />
              <div>
                <div className="text-text-primary font-medium">Push Notifications</div>
                <div className="text-sm text-text-secondary">Get notified about video completions</div>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-melody-purple' : 'bg-bg-accent'
              }`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-text-secondary" />
              <div>
                <div className="text-text-primary font-medium">Sound Effects</div>
                <div className="text-sm text-text-secondary">Enable UI sound feedback</div>
              </div>
            </div>
            <button
              onClick={() => setSoundEffects(!soundEffects)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEffects ? 'bg-melody-purple' : 'bg-bg-accent'
              }`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                soundEffects ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-text-secondary" />
              <div>
                <div className="text-text-primary font-medium">Auto Save</div>
                <div className="text-sm text-text-secondary">Automatically save your progress</div>
              </div>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoSave ? 'bg-melody-purple' : 'bg-bg-accent'
              }`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                autoSave ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-melody-purple" />
            Support & Info
          </h3>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-bg-accent rounded-lg transition-colors">
              <div className="text-text-primary font-medium">Help Center</div>
              <div className="text-sm text-text-secondary">Get help and tutorials</div>
            </button>
            
            <button className="w-full text-left p-3 hover:bg-bg-accent rounded-lg transition-colors">
              <div className="text-text-primary font-medium">Privacy Policy</div>
              <div className="text-sm text-text-secondary">Learn about data protection</div>
            </button>
            
            <button className="w-full text-left p-3 hover:bg-bg-accent rounded-lg transition-colors">
              <div className="text-text-primary font-medium">Terms of Service</div>
              <div className="text-sm text-text-secondary">View terms and conditions</div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-4 text-center">
          <div className="text-melody-purple text-lg font-bold mb-1">MelodyGram</div>
          <div className="text-text-secondary text-sm">Version 1.0.0</div>
          <div className="text-text-secondary text-xs mt-2">Made with ❤️ for music creators</div>
        </div>

      </div>
    </div>
  )
} 