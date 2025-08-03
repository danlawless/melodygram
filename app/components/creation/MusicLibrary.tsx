'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Music } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<LibraryTab>('Library')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [tracks, setTracks] = useState<ReferenceTrack[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [moods, setMoods] = useState<string[]>([])
  const [selectedTrack, setSelectedTrack] = useState<ReferenceTrack | null>(null)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      const data = await murekaApiService.getReferenceTracksAndGenres()
      setTracks(data.referenceTracks)
      setGenres(data.genres)
      setMoods(data.moods)
    } catch (error) {
      console.error('Error loading reference data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTracks = tracks.filter(track => {
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
  }

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(selectedTrack || undefined)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-melody-purple"></div>
      </div>
    )
  }

  return (
    <div className={isInlineMode ? "bg-bg-secondary rounded-2xl shadow-card pb-6" : "min-h-screen bg-bg-primary pb-24"}>
      {/* Header */}
      <div className={isInlineMode ? "px-6 py-4 border-b border-border-subtle" : "sticky top-0 z-10 bg-bg-primary border-b border-border-subtle"}>
        <div className="flex flex-col items-center p-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-primary">Sync Music</h1>
              <TipButton
                title="Reference Track Selection"
                content="Choose a reference track that matches the style, tempo, or mood you want for your song. The AI will use this as inspiration for the musical arrangement and production style."
                position="bottom"
              />
            </div>
            <p className="text-sm text-text-secondary">
              {title && `"${title}" • `}Choose a reference track
            </p>
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
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 space-y-4">
        {/* Genre Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">Genre</span>
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

      {/* Song List */}
      <div className="px-4 pb-32 space-y-3">
        {filteredTracks.map((track) => (
          <div
            key={track.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              selectedTrack?.id === track.id
                ? 'border-melody-purple bg-melody-purple/5'
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
              <h3 className="font-semibold text-text-primary truncate">{track.title}</h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>{formatDuration(track.duration)}</span>
                <span>•</span>
                <span>re3kkk</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
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
                  ? 'bg-melody-purple text-white'
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
        </button>
      </div>
    </div>
  )
} 