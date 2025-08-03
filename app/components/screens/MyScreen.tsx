'use client'

import React, { useState, useEffect } from 'react'
import { User, Music, Download, Share2, Play, MoreVertical, ExternalLink, Eye, DollarSign, Search, Filter, Grid, List, Calendar, Clock, Video } from 'lucide-react'
import { songStorageService, SavedSong } from '../../services/songStorage'
import VideoPlayer from '../player/VideoPlayer'
import MiniVideoPlayer from '../player/MiniVideoPlayer'
import VideoThumbnail from '../video/VideoThumbnail'

export default function MyScreen() {
  const [mySongs, setMySongs] = useState<SavedSong[]>([])
  const [loading, setLoading] = useState(true)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  
  // Video Player State
  const [currentVideo, setCurrentVideo] = useState<{
    url: string
    title: string
    jobId: string
  } | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)

  // Load jobs from LemonSlice API
  const loadJobsFromAPI = async () => {
    try {
      setLoadingJobs(true)
      const response = await fetch('/api/lemonslice/jobs?limit=50')
      const data = await response.json()
      
      if (data._success && data.jobs) {
        setAllJobs(data.jobs)
        console.log('📋 Loaded jobs from API:', data.jobs.length)
      }
    } catch (error) {
      console.error('Error loading jobs from API:', error)
    } finally {
      setLoadingJobs(false)
    }
  }

  // Load songs from storage
  useEffect(() => {
    const loadSongs = () => {
      try {
        const songs = songStorageService.getSongs()
        setMySongs(songs)
      } catch (error) {
        console.error('Error loading songs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSongs()
    loadJobsFromAPI() // Also load API jobs

    // Refresh every 10 seconds to catch updates from ongoing generations
    const interval = setInterval(() => {
      loadSongs()
      loadJobsFromAPI()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handlePlaySong = (songId: string) => {
    // Increment play count
    songStorageService.incrementPlayCount(songId)
    // Refresh the display
    setMySongs(songStorageService.getSongs())
    
    // Here you would actually play the song/video
    const song = mySongs.find(s => s.id === songId)
    if (song?.videoUrl) {
      // Open video in new tab or modal
      window.open(song.videoUrl, '_blank')
    }
  }

  const handleViewVideo = (videoUrl: string, jobId: string, songTitle?: string) => {
    if (videoUrl) {
      setCurrentVideo({
        url: videoUrl,
        title: songTitle || `Avatar Video`,
        jobId: jobId
      })
      setIsPlayerOpen(true)
      setShowMiniPlayer(false) // Hide mini player when opening full player
    }
  }

  const handleClosePlayer = () => {
    setIsPlayerOpen(false)
    // Keep video active but show mini player instead
    if (currentVideo) {
      setShowMiniPlayer(true)
    }
  }

  const handleExpandPlayer = () => {
    setShowMiniPlayer(false)
    setIsPlayerOpen(true)
  }

  const handleCloseMiniPlayer = () => {
    setShowMiniPlayer(false)
    setCurrentVideo(null)
  }

  const handleDownloadVideo = (videoUrl: string, title: string) => {
    if (videoUrl) {
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShareVideo = (videoUrl: string, jobId: string) => {
    if (navigator.share) {
      navigator.share({
        title: `MelodyGram Avatar Video`,
        text: 'Check out my AI-generated avatar video!',
        url: videoUrl
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(videoUrl)
      alert('Video URL copied to clipboard!')
    }
  }

  // Enhanced video data with song titles
  const getEnhancedVideoData = () => {
    return allJobs.map(job => {
      // Try to find matching song by task ID
      const matchingSong = mySongs.find(song => song.taskId === job.job_id)
      
      return {
        ...job,
        songTitle: matchingSong?.title || null,
        originalSong: matchingSong || null
      }
    })
  }

  // Filter and sort videos
  const getFilteredAndSortedVideos = () => {
    const enhancedVideos = getEnhancedVideoData()
    
    let filtered = enhancedVideos.filter(job => {
      // Status filter
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'completed' && job.status === 'completed') ||
        (filterStatus === 'processing' && (job.status === 'processing' || job.status === 'pending'))
      
      // Search filter (now includes song titles)
      const searchMatch = searchTerm === '' || 
        job.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.songTitle && job.songTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return statusMatch && searchMatch
    })

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }

  const formatCreatedAt = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const formatDuration = (duration?: number): string => {
    if (!duration) return '0:00'
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

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

  const filteredVideos = getFilteredAndSortedVideos()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Elegant Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="p-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Creations</h1>
                <p className="text-gray-400">Your AI-generated avatar collection</p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {allJobs.filter(job => job.status === 'completed').length}
              </div>
              <div className="text-sm text-green-300">Completed Videos</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {allJobs.filter(job => job.status === 'processing' || job.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-300">Processing</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{allJobs.length}</div>
              <div className="text-sm text-blue-300">Total Generated</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or job ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900 [&>option]:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-900 [&>option]:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video Gallery */}
      <div className="px-6 py-8">
        {loadingJobs && allJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Video className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Loading Your Videos...</h3>
            <p className="text-gray-400">Fetching your AI-generated avatar collection</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Videos Yet</h3>
            <p className="text-gray-400 mb-6">
              Start creating your first AI avatar video!<br/>
              Go to Create tab to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {filteredVideos.length} Video{filteredVideos.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-gray-400">
                  {searchTerm && `Showing results for "${searchTerm}"`}
                  {filterStatus !== 'all' && ` • ${filterStatus} only`}
                </p>
              </div>
              
              {loadingJobs && (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>

            {/* Video Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((job) => (
                  <div
                    key={job.job_id}
                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  >
                    {/* Video Preview */}
                    <div className="relative aspect-square">
                      {job.status === 'completed' && job.video_url ? (
                        <VideoThumbnail
                          videoUrl={job.video_url}
                          title={job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}
                          className="w-full h-full"
                          onPlay={() => handleViewVideo(job.video_url, job.job_id, job.songTitle)}
                        />
                      ) : (
                        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          job.status === 'completed' 
                            ? 'bg-green-500/90 text-white border border-green-500/30' 
                            : job.status === 'processing'
                            ? 'bg-yellow-500/90 text-white border border-yellow-500/30'
                            : 'bg-gray-500/90 text-white border border-gray-500/30'
                        }`}>
                          {job.status === 'completed' ? '✅ Ready' : job.status === 'processing' ? '⏳ Processing' : '⏸️ Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2" title={job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}>
                        {job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}
                      </h3>
                      {job.songTitle && (
                        <p className="text-xs text-gray-400 mb-2">
                          Job #{job.job_id.substring(0, 8)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{formatCreatedAt(job.created_at)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {job.status === 'completed' && job.video_url && (
                          <>
                            <button
                              onClick={() => handleViewVideo(job.video_url, job.job_id, job.songTitle)}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Watch
                            </button>
                            <button
                              onClick={() => handleDownloadVideo(job.video_url, `avatar_${job.job_id}`)}
                              className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-all"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareVideo(job.video_url, job.job_id)}
                              className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-all"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {job.status === 'processing' && (
                          <div className="flex-1 bg-yellow-500/20 border border-yellow-500/30 px-3 py-2 rounded-lg text-yellow-400 text-sm font-medium text-center">
                            Processing...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredVideos.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0">
                        {job.status === 'completed' && job.video_url ? (
                          <VideoThumbnail
                            videoUrl={job.video_url}
                            title={job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}
                            className="w-full h-full"
                            onPlay={() => handleViewVideo(job.video_url, job.job_id, job.songTitle)}
                            showPlayButton={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white/60" />
                          </div>
                        )}
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={() => job.status === 'completed' ? handleViewVideo(job.video_url, job.job_id, job.songTitle) : undefined}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          job.status === 'completed'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg'
                            : 'bg-white/10 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={job.status !== 'completed'}
                      >
                        <Play className="w-5 h-5 ml-1" />
                      </button>

                      {/* Video Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1" title={job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}>
                          {job.songTitle || `Avatar #${job.job_id.substring(0, 8)}`}
                        </h3>
                        {job.songTitle && (
                          <p className="text-xs text-gray-500 mb-1">
                            Job #{job.job_id.substring(0, 8)}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            job.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {job.status === 'completed' ? '✅ Ready' : '⏳ Processing'}
                          </span>
                          <span>{formatCreatedAt(job.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {job.status === 'completed' && job.video_url && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVideo(job.video_url, job.job_id, job.songTitle)}
                            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-all flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Watch</span>
                          </button>
                          <button
                            onClick={() => handleDownloadVideo(job.video_url, `avatar_${job.job_id}`)}
                            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-all"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareVideo(job.video_url, job.job_id)}
                            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-all"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {currentVideo && (
        <VideoPlayer
          isOpen={isPlayerOpen}
          onClose={handleClosePlayer}
          videoUrl={currentVideo.url}
          title={currentVideo.title}
          jobId={currentVideo.jobId}
          onDownload={() => handleDownloadVideo(currentVideo.url, `avatar_${currentVideo.jobId}`)}
          onShare={() => handleShareVideo(currentVideo.url, currentVideo.jobId)}
        />
      )}

      {/* Mini Video Player */}
      {currentVideo && (
        <MiniVideoPlayer
          isVisible={showMiniPlayer}
          videoUrl={currentVideo.url}
          title={currentVideo.title}  
          jobId={currentVideo.jobId}
          onExpand={handleExpandPlayer}
          onClose={handleCloseMiniPlayer}
        />
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
} 