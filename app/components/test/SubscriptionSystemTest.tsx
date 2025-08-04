'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Crown, Zap, Clock, DollarSign } from 'lucide-react'
import { userProfileService, SubscriptionPlan } from '../../services/userProfile'
import { creditSystemService, getPricingExplanation } from '../../services/creditSystem'

export default function SubscriptionSystemTest() {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([])
  const [creditBalance, setCreditBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const plan = userProfileService.getCurrentPlan()
    const plans = userProfileService.getSubscriptionPlans()
    const credits = creditSystemService.getUserCredits()
    
    setCurrentPlan(plan)
    setAllPlans(plans)
    setCreditBalance(credits.balance)
  }

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true)
    try {
      const plan = userProfileService.subscribeToPlan(planId)
      if (plan) {
        loadData() // Refresh data
        alert(`🎉 Successfully subscribed to ${plan.name}! You received ${plan.credits} credits.`)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('❌ Subscription failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (confirm('Cancel your subscription? You\'ll keep current credits.')) {
      userProfileService.cancelSubscription()
      loadData()
      alert('✅ Subscription cancelled.')
    }
  }

  const formatDuration = (credits: number): string => {
    if (credits < 60) return `${credits}s`
    const minutes = Math.floor(credits / 60)
    const seconds = credits % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          🎵 Subscription System Test
        </h1>
        <p className="text-gray-400">Testing the new premium subscription plans and credit system</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Current Plan</h3>
          </div>
          {currentPlan && (
            <div>
              <p className="text-xl font-bold text-white">{currentPlan.name}</p>
              <p className="text-sm text-gray-400">
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
              </p>
              <p className="text-sm text-gray-400">
                {currentPlan.credits} credits/month
              </p>
            </div>
          )}
        </div>

        {/* Credit Balance */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Credit Balance</h3>
          </div>
          <p className="text-xl font-bold text-white">{creditBalance} credits</p>
          <p className="text-sm text-gray-400">
            ≈ {formatDuration(creditBalance)} of music
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Pricing</h3>
          </div>
          <p className="text-sm text-gray-300">{getPricingExplanation()}</p>
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Test Subscription Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allPlans.filter(p => p.id !== 'free').map(plan => (
            <button
              key={plan.id}
              onClick={() => handleSubscribe(plan.id)}
              disabled={isLoading || currentPlan?.id === plan.id}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                currentPlan?.id === plan.id
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
              } disabled:opacity-50`}
            >
              {currentPlan?.id === plan.id ? '✅ Active' : `Subscribe ${plan.name}`}
            </button>
          ))}
        </div>

        {currentPlan?.id !== 'free' && (
          <button
            onClick={handleCancel}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* All Plans Display */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {allPlans.map(plan => (
            <div
              key={plan.id}
              className={`p-4 rounded-xl border ${
                currentPlan?.id === plan.id
                  ? 'bg-gradient-to-b from-purple-500/20 to-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/50'
                  : plan.popular
                  ? 'bg-gradient-to-b from-blue-500/10 to-blue-600/20 border-blue-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="text-center mb-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                <div className="text-2xl font-bold text-white">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </div>
                {plan.price > 0 && <div className="text-sm text-gray-400">/month</div>}
                {plan.savings && (
                  <div className="text-green-400 text-sm font-medium">
                    Save {plan.savings}%
                  </div>
                )}
              </div>

              <div className="text-center mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-lg font-bold text-white">{plan.credits} credits</div>
                <div className="text-sm text-gray-400">
                  {formatDuration(plan.credits)} of music
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="text-gray-300">
                    • {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit System Info */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">Credit System Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">Pricing Structure:</h4>
            <ul className="space-y-1">
              <li>• 1 second = 1 credit</li>
              <li>• 60 seconds = $3.00</li>
              <li>• 1 credit = $0.05</li>
              <li>• Monthly plans include discounts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Plan Benefits:</h4>
            <ul className="space-y-1">
              <li>• Free: 3 credits (testing)</li>
              <li>• Starter: 160 credits ($8/mo)</li>
              <li>• Premium: 444 credits + 10% bonus</li>
              <li>• Pro: 941 credits + 15% bonus</li>
              <li>• Enterprise: 2500 credits + 20% bonus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 