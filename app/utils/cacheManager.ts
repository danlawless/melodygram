// Cache management utility for clearing persistent data after successful operations

export class CacheManager {
  // Keys for different types of cached data
  private static readonly CACHE_KEYS = {
    CREATION_SESSION: 'melodygram_creation_session',
    PROFILE_AVATAR: 'melodygram_profile_avatar_session',
    // Add more cache keys here as needed
  }

  /**
   * Clear all creation-related caches after successful song/avatar generation
   * This ensures users start fresh for the next creation
   */
  static clearCreationCaches(): void {
    if (typeof window === 'undefined') return

    try {
      console.log('🧹 Clearing creation caches after successful generation...')
      
      // Clear creation session (lyrics, title, etc.)
      localStorage.removeItem(this.CACHE_KEYS.CREATION_SESSION)
      console.log('🗑️ Cleared creation session cache')
      
      // Don't clear profile avatar - that should persist across sessions
      
      console.log('✅ Creation caches cleared successfully')
      
    } catch (error) {
      console.error('❌ Failed to clear creation caches:', error)
    }
  }

  /**
   * Clear profile avatar cache specifically
   * Use this when user wants to reset their profile avatar
   */
  static clearProfileAvatarCache(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.CACHE_KEYS.PROFILE_AVATAR)
      console.log('🗑️ Cleared profile avatar cache')
    } catch (error) {
      console.error('❌ Failed to clear profile avatar cache:', error)
    }
  }

  /**
   * Clear all caches (nuclear option)
   */
  static clearAllCaches(): void {
    if (typeof window === 'undefined') return

    try {
      console.log('💥 Clearing ALL melodygram caches...')
      
      Object.values(this.CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('✅ All caches cleared')
    } catch (error) {
      console.error('❌ Failed to clear all caches:', error)
    }
  }

  /**
   * Get info about current cache usage (for debugging)
   */
  static getCacheInfo(): Record<string, any> {
    if (typeof window === 'undefined') return {}

    const info: Record<string, any> = {}
    
    Object.entries(this.CACHE_KEYS).forEach(([name, key]) => {
      try {
        const data = localStorage.getItem(key)
        info[name] = {
          exists: !!data,
          size: data ? data.length : 0,
          preview: data ? data.substring(0, 100) + '...' : null
        }
      } catch (error) {
        info[name] = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })
    
    return info
  }
}

// Export individual methods for convenience
export const clearCreationCaches = CacheManager.clearCreationCaches
export const clearProfileAvatarCache = CacheManager.clearProfileAvatarCache
export const clearAllCaches = CacheManager.clearAllCaches
export const getCacheInfo = CacheManager.getCacheInfo 