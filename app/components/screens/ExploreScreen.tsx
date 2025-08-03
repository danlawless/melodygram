'use client'

import React from 'react'
import { Compass, Search, Heart, Play, Star, TrendingUp } from 'lucide-react'

export default function ExploreScreen() {
  // Mock data for featured songs
  const featuredSongs = [
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'SonicUser123',
      genre: 'Electronic',
      mood: 'Dreamy',
      plays: 2400,
      likes: 180,
      duration: '3:24',
      isPopular: true
    },
    {
      id: '2', 
      title: 'Summer Vibes',
      artist: 'MelodyMaker',
      genre: 'Pop',
      mood: 'Happy',
      plays: 1800,
      likes: 92,
      duration: '2:56',
      isPopular: false
    },
    {
      id: '3',
      title: 'Urban Nights',
      artist: 'BeatCreator',
      genre: 'Hip-Hop',
      mood: 'Energetic', 
      plays: 3200,
      likes: 256,
      duration: '3:12',
      isPopular: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Elegant Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="p-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Explore</h1>
                <p className="text-gray-400">Discover amazing AI-generated music</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">1.2K</div>
              <div className="text-sm text-blue-300">Songs</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">350</div>
              <div className="text-sm text-green-300">Artists</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">24</div>
              <div className="text-sm text-purple-300">Genres</div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search songs, artists, genres..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Trending Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-melody-purple" />
            <h2 className="text-xl font-semibold text-text-primary">Trending Now</h2>
          </div>
          
          <div className="space-y-3">
            {featuredSongs.map((song) => (
              <div
                key={song.id}
                className="bg-bg-secondary rounded-xl p-4 hover:bg-bg-accent transition-all duration-300 shadow-card hover:shadow-glow"
              >
                <div className="flex items-center gap-4">
                  {/* Play Button */}
                  <button className="w-12 h-12 rounded-full bg-melody-gradient flex items-center justify-center text-white hover:scale-105 transition-transform">
                    <Play className="w-5 h-5 ml-1" />
                  </button>

                  {/* Song Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary">{song.title}</h3>
                      {song.isPopular && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    
                    <p className="text-sm text-text-secondary mb-2">by {song.artist}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-melody-purple/20 text-melody-purple">
                        {song.genre}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-bg-accent text-text-secondary">
                        {song.mood}
                      </span>
                      <span className="text-xs text-text-muted">{song.duration}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-text-secondary text-xs mb-1">
                      <Heart className="w-3 h-3" />
                      <span>{song.likes}</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {song.plays.toLocaleString()} plays
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-text-primary">More Features Coming Soon</h3>
          <p className="text-text-secondary">
            Discover amazing songs created by the community.<br/>
            Like, share, and get inspired by other creators.
          </p>
        </div>
      </div>
    </div>
  )
} 