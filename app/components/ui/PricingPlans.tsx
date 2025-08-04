'use client'

import React, { useState, useEffect } from 'react'
import { Check, Star, Zap, CreditCard, Clock } from 'lucide-react'
import { userProfileService, SubscriptionPlan } from '../../services/userProfile'
import { getPricingExplanation } from '../../services/creditSystem'

interface PricingPlansProps {
  onPlanSelected?: (plan: SubscriptionPlan) => void
  showCurrentPlan?: boolean
}

export default function PricingPlans({ onPlanSelected, showCurrentPlan = true }: PricingPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const subscriptionPlans = userProfileService.getSubscriptionPlans()
    setPlans(subscriptionPlans)
    
    if (showCurrentPlan) {
      const current = userProfileService.getCurrentPlan()
      setCurrentPlan(current)
    }
  }, [showCurrentPlan])

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      alert('You are already on the free plan!')
      return
    }

    setLoading(true)
    setSelectedPlan(plan.id)

    try {
      // In a real app, this would integrate with Stripe or another payment processor
      const confirmed = confirm(
        `Subscribe to ${plan.name} plan for $${plan.price}/month?\n\n` +
        `You'll get ${plan.credits} credits (${(plan.credits / 60).toFixed(1)} minutes of music) each month.\n\n` +
        `Click OK to simulate subscription (this is a demo).`
      )

      if (confirmed) {
        const subscribedPlan = userProfileService.subscribeToPlan(plan.id)
        if (subscribedPlan) {
          setCurrentPlan(subscribedPlan)
          onPlanSelected?.(subscribedPlan)
          alert(`🎉 Successfully subscribed to ${plan.name}!\n\nYou now have ${plan.credits} credits to use.`)
          // Refresh the page to update credit balance
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error)
      alert('Error subscribing to plan. Please try again.')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const formatDuration = (credits: number): string => {
    if (credits < 60) return `${credits}s`
    const minutes = Math.floor(credits / 60)
    const seconds = credits % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  const getSavingsText = (plan: SubscriptionPlan): string => {
    if (!plan.savings) return ''
    return `Save ${plan.savings}%`
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-300 mb-2">
          Generate amazing music with AI-powered creativity
        </p>
        <div className="text-sm text-gray-400 bg-white/5 rounded-lg p-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Pricing Explanation</span>
          </div>
          <p>{getPricingExplanation()}</p>
        </div>
      </div>

      {/* Current Plan Banner */}
      {showCurrentPlan && currentPlan && currentPlan.id !== 'free' && (
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Current Plan: {currentPlan.name}</h3>
                <p className="text-sm text-gray-300">
                  ${currentPlan.price}/month • {currentPlan.credits} credits • {formatDuration(currentPlan.credits)} of music
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  userProfileService.cancelSubscription()
                  setCurrentPlan(userProfileService.getCurrentPlan())
                  alert('Subscription cancelled. You can continue using your current credits until they expire.')
                }
              }}
              className="px-4 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Cancel Plan
            </button>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id
          const isPopular = plan.popular
          const isLoading = loading && selectedPlan === plan.id

          return (
            <div
              key={plan.id}
              className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                isCurrentPlan
                  ? 'bg-gradient-to-b from-purple-500/20 to-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/50'
                  : isPopular
                  ? 'bg-gradient-to-b from-blue-500/10 to-blue-600/20 border-blue-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    CURRENT
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-2">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-white">Free</span>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  )}
                </div>
                {plan.savings && (
                  <div className="text-green-400 text-sm font-medium">
                    {getSavingsText(plan)}
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
              </div>

              {/* Credits Info */}
              <div className="text-center mb-6 p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-white">{plan.credits} credits</span>
                </div>
                <p className="text-sm text-gray-400">
                  Generate up to {formatDuration(plan.credits)} of music
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isCurrentPlan
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-not-allowed'
                    : plan.id === 'free'
                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                    : isPopular
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Current Plan</span>
                  </>
                ) : plan.id === 'free' ? (
                  <span>Free Plan</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          All plans include access to our AI music generation engine. 
          You can change or cancel your plan at any time.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          * This is a demo. In production, this would integrate with a real payment processor.
        </p>
      </div>
    </div>
  )
} 