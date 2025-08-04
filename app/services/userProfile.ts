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
  subscriptionTier: 'free' | 'starter' | 'premium' | 'pro' | 'enterprise'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due'
  subscriptionRenewsAt?: string
  currentPlan?: SubscriptionPlan
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

export interface SubscriptionPlan {
  id: string
  name: string
  price: number // Monthly price in dollars
  credits: number // Monthly credits included
  savings?: number // Percentage savings compared to base rate
  popular?: boolean
  features: string[]
  description: string
  billingCycle: 'monthly' | 'yearly'
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

// NEW SUBSCRIPTION PLANS
// Base rate: $0.05 per credit (1 credit = 1 second)
// Free: 3 credits, $8 plan: 160 credits, $20 plan: 444 credits (10% discount), 
// $40 plan: 941 credits (15% discount), $100 plan: 2500 credits (20% discount)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 3,
    description: 'Perfect for testing MelodyGram',
    features: [
      '3 credits to test',
      'Generate up to 3 seconds of music',
      'Basic support'
    ],
    billingCycle: 'monthly'
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 8,
    credits: 160,
    description: 'Great for casual music creators',
    features: [
      '160 credits per month',
      'Generate up to 2.7 minutes of music',
      'Standard quality',
      'Email support'
    ],
    billingCycle: 'monthly'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 20,
    credits: 444, // 10% discount: $20 / ($0.05 * 0.9) = 444 credits
    savings: 10,
    popular: true,
    description: 'Most popular plan for regular creators',
    features: [
      '444 credits per month (10% bonus)',
      'Generate up to 7.4 minutes of music',
      'High quality generation',
      'Priority support',
      'Advanced music styles'
    ],
    billingCycle: 'monthly'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 40,
    credits: 941, // 15% discount: $40 / ($0.05 * 0.85) = 941 credits
    savings: 15,
    description: 'Perfect for content creators and professionals',
    features: [
      '941 credits per month (15% bonus)',
      'Generate up to 15.7 minutes of music',
      'Premium quality generation',
      'Priority support',
      'All music styles & genres',
      'Commercial usage rights'
    ],
    billingCycle: 'monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 100,
    credits: 2500, // 20% discount: $100 / ($0.05 * 0.8) = 2500 credits
    savings: 20,
    description: 'For heavy users and businesses',
    features: [
      '2500 credits per month (20% bonus)',
      'Generate up to 41.7 minutes of music',
      'Ultra-high quality generation',
      'Dedicated support',
      'All features included',
      'Commercial usage rights',
      'API access (coming soon)'
    ],
    billingCycle: 'monthly'
  }
]

// Legacy one-time credit packages (kept for backward compatibility)
const DEFAULT_PACKAGES: CreditPackage[] = [
  {
    id: 'small_topup',
    name: 'Quick Top-up',
    credits: 60,
    price: 3.00 // $0.05 per credit
  },
  {
    id: 'medium_topup',
    name: 'Standard Top-up',
    credits: 200,
    price: 10.00,
    popular: true
  },
  {
    id: 'large_topup',
    name: 'Large Top-up',
    credits: 600,
    price: 30.00
  },
  {
    id: 'mega_topup',
    name: 'Mega Top-up',
    credits: 1200,
    price: 60.00
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
      subscriptionRenewsAt: profileData.subscriptionRenewsAt || currentProfile?.subscriptionRenewsAt,
      currentPlan: profileData.currentPlan || currentProfile?.currentPlan
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
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS
  }

  /**
   * Get available credit packages for top-ups
   */
  getCreditPackages(): CreditPackage[] {
    return DEFAULT_PACKAGES
  }

  /**
   * Subscribe to a plan
   */
  subscribeToPlan(planId: string): SubscriptionPlan | null {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) return null

    const profile = this.getUserProfile()
    if (!profile) {
      // Create a new profile if none exists
      this.initializeDefaultProfile()
    }

    // Calculate renewal date (30 days from now)
    const renewalDate = new Date()
    renewalDate.setDate(renewalDate.getDate() + 30)

    const updatedProfile = this.saveProfile({
      subscriptionTier: plan.id as UserProfile['subscriptionTier'],
      subscriptionStatus: 'active',
      subscriptionRenewsAt: renewalDate.toISOString(),
      currentPlan: plan
    })

    // Add subscription credits
    const { creditSystemService } = require('./creditSystem')
    creditSystemService.addSubscriptionCredits(plan.credits, plan.name, plan.id)

    console.log(`🎉 Successfully subscribed to ${plan.name} plan!`)
    return plan
  }

  /**
   * Cancel current subscription
   */
  cancelSubscription(): void {
    this.saveProfile({
      subscriptionStatus: 'cancelled',
      subscriptionRenewsAt: undefined
    })
    console.log('❌ Subscription cancelled')
  }

  /**
   * Get current plan details
   */
  getCurrentPlan(): SubscriptionPlan | null {
    const profile = this.getUserProfile()
    if (!profile?.currentPlan) {
      return SUBSCRIPTION_PLANS.find(p => p.id === 'free') || null
    }
    return profile.currentPlan
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(): boolean {
    const profile = this.getUserProfile()
    return profile?.subscriptionStatus === 'active' && 
           profile?.subscriptionTier !== 'free'
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