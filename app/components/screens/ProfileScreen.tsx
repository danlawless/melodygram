'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, 
  ArrowLeft, 
  Save, 
  CreditCard, 
  Plus, 
  Settings, 
  Wallet, 
  Crown, 
  Calendar,
  Trash2,
  Check,
  Star,
  Zap
} from 'lucide-react'
import { userProfileService, UserProfile, PaymentMethod, CreditPackage } from '../../services/userProfile'
import { creditSystemService } from '../../services/creditSystem'
import { useToast } from '../ui/Toast'
import AvatarEditor from '../profile/AvatarEditor'

interface ProfileScreenProps {
  onBack: () => void
}

type ActiveTab = 'profile' | 'credits' | 'payment' | 'billing'

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  
  // Avatar editor state
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false)
  
  // Credit state
  const [creditBalance, setCreditBalance] = useState(0)
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([])
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  
  // Payment state
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = () => {
    setIsLoading(true)
    try {
      let userProfile = userProfileService.getUserProfile()
      
      // Initialize default profile if none exists
      if (!userProfile) {
        userProfile = userProfileService.initializeDefaultProfile()
      }
      
      setProfile(userProfile)
      setName(userProfile.name)
      setEmail(userProfile.email)
      setBio(userProfile.bio)
      setAvatar(userProfile.avatar || '')
      setPaymentMethods(userProfile.paymentMethods)
      
      // Load credit balance
      const credits = creditSystemService.getUserCredits()
      setCreditBalance(credits.balance)
      
      // Load credit packages
      setCreditPackages(userProfileService.getCreditPackages())
      
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setIsSaving(true)
    try {
      const updatedProfile = userProfileService.saveProfile({
        ...profile,
        name,
        email,
        bio,
        avatar
      })
      
      setProfile(updatedProfile)
      showToast({
        type: 'success',
        title: 'Profile saved successfully!',
        message: 'Your changes have been saved.'
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      showToast({
        type: 'error',
        title: 'Failed to save profile',
        message: 'Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePurchaseCredits = async (creditPackage: CreditPackage) => {
    try {
      // In a real app, this would integrate with a payment processor
      // For now, we'll simulate the purchase
      console.log(`Purchasing ${creditPackage.credits} credits for $${creditPackage.price}`)
      
      // Add credits to balance
      creditSystemService.addCredits(creditPackage.credits, `Purchased ${creditPackage.name}`)
      
      // Update balance
      const newBalance = creditSystemService.getUserCredits().balance
      setCreditBalance(newBalance)
      
      setIsTopUpOpen(false)
      showToast({
        type: 'success',
        title: 'Credits purchased!',
        message: `Successfully added ${creditPackage.credits} credits to your account.`
      })
      
    } catch (error) {
      console.error('Error purchasing credits:', error)
      showToast({
        type: 'error',
        title: 'Purchase failed',
        message: 'Failed to purchase credits. Please try again.'
      })
    }
  }

  const handleAddPaymentMethod = () => {
    // Simulate adding a payment method
    const newPaymentMethod = userProfileService.addPaymentMethod({
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: paymentMethods.length === 0
    })
    
    setPaymentMethods([...paymentMethods, newPaymentMethod])
    setIsAddingPayment(false)
    showToast({
      type: 'success',
      title: 'Payment method added',
      message: 'Your card has been successfully added.'
    })
  }

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      userProfileService.removePaymentMethod(paymentMethodId)
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodId))
      showToast({
        type: 'success',
        title: 'Payment method removed',
        message: 'Your card has been successfully removed.'
      })
    }
  }

  // Handle avatar change
  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatar(newAvatarUrl)
    setIsAvatarEditorOpen(false)
    showToast({
      type: 'success',
      title: 'Avatar updated!',
      message: 'Your profile picture has been updated.'
    })
  }

  const getUserStats = () => {
    if (!profile) return { videosCreated: 0, daysActive: 0, totalCreditsUsed: 0 }
    return userProfileService.getUserStats()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const stats = getUserStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-bg-secondary hover:bg-bg-accent transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <p className="text-gray-400">Manage your account & billing</p>
              </div>
            </div>
          </div>

          {/* Credit Balance Header */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Credit Balance</p>
                  <p className="text-2xl font-bold text-white">{creditBalance} credits</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'credits', label: 'Credits', icon: Zap },
              { id: 'payment', label: 'Payment', icon: CreditCard },
              { id: 'billing', label: 'Billing', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full mx-auto shadow-glow overflow-hidden border-4 border-melody-purple/20">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-melody-gradient flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsAvatarEditorOpen(true)}
                className="text-melody-purple hover:text-melody-pink transition-colors text-sm font-medium"
              >
                Change Avatar
              </button>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
                  placeholder="Enter your display name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-melody-purple/20 focus:border-melody-purple transition-colors resize-none"
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-melody-gradient text-white font-semibold py-4 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>

            {/* Account Stats */}
            <div className="mt-8 p-6 bg-bg-secondary/50 rounded-xl border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Account Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-melody-purple">{stats.videosCreated}</div>
                  <div className="text-sm text-text-secondary">Videos Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-melody-pink">{stats.daysActive}</div>
                  <div className="text-sm text-text-secondary">Days Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.totalCreditsUsed}</div>
                  <div className="text-sm text-text-secondary">Credits Used</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Current Balance */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Current Balance</h2>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {creditBalance} Credits
                </div>
              </div>
              
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Buy More Credits
              </button>
            </div>

            {/* Transaction History would go here */}
            <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* Payment Methods */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
                <button
                  onClick={() => setIsAddingPayment(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No payment methods added</p>
                  <button
                    onClick={() => setIsAddingPayment(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform"
                  >
                    Add Your First Card
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="bg-bg-secondary border border-border-subtle rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{method.brand} •••• {method.last4}</span>
                            {method.isDefault && (
                              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">Expires {method.expiryMonth}/{method.expiryYear}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Subscription Info */}
            <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Free Plan</p>
                  <p className="text-sm text-gray-400">3 free credits to get started</p>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:scale-105 transition-transform">
                Upgrade to Premium
              </button>
            </div>

            {/* Billing History */}
            <div className="bg-bg-secondary/50 rounded-xl border border-border-subtle p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
              <p className="text-gray-400 text-center py-8">No billing history yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Credit Top-Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Buy Credits</h3>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {creditPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`relative border rounded-xl p-4 cursor-pointer transition-all hover:scale-105 ${
                    pkg.popular 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() => handlePurchaseCredits(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{pkg.name}</h4>
                      <p className="text-gray-400">{pkg.credits} credits</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">${pkg.price}</div>
                      {pkg.savings && (
                        <div className="text-sm text-green-400">{pkg.savings}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">${(pkg.price / pkg.credits).toFixed(2)} per credit</span>
                    <Star className={`w-4 h-4 ${pkg.popular ? 'text-yellow-400' : 'text-gray-600'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Credits never expire • Secure payment • Instant delivery
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Add Payment Method</h3>
              <button
                onClick={() => setIsAddingPayment(false)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">
                In a real app, this would integrate with Stripe, PayPal, or another payment processor.
              </p>
              <button
                onClick={handleAddPaymentMethod}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform"
              >
                Add Demo Card (Visa •••• 4242)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Editor Modal */}
      {isAvatarEditorOpen && (
        <AvatarEditor
          currentAvatar={avatar}
          onAvatarChange={handleAvatarChange}
          onClose={() => setIsAvatarEditorOpen(false)}
        />
      )}
    </div>
  )
} 