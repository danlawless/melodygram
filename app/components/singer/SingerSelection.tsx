'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Star, Heart, Zap, Loader2, AlertCircle, Search, Filter } from 'lucide-react'
import { Singer, murekaApiService, SongGenerationResponse } from '../../services/murekaApi'

interface SingerSelectionProps {
  lyrics?: string
  title?: string
  isInlineMode?: boolean
}

export default function SingerSelection({ lyrics, title, isInlineMode = false }: SingerSelectionProps) {
  const [selectedSinger, setSelectedSinger] = useState<string | null>(null)
  const [singers, setSingers] = useState<Singer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationTask, setGenerationTask] = useState<SongGenerationResponse | null>(null)

  // Fetch singers on component mount
  useEffect(() => {
    const fetchSingers = async () => {
      try {
        setLoading(true)
        setError(null)
        const singersData = await murekaApiService.getVocals()
        setSingers(singersData)
      } catch (err) {
        console.error('Error fetching singers:', err)
        setError('Failed to load singers. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchSingers()
  }, [])

  // Filter singers based on search and filters
  const filteredSingers = singers.filter(singer => {
    const matchesSearch = !searchQuery || 
      singer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      singer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      singer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesGender = !genderFilter || singer.gender === genderFilter

    return matchesSearch && matchesGender
  })

  const handleSingerSelect = (singerId: string) => {
    setSelectedSinger(singerId)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleRefresh = () => {
    // Refetch singers
    const fetchSingers = async () => {
      try {
        setLoading(true)
        setError(null)
        const singersData = await murekaApiService.getVocals()
        setSingers(singersData)
      } catch (err) {
        console.error('Error fetching singers:', err)
        setError('Failed to load singers. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchSingers()
  }

  const handleGenerateSong = async () => {
    if (!selectedSinger) return
    
    const selectedSingerData = filteredSingers.find(s => s.id === selectedSinger)
    if (!selectedSingerData) return

    try {
      setIsGenerating(true)
      setError(null)

      const params = {
        lyrics: lyrics || '',
        title: title || 'My Singer Song',
        style: 'pop', // Default style
        mood: 'happy', // Default mood
        duration: 120, // 2 minutes default
        vocal_gender: selectedSingerData.gender || 'female',
        singer_id: selectedSinger
      }

      const response = await murekaApiService.generateSong(params)
      setGenerationTask(response)
      
      // Poll for completion (simplified)
      // In a real app, you'd want to implement proper polling or WebSocket updates
      setTimeout(() => {
        // Simulate completed generation
        setGenerationTask(prev => prev ? { ...prev, status: 'completed', songUrl: '/generated/song.mp3' } : null)
        setIsGenerating(false)
      }, 3000)

    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate song. Please try again.')
      setIsGenerating(false)
    }
  }

  return (
    <div className={isInlineMode ? "bg-bg-secondary rounded-2xl shadow-card" : "min-h-screen bg-bg-primary"}>
      {/* Header */}
      <div className={isInlineMode ? "px-6 py-4 border-b border-border-subtle" : "sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm border-b border-border-subtle"}>
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-text-primary">Pick a Singer</h1>
            <p className="text-sm text-text-secondary">
              {title && `"${title}" • `}{loading ? 'Loading singers...' : `${filteredSingers.length} AI voices available`}
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors touch-target"
          >
            <Filter className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-4 pb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search singers by name, style, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg-secondary rounded-xl border border-border-subtle focus:border-melody-purple focus:ring-2 focus:ring-melody-purple/20 focus:outline-none text-text-primary placeholder-text-secondary"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 flex-wrap">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-2 bg-bg-secondary rounded-lg border border-border-subtle text-text-primary text-sm focus:border-melody-purple focus:outline-none"
              >
                <option value="">All Genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
              
              <button
                onClick={() => {
                  setSearchQuery('')
                  setGenderFilter('')
                }}
                className="px-3 py-2 bg-bg-accent rounded-lg text-text-secondary text-sm hover:bg-melody-purple/20 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-melody-purple" />
            <p className="text-text-secondary">Loading singers from Mureka API...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-text-secondary text-center">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-melody-purple text-white rounded-lg hover:bg-melody-purple/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredSingers.length === 0 && singers.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Search className="w-8 h-8 text-text-secondary" />
            <p className="text-text-secondary text-center">No singers found matching your criteria</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setGenderFilter('')
              }}
              className="px-4 py-2 bg-melody-purple text-white rounded-lg hover:bg-melody-purple/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Singer Cards */}
        {!loading && !error && filteredSingers.length > 0 && (
          <div className="space-y-4 max-w-md mx-auto">
            {filteredSingers.map((singer, index) => (
              <div
                key={singer.id}
                className={`animate-entrance-delay-${Math.min(index + 1, 4)}`}
              >
                <button
                  onClick={() => handleSingerSelect(singer.id)}
                  className={`
                    w-full p-4 rounded-2xl transition-all duration-300 touch-target
                    ${selectedSinger === singer.id
                      ? 'bg-melody-gradient shadow-glow scale-105'
                      : 'bg-bg-secondary hover:bg-bg-accent hover:scale-105 shadow-card'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-melody-gradient flex items-center justify-center text-2xl font-bold text-white">
                        {singer.name[0]}
                      </div>
                      {singer.isPopular && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-melody-pink rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Singer Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary">{singer.name}</h3>
                        <span className="px-2 py-1 rounded-full bg-bg-accent text-xs text-text-secondary">
                          {singer.voiceType}
                        </span>
                        {singer.gender && (
                          <span className="px-2 py-1 rounded-full bg-melody-purple/20 text-xs text-melody-purple capitalize">
                            {singer.gender}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">{singer.description}</p>
                      
                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {singer.specialties.slice(0, 3).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 rounded-full bg-melody-purple/20 text-xs text-melody-purple"
                          >
                            {specialty}
                          </span>
                        ))}
                        {singer.specialties.length > 3 && (
                          <span className="px-2 py-1 rounded-full bg-bg-accent text-xs text-text-secondary">
                            +{singer.specialties.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Rating and Language */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-text-secondary">{singer.rating}</span>
                        </div>
                        {singer.language && (
                          <span className="text-xs text-text-secondary bg-bg-accent px-2 py-1 rounded-full">
                            {singer.language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedSinger === singer.id && (
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-melody-purple"></div>
                      </div>
                    )}
                  </div>

                  {/* Preview URL if available */}
                  {singer.previewUrl && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-2 text-xs text-melody-purple">
                        <Heart className="w-3 h-3" />
                        <span>Preview available</span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className={isInlineMode ? "px-6 py-4 border-t border-border-subtle" : "fixed bottom-20 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-border-subtle"}>
        <div className={isInlineMode ? "" : "px-4 py-4"}>
          <button 
            onClick={handleGenerateSong}
            disabled={isGenerating || !selectedSinger || loading}
            className={`
              w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2
              ${isGenerating || !selectedSinger || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-melody-gradient text-white hover:shadow-glow'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Song...</span>
              </>
            ) : (
              <>
                <span>Generate Song</span>
                <Zap className="w-5 h-5" />
              </>
            )}
          </button>
          
          {/* Generation Status */}
          {generationTask && (
            <div className="mt-3 p-3 bg-bg-secondary rounded-lg">
              <p className="text-sm text-text-secondary">
                Status: <span className="text-melody-purple capitalize">{generationTask.status}</span>
              </p>
              {generationTask.status === 'completed' && generationTask.songUrl && (
                <p className="text-sm text-green-400 mt-1">
                  ✅ Your song is ready!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacing for fixed button */}
      {!isInlineMode && <div className="h-32"></div>}
    </div>
  )
} 