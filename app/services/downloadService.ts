/**
 * Download Service
 * Handles video and file downloads with proper error handling and user feedback
 */

interface ToastOptions {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

class DownloadService {
  
  private showToast({ message, type, duration = 3000 }: ToastOptions): HTMLElement {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500', 
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }
    
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300`
    toast.textContent = message
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
      toast.style.opacity = '1'
    }, 10)
    
    // Auto remove
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.transform = 'translateX(100%)'
        toast.style.opacity = '0'
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 300)
      }
    }, duration)
    
    return toast
  }

  private removeExistingToasts(): void {
    const existingToasts = document.querySelectorAll('.fixed.top-4.right-4')
    existingToasts.forEach(toast => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    })
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  }

  private async downloadViaBlob(videoUrl: string, filename: string): Promise<void> {
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'video/mp4,video/*,*/*'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 1000)
  }

  private downloadViaDirectLink(videoUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private async downloadViaProxy(videoUrl: string, filename: string): Promise<void> {
    const response = await fetch('/api/download-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl,
        filename
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy download failed: ${response.status} ${response.statusText}`)
    }

    // Create blob from the response
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up blob URL
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 1000)
  }

  /**
   * Download a video file with automatic fallback methods
   */
  async downloadVideo(videoUrl: string, title: string): Promise<void> {
    if (!videoUrl) {
      this.showToast({ message: 'No video URL provided', type: 'error' })
      return
    }

    const filename = `${this.sanitizeFilename(title)}.mp4`
    let loadingToast: HTMLElement | null = null

    try {
      // Show loading state
      loadingToast = this.showToast({ 
        message: 'Preparing download...', 
        type: 'info', 
        duration: 30000 // Long duration for loading
      })
      
      // Method 1: Try blob download (works best for CORS-enabled URLs)
      try {
        await this.downloadViaBlob(videoUrl, filename)
        
        // Remove loading toast
        if (loadingToast && document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast)
        }
        
        this.showToast({ 
          message: '✅ Download started!', 
          type: 'success' 
        })
        return
        
      } catch (blobError) {
        console.warn('Blob download failed, trying proxy fallback:', blobError)
        
        // Method 2: Try proxy download (handles CORS issues)
        try {
          await this.downloadViaProxy(videoUrl, filename)
          
          // Remove loading toast
          if (loadingToast && document.body.contains(loadingToast)) {
            document.body.removeChild(loadingToast)
          }
          
          this.showToast({ 
            message: '✅ Download completed via proxy!', 
            type: 'success' 
          })
          return
          
        } catch (proxyError) {
          console.warn('Proxy download failed, trying direct link:', proxyError)
          
          // Method 3: Try direct link download
          this.downloadViaDirectLink(videoUrl, filename)
          
          // Remove loading toast
          if (loadingToast && document.body.contains(loadingToast)) {
            document.body.removeChild(loadingToast)
          }
          
          this.showToast({ 
            message: '⬇️ Download initiated!', 
            type: 'warning' 
          })
          return
        }
      }
      
    } catch (error) {
      console.error('Download failed:', error)
      
      // Remove loading toast
      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast)
      }
      
      // Final fallback: Open in new tab
      try {
        window.open(videoUrl, '_blank', 'noopener,noreferrer')
        this.showToast({ 
          message: '🔗 Video opened in new tab', 
          type: 'warning' 
        })
      } catch (finalError) {
        console.error('All download methods failed:', finalError)
        this.showToast({ 
          message: '❌ Download failed. Please try again.', 
          type: 'error',
          duration: 5000 
        })
      }
    }
  }

  /**
   * Download any file type with proper handling
   */
  async downloadFile(fileUrl: string, filename: string, mimeType?: string): Promise<void> {
    if (!fileUrl) {
      this.showToast({ message: 'No file URL provided', type: 'error' })
      return
    }

    const sanitizedFilename = this.sanitizeFilename(filename)
    let loadingToast: HTMLElement | null = null

    try {
      loadingToast = this.showToast({ 
        message: 'Downloading file...', 
        type: 'info', 
        duration: 30000 
      })
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: mimeType ? { 'Accept': mimeType } : {}
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = sanitizedFilename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 1000)
      
      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast)
      }
      
      this.showToast({ 
        message: '✅ Download completed!', 
        type: 'success' 
      })
      
    } catch (error) {
      console.error('File download failed:', error)
      
      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast)
      }
      
      // Fallback to direct link
      try {
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = sanitizedFilename
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.showToast({ 
          message: '⬇️ Download initiated!', 
          type: 'warning' 
        })
      } catch (fallbackError) {
        this.showToast({ 
          message: '❌ Download failed. Please try again.', 
          type: 'error',
          duration: 5000 
        })
      }
    }
  }
}

// Export singleton instance
export const downloadService = new DownloadService()