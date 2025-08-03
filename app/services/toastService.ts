// Simple toast service that can be used from anywhere in the app
// This uses custom events to communicate with the ToastProvider

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title: string
  message?: string
  duration?: number // in milliseconds, 0 means no auto-remove
}

class ToastService {
  private dispatchToast(type: ToastType, options: ToastOptions) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type, ...options }
      })
      window.dispatchEvent(event)
    }
  }

  success(title: string, message?: string, duration?: number) {
    this.dispatchToast('success', { title, message, duration })
  }

  error(title: string, message?: string, duration?: number) {
    this.dispatchToast('error', { title, message, duration })
  }

  warning(title: string, message?: string, duration?: number) {
    this.dispatchToast('warning', { title, message, duration })
  }

  info(title: string, message?: string, duration?: number) {
    this.dispatchToast('info', { title, message, duration })
  }

  // Convenience methods for common scenarios
  profileSaved() {
    this.success('Profile saved successfully!', 'Your changes have been saved.')
  }

  profileSaveFailed() {
    this.error('Failed to save profile', 'Please try again.')
  }

  creditsPurchased(amount: number) {
    this.success('Credits purchased!', `Successfully added ${amount} credits to your account.`)
  }

  creditsPurchaseFailed() {
    this.error('Purchase failed', 'Failed to purchase credits. Please try again.')
  }

  paymentMethodAdded() {
    this.success('Payment method added', 'Your card has been successfully added.')
  }

  paymentMethodRemoved() {
    this.success('Payment method removed', 'Your card has been successfully removed.')
  }

  songGenerationStarted() {
    this.info('Generating your song...', 'This may take a few minutes.')
  }

  songGenerationCompleted() {
    this.success('Song created!', 'Your avatar video is ready to view.')
  }

  songGenerationFailed() {
    this.error('Generation failed', 'Something went wrong. Please try again.')
  }
}

export const toastService = new ToastService() 