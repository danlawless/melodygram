'use client'

import React from 'react'
import { User, Music, Download, Share2, Play, MoreVertical } from 'lucide-react'

export default function MyScreen() {
  // Mock data for user's songs
  const mySongs = [
    {
      id: '1',
      title: 'My First Song',
      createdAt: '2 days ago',
      genre: 'Pop',
      mood: 'Happy',
      duration: '2:45',
      status: 'completed',
      plays: 24
    },
    {
      id: '2',
      title: 'Acoustic Dreams', 
      createdAt: '1 week ago',
      genre: 'Folk',
      mood: 'Calm',
      duration: '3:12',
      status: 'completed',
      plays: 87
    },
    {
      id: '3',
      title: 'Beat Drop',
      createdAt: '2 weeks ago', 
      genre: 'Electronic',
      mood: 'Energetic',
      duration: '3:08',
      status: 'generating',
      plays: 0
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'generating': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-text-secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '✅ Ready'
      case 'generating': return '⏳ Generating...'
      case 'failed': return '❌ Failed'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-melody-purple" />
            <h1 className="text-2xl font-bold text-text-primary">My Creations</h1>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-bg-secondary rounded-xl">
              <div className="text-2xl font-bold text-melody-purple">{mySongs.length}</div>
              <div className="text-xs text-text-secondary">Songs</div>
            </div>
            <div className="text-center p-3 bg-bg-secondary rounded-xl">
              <div className="text-2xl font-bold text-melody-purple">
                {mySongs.reduce((total, song) => total + song.plays, 0)}
              </div>
              <div className="text-xs text-text-secondary">Total Plays</div>
            </div>
            <div className="text-center p-3 bg-bg-secondary rounded-xl">
              <div className="text-2xl font-bold text-melody-purple">
                {mySongs.filter(song => song.status === 'completed').length}
              </div>
              <div className="text-xs text-text-secondary">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {mySongs.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-text-primary">No Songs Yet</h3>
            <p className="text-text-secondary">
              Start creating your first song!<br/>
              Tap the Create tab to get started.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-text-primary">Recent Songs</h2>
            
            <div className="space-y-3">
              {mySongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-bg-secondary rounded-xl p-4 hover:bg-bg-accent transition-all duration-300 shadow-card hover:shadow-glow"
                >
                  <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <button 
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${song.status === 'completed' 
                          ? 'bg-melody-gradient text-white hover:scale-105' 
                          : 'bg-bg-accent text-text-secondary cursor-not-allowed'
                        }
                      `}
                      disabled={song.status !== 'completed'}
                    >
                      {song.status === 'completed' ? (
                        <Play className="w-5 h-5 ml-1" />
                      ) : (
                        <Music className="w-5 h-5" />
                      )}
                    </button>

                    {/* Song Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{song.title}</h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-melody-purple/20 text-melody-purple">
                          {song.genre}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-bg-accent text-text-secondary">
                          {song.mood}
                        </span>
                        <span className="text-xs text-text-muted">{song.duration}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">{song.createdAt}</span>
                        <span className={`text-xs ${getStatusColor(song.status)}`}>
                          {getStatusText(song.status)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {song.status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full bg-bg-accent hover:bg-melody-purple/20 transition-colors">
                          <Download className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button className="p-2 rounded-full bg-bg-accent hover:bg-melody-purple/20 transition-colors">
                          <Share2 className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button className="p-2 rounded-full bg-bg-accent hover:bg-melody-purple/20 transition-colors">
                          <MoreVertical className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {song.plays > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span>{song.plays} plays</span>
                        <span>Created {song.createdAt}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 