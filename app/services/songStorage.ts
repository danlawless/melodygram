// Song storage service for managing user's created songs
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
}

// Export singleton instance
export const songStorageService = new SongStorageService()
export default songStorageService 