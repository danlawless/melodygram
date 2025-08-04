import React, { useState, useEffect } from 'react'
import { CreditCard, Zap, AlertCircle, Plus, Crown, Clock, Star } from 'lucide-react'
import { creditSystemService, getCreditsForLength, getPriceForLength, getPricingExplanation } from '../../services/creditSystem'
import { userProfileService, SubscriptionPlan } from '../../services/userProfile'

interface CreditsSummaryProps {
  songLength: number
  songTitle: string
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

export default function CreditsSummary({ songLength, songTitle }: CreditsSummaryProps) {
  const [userBalance, setUserBalance] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  
  // Load user's credit balance and subscription info only on client
  useEffect(() => {
    setIsClient(true)
    const credits = creditSystemService.getUserCredits()
    setUserBalance(credits.balance)
    
    const plan = userProfileService.getCurrentPlan()
    setCurrentPlan(plan)
    setHasActiveSubscription(userProfileService.hasActiveSubscription())
  }, [])
  
  if (songLength <= 0) return null
  
  // Show loading state during SSR/hydration
  if (!isClient) {
    return (
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl animate-entrance-delay-7">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Credits & Pricing</h3>
        </div>
        <div className="text-sm text-gray-400">Loading credit information...</div>
      </div>
    )
  }
  
  const credits = getCreditsForLength(songLength)
  const price = getPriceForLength(songLength)
  const canAfford = userBalance >= credits
  const remaining = userBalance - credits
  const needed = credits - userBalance

  return (
    <div className="space-y-4">
      {/* Pricing Explanation */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h4 className="font-medium text-white">How Credits Work</h4>
        </div>
        <p className="text-sm text-gray-300">{getPricingExplanation()}</p>
      </div>

      {/* Current Plan Info */}
      {currentPlan && (
        <div className={`p-4 rounded-xl border ${
          hasActiveSubscription 
            ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20' 
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasActiveSubscription 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gray-500/20'
              }`}>
                {hasActiveSubscription ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Star className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">
                    {currentPlan.name} Plan
                  </h4>
                  {currentPlan.popular && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                      POPULAR
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`} • 
                  {currentPlan.credits} credits • 
                  {formatTime(currentPlan.credits)} of music
                </p>
              </div>
            </div>
            {!hasActiveSubscription && currentPlan.id === 'free' && (
              <button
                onClick={() => {
                  // This would open the pricing plans modal/page
                  window.open('/pricing', '_blank')
                }}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current Balance */}
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Your Balance</h3>
              {songLength > 0 && (
                <span className="text-xs text-gray-400 bg-purple-500/20 px-2 py-1 rounded-full">
                  {formatTime(songLength)} song
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">Available credits</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">
            {userBalance}
          </div>
          <div className="text-sm text-gray-400">credits</div>
        </div>
      </div>

      {/* Song Cost Breakdown */}
      <div className={`p-4 backdrop-blur-sm border rounded-xl ${
        canAfford 
          ? 'bg-white/5 border-white/10' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              canAfford
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                "{songTitle || 'Your Song'}"
              </h3>
              <p className={`text-sm ${canAfford ? 'text-gray-400' : 'text-red-300'}`}>
                {formatTime(songLength)} song generation
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${canAfford ? 'text-white' : 'text-red-300'}`}>
              -{credits}
            </div>
            <div className="text-sm text-gray-400">
              credits (${price.toFixed(2)} value)
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="text-xs text-gray-500 mb-3 p-2 bg-black/20 rounded">
          💡 <strong>New Pricing:</strong> {songLength} seconds = {credits} credits = ${price.toFixed(2)} value
        </div>

        {/* Balance After Generation */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Balance after generation:</span>
            <div className="flex items-center space-x-2">
              {!canAfford && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`font-semibold ${
                canAfford 
                  ? remaining >= 60 ? 'text-green-400' : remaining >= 30 ? 'text-yellow-400' : 'text-white'
                  : 'text-red-400'
              }`}>
                {canAfford ? `${remaining} credits` : `Need ${needed} more`}
              </span>
            </div>
          </div>
          
          {canAfford && remaining < 60 && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Low balance - consider upgrading your plan for more monthly credits
            </p>
          )}
          
          {!canAfford && (
            <p className="text-xs text-red-400 mt-1">
              ❌ Insufficient credits - please upgrade your plan or buy more credits
            </p>
          )}
        </div>
      </div>

      {/* Purchase/Upgrade Options */}
      {(!canAfford || userBalance < 120) && (
        <div className="space-y-2">
          {/* Subscription Upgrade (Primary CTA) */}
          {currentPlan?.id === 'free' && (
            <button
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              onClick={() => {
                // In a real app, this would navigate to pricing page or open modal
                alert('🎵 Check out our monthly plans!\n\nStarter: $8/month (160 credits)\nPremium: $20/month (444 credits + 10% bonus)\nPro: $40/month (941 credits + 15% bonus)\nEnterprise: $100/month (2500 credits + 20% bonus)\n\nMonthly plans give you the best value!')
              }}
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Monthly Plan</span>
            </button>
          )}

          {/* One-time Credit Purchase */}
          <button
            className={`w-full flex items-center justify-center space-x-2 p-3 font-medium rounded-xl transition-opacity ${
              currentPlan?.id === 'free' 
                ? 'bg-white/10 text-gray-300 hover:bg-white/15' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
            }`}
            onClick={() => {
              // Placeholder for future payment integration
              alert('💳 One-time credit top-ups:\n\n60 credits - $3.00\n200 credits - $10.00\n600 credits - $30.00\n1200 credits - $60.00\n\nCredit purchasing will be available soon!')
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{currentPlan?.id === 'free' ? 'Buy Credits (One-time)' : 'Top-up Credits'}</span>
          </button>
        </div>
      )}
    </div>
  )
} 