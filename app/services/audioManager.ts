/**
 * Global Audio Manager
 * 
 * Ensures only one audio source plays at a time across the entire app.
 * Prevents conflicts between different audio players (SongGeneration, FinalPreview, VideoPlayer, etc.)
 */

interface AudioPlayerInfo {
  id: string
  audioElement: HTMLAudioElement | HTMLVideoElement | null
  stop: () => void
  source: string
}

class GlobalAudioManager {
  private audioPlayers: Map<string, AudioPlayerInfo> = new Map()
  private currentPlayingId: string | null = null

  /**
   * Register an audio player with the global manager
   */
  registerPlayer(id: string, audioElement: HTMLAudioElement | HTMLVideoElement | null, stopCallback: () => void, source: string = 'unknown') {
    console.log(`🎵 🔗 Registering audio player: ${id} (${source})`)
    
    this.audioPlayers.set(id, {
      id,
      audioElement,
      stop: stopCallback,
      source
    })
  }

  /**
   * Unregister an audio player (cleanup when component unmounts)
   */
  unregisterPlayer(id: string) {
    console.log(`🎵 🔗 Unregistering audio player: ${id}`)
    
    if (this.currentPlayingId === id) {
      this.currentPlayingId = null
    }
    
    this.audioPlayers.delete(id)
  }

  /**
   * Start playing audio for a specific player
   * This will automatically stop all other players
   */
  startPlaying(id: string, source: string = 'unknown') {
    console.log(`🎵 ▶️ Starting playback: ${id} (${source})`)
    
    // Stop all other players first
    if (this.currentPlayingId && this.currentPlayingId !== id) {
      this.stopOthers(id)
    }
    
    this.currentPlayingId = id
  }

  /**
   * Stop playing audio for a specific player
   */
  stopPlaying(id: string) {
    console.log(`🎵 ⏹️ Stopping playback: ${id}`)
    
    if (this.currentPlayingId === id) {
      this.currentPlayingId = null
    }
  }

  /**
   * Stop all audio players except the specified one
   */
  private stopOthers(excludeId: string) {
    console.log(`🎵 🛑 Stopping all other players except: ${excludeId}`)
    
    this.audioPlayers.forEach((player, playerId) => {
      if (playerId !== excludeId) {
        try {
          console.log(`🎵 🛑 Stopping player: ${playerId} (${player.source})`)
          
          // Stop the player using its callback
          player.stop()
          
          // Also directly pause the audio element if available
          if (player.audioElement && !player.audioElement.paused) {
            player.audioElement.pause()
            console.log(`🎵 🔇 Force paused audio element: ${playerId}`)
          }
        } catch (error) {
          console.error(`🎵 ❌ Error stopping player ${playerId}:`, error)
        }
      }
    })
  }

  /**
   * Stop all audio players
   */
  stopAll() {
    console.log('🎵 🛑 Stopping ALL audio players')
    
    this.audioPlayers.forEach((player, playerId) => {
      try {
        player.stop()
        if (player.audioElement && !player.audioElement.paused) {
          player.audioElement.pause()
        }
      } catch (error) {
        console.error(`🎵 ❌ Error stopping player ${playerId}:`, error)
      }
    })
    
    this.currentPlayingId = null
  }

  /**
   * Update the audio element reference for a player
   */
  updatePlayerElement(id: string, audioElement: HTMLAudioElement | HTMLVideoElement | null) {
    const player = this.audioPlayers.get(id)
    if (player) {
      player.audioElement = audioElement
    }
  }

  /**
   * Get current playing audio info
   */
  getCurrentPlaying(): { id: string | null; source: string | null } {
    if (!this.currentPlayingId) {
      return { id: null, source: null }
    }
    
    const player = this.audioPlayers.get(this.currentPlayingId)
    return {
      id: this.currentPlayingId,
      source: player?.source || null
    }
  }

  /**
   * Get debug info about all registered players
   */
  getDebugInfo() {
    console.log('🎵 📊 Audio Manager Debug Info:')
    console.log(`  Currently playing: ${this.currentPlayingId}`)
    console.log(`  Registered players: ${this.audioPlayers.size}`)
    
    this.audioPlayers.forEach((player, id) => {
      const isPlaying = player.audioElement && !player.audioElement.paused
      console.log(`    ${id} (${player.source}): ${isPlaying ? 'PLAYING' : 'STOPPED'}`)
    })
  }
}

// Create global singleton instance
export const globalAudioManager = new GlobalAudioManager()

// Helper hook for React components
export function useGlobalAudioManager(playerId: string, source: string = 'unknown') {
  const registerPlayer = (audioElement: HTMLAudioElement | HTMLVideoElement | null, stopCallback: () => void) => {
    globalAudioManager.registerPlayer(playerId, audioElement, stopCallback, source)
  }

  const unregisterPlayer = () => {
    globalAudioManager.unregisterPlayer(playerId)
  }

  const startPlaying = () => {
    globalAudioManager.startPlaying(playerId, source)
  }

  const stopPlaying = () => {
    globalAudioManager.stopPlaying(playerId)
  }

  const updateElement = (audioElement: HTMLAudioElement | HTMLVideoElement | null) => {
    globalAudioManager.updatePlayerElement(playerId, audioElement)
  }

  return {
    registerPlayer,
    unregisterPlayer,
    startPlaying,
    stopPlaying,
    updateElement,
    getCurrentPlaying: () => globalAudioManager.getCurrentPlaying(),
    getDebugInfo: () => globalAudioManager.getDebugInfo()
  }
}

export default globalAudioManager