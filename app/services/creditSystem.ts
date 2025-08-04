// Credit system for MelodyGram
export interface CreditTransaction {
  id: string
  type: 'purchase' | 'spent' | 'refund' | 'subscription'
  amount: number
  description: string
  timestamp: string
  songId?: string // If credits were spent on a song
  planId?: string // If credits came from a subscription plan
}

export interface UserCredits {
  balance: number
  transactions: CreditTransaction[]
  lastUpdated: string
}

// NEW CREDIT MODEL: 1 second = 1 credit, 60 seconds = $3.00 (so 1 credit = $0.05)
// This means our cost is $1/minute to us, we charge $3/minute to users (3x markup)
export const CREDIT_RATE = 0.05 // $0.05 per credit (1 credit = 1 second)

// Credit calculation functions using the new 1s = 1 credit model
export const getCreditsForLength = (seconds: number): number => {
  return seconds // 1 second = 1 credit
}

export const getPriceForLength = (seconds: number): number => {
  return seconds * CREDIT_RATE // 1 credit costs $0.05
}

// Helper function to explain pricing to users
export const getPricingExplanation = (): string => {
  return "Every 1 second of music generation = 1 credit. 60 seconds costs $3.00 to generate."
}

class CreditSystemService {
  private readonly STORAGE_KEY = 'melodygram_credits'

  /**
   * Get user's current credit balance and transaction history
   */
  getUserCredits(): UserCredits {
    // Return safe defaults during server-side rendering
    if (typeof window === 'undefined') {
      return {
        balance: 3, // Default credits for SSR
        transactions: [],
        lastUpdated: new Date().toISOString()
      }
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        // Initialize new user with 3 free credits (enough for testing)
        const initialCredits: UserCredits = {
          balance: 3,
          transactions: [{
            id: this.generateTransactionId(),
            type: 'purchase',
            amount: 3,
            description: 'Welcome bonus - 3 free credits to test!',
            timestamp: new Date().toISOString()
          }],
          lastUpdated: new Date().toISOString()
        }
        this.saveCredits(initialCredits)
        return initialCredits
      }
      
      return JSON.parse(stored) as UserCredits
    } catch (error) {
      console.error('Error loading credits:', error)
      return { balance: 0, transactions: [], lastUpdated: new Date().toISOString() }
    }
  }

  /**
   * Check if user has enough credits for a song length
   */
  hasEnoughCredits(songLengthSeconds: number): boolean {
    // Return true during SSR to avoid hydration mismatches
    if (typeof window === 'undefined') {
      return true
    }
    
    const required = getCreditsForLength(songLengthSeconds)
    const current = this.getUserCredits().balance
    return current >= required
  }

  /**
   * Spend credits for song generation
   */
  spendCredits(songLengthSeconds: number, songId: string, songTitle: string): boolean {
    // Skip during SSR
    if (typeof window === 'undefined') {
      return true
    }
    
    const required = getCreditsForLength(songLengthSeconds)
    const userCredits = this.getUserCredits()
    
    if (userCredits.balance < required) {
      return false // Not enough credits
    }

    const transaction: CreditTransaction = {
      id: this.generateTransactionId(),
      type: 'spent',
      amount: -required,
      description: `Generated "${songTitle}" (${songLengthSeconds}s song)`,
      timestamp: new Date().toISOString(),
      songId
    }

    const updatedCredits: UserCredits = {
      balance: userCredits.balance - required,
      transactions: [transaction, ...userCredits.transactions],
      lastUpdated: new Date().toISOString()
    }

    this.saveCredits(updatedCredits)
    console.log(`💳 Spent ${required} credits for ${songLengthSeconds}s song. Remaining: ${updatedCredits.balance}`)
    return true
  }

  /**
   * Add credits (for purchases - would integrate with payment system later)
   */
  addCredits(amount: number, description: string): void {
    // Skip during SSR
    if (typeof window === 'undefined') {
      return
    }
    
    const userCredits = this.getUserCredits()
    
    const transaction: CreditTransaction = {
      id: this.generateTransactionId(),
      type: 'purchase',
      amount: amount,
      description,
      timestamp: new Date().toISOString()
    }

    const updatedCredits: UserCredits = {
      balance: userCredits.balance + amount,
      transactions: [transaction, ...userCredits.transactions],
      lastUpdated: new Date().toISOString()
    }

    this.saveCredits(updatedCredits)
    console.log(`💳 Added ${amount} credits: ${description}. New balance: ${updatedCredits.balance}`)
  }

  /**
   * Add credits from subscription plan
   */
  addSubscriptionCredits(amount: number, planName: string, planId: string): void {
    if (typeof window === 'undefined') {
      return
    }
    
    const userCredits = this.getUserCredits()
    
    const transaction: CreditTransaction = {
      id: this.generateTransactionId(),
      type: 'subscription',
      amount: amount,
      description: `Monthly credits from ${planName} plan`,
      timestamp: new Date().toISOString(),
      planId
    }

    const updatedCredits: UserCredits = {
      balance: userCredits.balance + amount,
      transactions: [transaction, ...userCredits.transactions],
      lastUpdated: new Date().toISOString()
    }

    this.saveCredits(updatedCredits)
    console.log(`🎵 Added ${amount} subscription credits from ${planName}. New balance: ${updatedCredits.balance}`)
  }

  /**
   * Get credit cost estimate for song length with new pricing model
   */
  getCostEstimate(songLengthSeconds: number): {
    credits: number
    price: number
    hasCredits: boolean
    message: string
    explanation: string
  } {
    const credits = getCreditsForLength(songLengthSeconds)
    const price = getPriceForLength(songLengthSeconds)
    const hasCredits = this.hasEnoughCredits(songLengthSeconds)
    const currentBalance = this.getUserCredits().balance

    // Return safe defaults during SSR
    if (typeof window === 'undefined') {
      return {
        credits,
        price,
        hasCredits: true,
        message: `${credits} credits`,
        explanation: getPricingExplanation()
      }
    }

    return {
      credits,
      price,
      hasCredits,
      message: hasCredits 
        ? `${credits} credits (${currentBalance - credits} remaining)`
        : `Need ${credits - currentBalance} more credits`,
      explanation: getPricingExplanation()
    }
  }

  /**
   * Get formatted transaction history
   */
  getTransactionHistory(limit: number = 10): CreditTransaction[] {
    // Return empty array during SSR
    if (typeof window === 'undefined') {
      return []
    }
    
    return this.getUserCredits().transactions.slice(0, limit)
  }

  private saveCredits(credits: UserCredits): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credits))
    } catch (error) {
      console.error('Error saving credits:', error)
    }
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * DEVELOPMENT ONLY: Add testing credits
   */
  addTestingCredits(amount: number = 100): void {
    if (typeof window === 'undefined') {
      console.log('⚠️ addTestingCredits can only be used in browser')
      return
    }

    this.addCredits(amount, `Testing credits - Development use (${amount} credits)`)
    console.log(`🎉 Added ${amount} testing credits to your account!`)
    console.log(`💰 Current balance: ${this.getUserCredits().balance} credits`)
    console.log(`🎵 You can now generate ${Math.floor(this.getUserCredits().balance / 3)} songs at 30s each!`)
  }
}

export const creditSystemService = new CreditSystemService()

// Development helper - expose globally for browser console
if (typeof window !== 'undefined') {
  (window as any).addTestingCredits = (amount?: number) => {
    creditSystemService.addTestingCredits(amount || 100)
  }
  (window as any).checkCredits = () => {
    const credits = creditSystemService.getUserCredits()
    console.log(`💳 Current balance: ${credits.balance} credits`)
    console.log(`📊 Transaction history: ${credits.transactions.length} transactions`)
    return credits
  }
} 