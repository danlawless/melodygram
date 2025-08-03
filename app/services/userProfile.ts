export interface UserProfile {
  id: string
  name: string
  email: string
  bio: string
  avatar?: string
  createdAt: string
  updatedAt: string
  
  // Payment & Subscription Info
  paymentMethods: PaymentMethod[]
  billingAddress?: BillingAddress
  subscriptionTier: 'free' | 'basic' | 'premium'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
  subscriptionRenewsAt?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
}

export interface BillingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  savings?: string
}

const USER_PROFILE_KEY = 'melodygram_user_profile'
const DEFAULT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 4.99
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 9.99,
    popular: true,
    savings: 'Save 20%'
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    credits: 50,
    price: 17.99,
    savings: 'Save 28%'
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 100,
    price: 29.99,
    savings: 'Save 40%'
  }
]

class UserProfileService {
  /**
   * Get current user profile
   */
  getUserProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(USER_PROFILE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      return null
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    }
  }

  /**
   * Create or update user profile
   */
  saveProfile(profileData: Partial<UserProfile>): UserProfile {
    if (typeof window === 'undefined') {
      throw new Error('Profile service not available on server')
    }

    const currentProfile = this.getUserProfile()
    const now = new Date().toISOString()
    
    const profile: UserProfile = {
      id: currentProfile?.id || this.generateUserId(),
      name: profileData.name || currentProfile?.name || 'Music Creator',
      email: profileData.email || currentProfile?.email || '',
      bio: profileData.bio || currentProfile?.bio || 'Creating amazing music with AI',
      avatar: profileData.avatar || currentProfile?.avatar,
      createdAt: currentProfile?.createdAt || now,
      updatedAt: now,
      paymentMethods: profileData.paymentMethods || currentProfile?.paymentMethods || [],
      billingAddress: profileData.billingAddress || currentProfile?.billingAddress,
      subscriptionTier: profileData.subscriptionTier || currentProfile?.subscriptionTier || 'free',
      subscriptionStatus: profileData.subscriptionStatus || currentProfile?.subscriptionStatus || 'inactive',
      subscriptionRenewsAt: profileData.subscriptionRenewsAt || currentProfile?.subscriptionRenewsAt
    }

    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
      console.log('✅ Profile saved successfully')
      return profile
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      throw new Error('Failed to save profile')
    }
  }

  /**
   * Add payment method
   */
  addPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod {
    const profile = this.getUserProfile()
    if (!profile) throw new Error('No user profile found')

    const newPaymentMethod: PaymentMethod = {
      ...paymentMethod,
      id: this.generatePaymentMethodId(),
      createdAt: new Date().toISOString()
    }

    // If this is the first payment method or marked as default, make it default
    if (profile.paymentMethods.length === 0 || paymentMethod.isDefault) {
      // Unset other default methods
      profile.paymentMethods.forEach(pm => pm.isDefault = false)
      newPaymentMethod.isDefault = true
    }

    profile.paymentMethods.push(newPaymentMethod)
    this.saveProfile(profile)
    
    return newPaymentMethod
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(paymentMethodId: string): void {
    const profile = this.getUserProfile()
    if (!profile) throw new Error('No user profile found')

    profile.paymentMethods = profile.paymentMethods.filter(pm => pm.id !== paymentMethodId)
    this.saveProfile(profile)
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(paymentMethodId: string): void {
    const profile = this.getUserProfile()
    if (!profile) throw new Error('No user profile found')

    profile.paymentMethods.forEach(pm => {
      pm.isDefault = pm.id === paymentMethodId
    })
    
    this.saveProfile(profile)
  }

  /**
   * Get available credit packages
   */
  getCreditPackages(): CreditPackage[] {
    return DEFAULT_PACKAGES
  }

  /**
   * Initialize default profile for new users
   */
  initializeDefaultProfile(): UserProfile {
    const defaultProfile: Partial<UserProfile> = {
      name: 'Music Creator',
      email: '',
      bio: 'Creating amazing music with AI',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive'
    }
    
    return this.saveProfile(defaultProfile)
  }

  /**
   * Get user statistics
   */
  getUserStats(): { videosCreated: number, daysActive: number, totalCreditsUsed: number } {
    if (typeof window === 'undefined') {
      return { videosCreated: 0, daysActive: 0, totalCreditsUsed: 0 }
    }

    // Import services dynamically to avoid circular dependencies
    try {
      const { songStorageService } = require('./songStorage')
      const { creditSystemService } = require('./creditSystem')
      
      const songs = songStorageService.getSongs()
      const transactions = creditSystemService.getTransactionHistory()
      
      const videosCreated = songs.filter(song => song.status === 'completed').length
      const totalCreditsUsed = transactions
        .filter(t => t.type === 'spend')
        .reduce((sum, t) => sum + t.credits, 0)
        
      // Calculate days active based on song creation dates
      const songDates = songs.map(song => new Date(song.createdAt).toDateString())
      const uniqueDays = Array.from(new Set(songDates))
      const daysActive = uniqueDays.length
      
      return { videosCreated, daysActive, totalCreditsUsed }
    } catch (error) {
      console.error('Error calculating user stats:', error)
      return { videosCreated: 0, daysActive: 0, totalCreditsUsed: 0 }
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private generatePaymentMethodId(): string {
    return 'pm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

export const userProfileService = new UserProfileService() 