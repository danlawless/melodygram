/**
 * Share Service
 * Handles creation and management of shareable links with enhanced public presentation
 */

export interface ShareOptions {
  videoUrl: string
  title: string
  lyrics?: string
  thumbnailUrl?: string
  duration?: number
  genre?: string
  mood?: string
  jobId?: string
}

export interface ShareResult {
  success: boolean
  shareId?: string
  shareUrl?: string
  expiresAt?: string
  error?: string
}

class ShareService {
  
  /**
   * Create a shareable link for a MelodyGram video
   */
  async createShareLink(options: ShareOptions): Promise<ShareResult> {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create share link')
      }

      return {
        success: true,
        shareId: result.shareId,
        shareUrl: result.shareUrl,
        expiresAt: result.expiresAt
      }

    } catch (error) {
      console.error('Share link creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share link'
      }
    }
  }

  /**
   * Get share data by ID
   */
  async getShareData(shareId: string) {
    try {
      const response = await fetch(`/api/share?id=${shareId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get share data')
      }

      return result.data
    } catch (error) {
      console.error('Failed to get share data:', error)
      return null
    }
  }

  /**
   * Share via native Web Share API or fallback methods
   */
  async shareUrl(url: string, title: string, text?: string): Promise<boolean> {
    try {
      // Try native Web Share API first
      if (navigator.share) {
        await navigator.share({
          title,
          text: text || 'Check out this amazing AI-generated singing avatar!',
          url
        })
        return true
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      this.showToast('Link copied to clipboard!', 'success')
      return true

    } catch (error) {
      console.error('Share failed:', error)
      
      // Final fallback - try clipboard again
      try {
        await navigator.clipboard.writeText(url)
        this.showToast('Link copied to clipboard!', 'success')
        return true
      } catch (clipboardError) {
        this.showToast('Failed to share. Please copy the link manually.', 'error')
        return false
      }
    }
  }

  /**
   * Generate social media sharing URLs
   */
  generateSocialShareUrls(shareUrl: string, title: string, description?: string) {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)
    const encodedDescription = encodeURIComponent(description || 'Check out this amazing AI-generated singing avatar!')

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}%20-%20${encodedDescription}&hashtags=MelodyGram,AI,SingingAvatar`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    }
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }

    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300`
    toast.textContent = message
    toast.style.transform = 'translateX(100%)'
    toast.style.opacity = '0'
    
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
      toast.style.opacity = '1'
    }, 10)
    
    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      toast.style.opacity = '0'
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }

  /**
   * Validate video URL before sharing
   */
  isValidVideoUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'https:' && (
        url.includes('.mp4') || 
        url.includes('.webm') || 
        url.includes('.mov') ||
        url.includes('video')
      )
    } catch {
      return false
    }
  }

  /**
   * Format share analytics data
   */
  formatShareData(shareData: any) {
    return {
      title: shareData.title || 'Untitled MelodyGram',
      views: shareData.views || 0,
      createdAt: shareData.createdAt ? new Date(shareData.createdAt).toLocaleDateString() : 'Unknown',
      duration: shareData.duration ? `${Math.round(shareData.duration)}s` : 'Unknown',
      genre: shareData.genre || 'Unknown',
      mood: shareData.mood || 'Unknown'
    }
  }
}

// Export singleton instance
export const shareService = new ShareService()