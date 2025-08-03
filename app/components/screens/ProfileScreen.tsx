'use client'

import React, { useState } from 'react'
import { User, ArrowLeft, Save } from 'lucide-react'

interface ProfileScreenProps {
  onBack: () => void
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [name, setName] = useState('Music Creator')
  const [email, setEmail] = useState('creator@melodygram.com')
  const [bio, setBio] = useState('Creating amazing music with AI')

  const handleSave = () => {
    // TODO: Implement profile saving
    console.log('Saving profile:', { name, email, bio })
    alert('Profile saved! 💾')
    onBack()
  }

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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <p className="text-gray-400">Manage your account settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Profile Picture */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-melody-gradient flex items-center justify-center mx-auto shadow-glow">
            <User className="w-12 h-12 text-white" />
          </div>
          <button className="text-melody-purple hover:text-melody-pink transition-colors text-sm font-medium">
            Change Avatar
          </button>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
            placeholder="Enter your display name"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
            placeholder="Enter your email"
          />
        </div>

        {/* Bio Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors resize-none"
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-melody-gradient text-white font-semibold py-4 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-glow flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>

        {/* Account Stats */}
        <div className="mt-8 p-4 bg-bg-secondary/50 rounded-xl border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Account Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-melody-purple">12</div>
              <div className="text-sm text-text-secondary">Videos Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-melody-pink">5</div>
              <div className="text-sm text-text-secondary">Days Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 