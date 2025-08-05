// Song storage service for managing user's created songs
export interface AudioSelection {
  startTime: number
  endTime: number
  duration: number
}

export interface SavedSong {
  id: string
  title: string
  lyrics: string
  vocalGender: 'male' | 'female'
  songLength?: number // Duration in seconds for credit calculation
  imageUrl?: string
  imageFile?: File
  createdAt: string
  status: 'generating' | 'completed' | 'failed'
  
  // Mureka API results
  audioUrl?: string
  
  // Audio selection data
  fullAudioUrl?: string      // The complete generated audio
  selectedAudioUrl?: string  // The user-selected segment
  audioSelection?: AudioSelection // Selection metadata
  originalDuration?: number  // Duration of the full audio
  
  // LemonSlice API results
  taskId?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  completedAt?: string
  errorMessage?: string
  progress?: number
  
  // Additional metadata
  plays: number
  genre?: string
  mood?: string
}

class SongStorageService {
  private readonly STORAGE_KEY = 'melodygram_songs'

  /**
   * Get all saved songs
   */
  getSongs(): SavedSong[] {
    try {
      const storedSongs = localStorage.getItem(this.STORAGE_KEY)
      if (!storedSongs) return []
      
      const songs = JSON.parse(storedSongs) as SavedSong[]
      return songs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Error loading songs from localStorage:', error)
      return []
    }
  }

  /**
   * Save a new song
   */
  saveSong(song: SavedSong): void {
    try {
      const songs = this.getSongs()
      songs.unshift(song) // Add to beginning
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs))
    } catch (error) {
      console.error('Error saving song to localStorage:', error)
      throw new Error('Failed to save song')
    }
  }

  /**
   * Update an existing song
   */
  updateSong(songId: string, updates: Partial<SavedSong>): void {
    try {
      const songs = this.getSongs()
      const songIndex = songs.findIndex(song => song.id === songId)
      
      if (songIndex === -1) {
        throw new Error('Song not found')
      }
      
      songs[songIndex] = { ...songs[songIndex], ...updates }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs))
    } catch (error) {
      console.error('Error updating song:', error)
      throw new Error('Failed to update song')
    }
  }

  /**
   * Delete a song
   */
  deleteSong(songId: string): void {
    try {
      const songs = this.getSongs()
      const filteredSongs = songs.filter(song => song.id !== songId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSongs))
    } catch (error) {
      console.error('Error deleting song:', error)
      throw new Error('Failed to delete song')
    }
  }

  /**
   * Get a specific song by ID
   */
  getSong(songId: string): SavedSong | null {
    const songs = this.getSongs()
    return songs.find(song => song.id === songId) || null
  }

  /**
   * Generate a new song ID
   */
  generateSongId(): string {
    return `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get songs statistics
   */
  getStats() {
    const songs = this.getSongs()
    return {
      totalSongs: songs.length,
      completedSongs: songs.filter(s => s.status === 'completed').length,
      totalPlays: songs.reduce((total, song) => total + song.plays, 0),
      generatingSongs: songs.filter(s => s.status === 'generating').length
    }
  }

  /**
   * Mark a song as played (increment play count)
   */
  incrementPlayCount(songId: string): void {
    try {
      const songs = this.getSongs()
      const songIndex = songs.findIndex(song => song.id === songId)
      
      if (songIndex !== -1) {
        songs[songIndex].plays += 1
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs))
      }
    } catch (error) {
      console.error('Error incrementing play count:', error)
    }
  }

  /**
   * Save audio selection for a song
   */
  saveAudioSelection(songId: string, selection: AudioSelection, selectedAudioBlob: Blob): void {
    try {
      // Create object URL for the selected audio
      const selectedAudioUrl = URL.createObjectURL(selectedAudioBlob)
      
      this.updateSong(songId, {
        audioSelection: selection,
        selectedAudioUrl: selectedAudioUrl,
        duration: selection.duration,
        // Update songLength to reflect the selected duration for credit calculation
        songLength: selection.duration,
        status: 'completed'
      })
      
      console.log('🎵 Audio selection saved for song:', songId)
      console.log('💳 Credit calculation updated to reflect', selection.duration, 'second selection')
    } catch (error) {
      console.error('Error saving audio selection:', error)
      throw new Error('Failed to save audio selection')
    }
  }

  /**
   * Set full audio URL for a song (when generation completes)
   */
  setFullAudio(songId: string, audioUrl: string, originalDuration: number): void {
    try {
      // Create default selection for the target duration
      const song = this.getSong(songId)
      const targetDuration = song?.songLength || 30
      const defaultSelection = {
        startTime: 0,
        endTime: Math.min(targetDuration, originalDuration),
        duration: Math.min(targetDuration, originalDuration)
      }

      this.updateSong(songId, {
        fullAudioUrl: audioUrl,
        audioUrl: audioUrl, // Backward compatibility
        originalDuration: originalDuration,
        audioSelection: defaultSelection,
        // Update duration to reflect the selected segment for credit calculation
        duration: defaultSelection.duration,
        status: 'completed'
      })
      
      console.log('🎵 Full audio set for song:', songId)
      console.log('💳 Default selection duration set to:', defaultSelection.duration, 'seconds')
    } catch (error) {
      console.error('Error setting full audio:', error)
      throw new Error('Failed to set full audio URL')
    }
  }

  /**
   * Get the playable audio URL for a song (selected segment if available, otherwise full audio)
   */
  getPlayableAudioUrl(songId: string): string | null {
    const song = this.getSong(songId)
    if (!song) return null
    
    // Prefer selected audio, fallback to full audio, then audioUrl for backward compatibility
    return song.selectedAudioUrl || song.fullAudioUrl || song.audioUrl || null
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  cleanupObjectUrls(songId: string): void {
    try {
      const song = this.getSong(songId)
      if (!song) return

      // Clean up selected audio URL if it's an object URL
      if (song.selectedAudioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(song.selectedAudioUrl)
      }

      // Clean up full audio URL if it's an object URL
      if (song.fullAudioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(song.fullAudioUrl)
      }
    } catch (error) {
      console.error('Error cleaning up object URLs:', error)
    }
  }

  /**
   * Delete a song and clean up its object URLs
   */
  deleteSongWithCleanup(songId: string): void {
    this.cleanupObjectUrls(songId)
    this.deleteSong(songId)
  }
}

// Export singleton instance
export const songStorageService = new SongStorageService()
export default songStorageService 