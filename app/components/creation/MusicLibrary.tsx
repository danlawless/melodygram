'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Pause, Music, Upload, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react'
import { murekaApiService, ReferenceTrack } from '../../services/murekaApi'
import TipButton from '../ui/TipButton'

interface MusicLibraryProps {
  lyrics?: string
  title?: string
  onGenerate?: (selectedTrack?: ReferenceTrack) => void
  isInlineMode?: boolean
}

type LibraryTab = 'Library' | 'Used' | 'Mine'

export default function MusicLibrary({ lyrics, title, onGenerate, isInlineMode = false }: MusicLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State management
  const [activeTab, setActiveTab] = useState<LibraryTab>('Library')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [tracks, setTracks] = useState<ReferenceTrack[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [moods, setMoods] = useState<string[]>([])
  const [selectedTrack, setSelectedTrack] = useState<ReferenceTrack | null>(null)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  
  // API states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      const data = await murekaApiService.getReferenceTracksAndGenres()
      setTracks(data.referenceTracks)
      setGenres(data.genres)
      setMoods(data.moods)
    } catch (err) {
      console.error('Error loading reference data:', err)
      setError('Failed to load reference tracks from Mureka API. Please try again.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadReferenceData(true)
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('audio/')) {
      setUploadError('Please select an audio file.')
      return
    }

    // Check file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      
      const response = await murekaApiService.uploadReferenceTrack(file)
      
      // Create a new reference track from uploaded file
      const newTrack: ReferenceTrack = {
        id: `uploaded-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        genre: 'Uploaded',
        mood: 'Custom',
        duration: 180, // Default duration, would be determined by API in real implementation
        description: `User uploaded track: ${file.name}`,
        previewUrl: URL.createObjectURL(file),
        isPopular: false
      }
      
      // Add to tracks list
      setTracks(prev => [newTrack, ...prev])
      
      // Switch to "Mine" tab to show the uploaded track
      setActiveTab('Mine')
      
    } catch (err) {
      console.error('Error uploading reference track:', err)
      setUploadError('Failed to upload reference track. Please try again.')
    } finally {
      setIsUploading(false)
      // Clear the input
      event.target.value = ''
    }
  }

  const filteredTracks = tracks.filter(track => {
    // Tab filtering
    if (activeTab === 'Mine' && !track.id.startsWith('uploaded-')) return false
    if (activeTab === 'Used' && !track.isPopular) return false
    if (activeTab === 'Library' && track.id.startsWith('uploaded-')) return false
    
    // Genre and mood filtering
    const matchesGenre = !selectedGenre || track.genre === selectedGenre
    const matchesMood = !selectedMood || track.mood === selectedMood
    return matchesGenre && matchesMood
  })

  const handlePlayPause = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null)
    } else {
      setPlayingTrack(trackId)
      // In a real app, you'd start playing the audio here
    }
  }

  const handleUseTrack = (track: ReferenceTrack) => {
    setSelectedTrack(track)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(selectedTrack || undefined)
    }
  }

  const clearUploadError = () => {
    setUploadError(null)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className={isInlineMode ? "bg-bg-secondary rounded-2xl shadow-card p-12" : "min-h-screen bg-bg-primary"}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-melody-purple" />
          <p className="text-text-secondary">Loading reference tracks from Mureka API...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isInlineMode ? "bg-bg-secondary rounded-2xl shadow-card pb-6" : "min-h-screen bg-bg-primary pb-24"}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Header */}
      <div className={isInlineMode ? "px-6 py-4 border-b border-border-subtle" : "sticky top-0 z-10 bg-bg-primary border-b border-border-subtle"}>
        <div className="flex flex-col items-center p-4">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-text-primary">Sync Music</h1>
                <TipButton
                  title="Reference Track Selection"
                  content="Choose a reference track that matches the style, tempo, or mood you want for your song. The AI will use this as inspiration for the musical arrangement and production style."
                  position="bottom"
                />
              </div>
              <p className="text-sm text-text-secondary">
                {title && `"${title}" • `}Choose a reference track ({filteredTracks.length} available)
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors touch-target"
                title="Upload reference track"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-text-primary" />
                ) : (
                  <Upload className="w-5 h-5 text-text-primary" />
                )}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors touch-target"
                title="Refresh tracks"
              >
                <RefreshCw className={`w-5 h-5 text-text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex justify-center">
            <div className="flex space-x-8">
            {(['Library', 'Used', 'Mine'] as LibraryTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-lg font-medium pb-2 transition-colors ${
                  activeTab === tab
                    ? 'text-text-primary border-b-2 border-melody-purple'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab}
                {tab === 'Mine' && tracks.filter(t => t.id.startsWith('uploaded-')).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-melody-purple text-white rounded-full">
                    {tracks.filter(t => t.id.startsWith('uploaded-')).length}
                  </span>
                )}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Error States */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {uploadError && (
          <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{uploadError}</p>
              </div>
              <button
                onClick={clearUploadError}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {isRefreshing && (
          <div className="mx-4 mb-2 p-3 bg-melody-purple/20 border border-melody-purple/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-melody-purple" />
              <p className="text-melody-purple text-sm">Refreshing tracks from Mureka API...</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 py-4 space-y-4">
        {/* Genre Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">Genre</span>
            <span className="text-xs text-text-muted">({genres.length} available)</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !selectedGenre
                  ? 'bg-melody-purple text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-accent'
              }`}
            >
              All
            </button>
            {genres.slice(0, 4).map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-melody-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-accent'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">Mood</span>
            <span className="text-xs text-text-muted">({moods.length} available)</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedMood('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !selectedMood
                  ? 'bg-melody-purple text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-accent'
              }`}
            >
              All
            </button>
            {moods.slice(0, 3).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedMood === mood
                    ? 'bg-melody-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-accent'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTracks.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Music className="w-12 h-12 text-text-secondary" />
          <p className="text-text-secondary text-center">
            {activeTab === 'Mine' 
              ? 'No uploaded tracks yet. Upload your first reference track!' 
              : 'No tracks found matching your filters.'}
          </p>
          {activeTab === 'Mine' && (
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-melody-purple text-white rounded-lg hover:bg-melody-purple/90 transition-colors"
            >
              Upload Track
            </button>
          )}
        </div>
      )}

      {/* Song List */}
      <div className="px-4 pb-32 space-y-3">
        {filteredTracks.map((track) => (
          <div
            key={track.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              selectedTrack?.id === track.id
                ? 'border-melody-purple bg-melody-purple/5 shadow-glow'
                : 'border-border-subtle bg-bg-secondary hover:bg-bg-accent'
            }`}
          >
            {/* Play Button */}
            <button
              onClick={() => handlePlayPause(track.id)}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-bg-primary border border-border-subtle flex items-center justify-center hover:bg-melody-purple hover:text-white transition-colors"
            >
              {playingTrack === track.id ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary truncate">{track.title}</h3>
                {track.id.startsWith('uploaded-') && (
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                    Uploaded
                  </span>
                )}
                {track.isPopular && (
                  <span className="px-2 py-0.5 text-xs bg-melody-purple/20 text-melody-purple rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                <span>{formatDuration(track.duration)}</span>
                <span>•</span>
                <span>Mureka AI</span>
              </div>
              <p className="text-xs text-text-muted mb-2 line-clamp-1">{track.description}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-bg-primary text-xs text-text-muted">
                  {track.genre}
                </span>
                <span className="px-2 py-1 rounded-md bg-bg-primary text-xs text-text-muted">
                  {track.mood}
                </span>
              </div>
            </div>

            {/* Use Button */}
            <button
              onClick={() => handleUseTrack(track)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTrack?.id === track.id
                  ? 'bg-melody-purple text-white ring-2 ring-melody-purple/50'
                  : 'bg-bg-primary border border-border-subtle text-text-secondary hover:bg-melody-purple hover:text-white'
              }`}
            >
              {selectedTrack?.id === track.id ? 'Selected' : 'Use'}
            </button>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div className={isInlineMode ? "px-6 py-4 border-t border-border-subtle" : "fixed bottom-20 left-0 right-0 p-4 bg-bg-primary border-t border-border-subtle"}>
        <button
          onClick={handleGenerate}
          disabled={!selectedTrack}
          className={`
            w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2
            ${!selectedTrack
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-melody-gradient text-white hover:shadow-glow'
            }
          `}
        >
          <Music className="w-5 h-5" />
          Generate Song
          {selectedTrack && (
            <span className="text-sm opacity-80">
              • Using "{selectedTrack.title}"
            </span>
          )}
        </button>
      </div>
    </div>
  )
} 