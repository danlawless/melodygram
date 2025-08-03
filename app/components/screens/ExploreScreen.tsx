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
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-6 h-6 text-melody-purple" />
            <h1 className="text-2xl font-bold text-text-primary">Explore</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search songs, artists, genres..."
              className="w-full pl-10 pr-4 py-3 bg-bg-secondary rounded-xl border border-border-subtle focus:border-melody-purple focus:ring-2 focus:ring-melody-purple/20 focus:outline-none text-text-primary placeholder-text-secondary"
            />
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