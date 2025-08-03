import React, { useState, useEffect } from 'react'
import { Clock, CreditCard } from 'lucide-react'
import { creditSystemService, getCreditsForLength } from '../../services/creditSystem'

interface SongLengthSelectorProps {
  selectedLength: number
  onLengthChange: (length: number) => void
  showValidation?: boolean
}

// Credit pricing tiers
const LENGTH_TIERS = [
  { seconds: 10, credits: 1 },
  { seconds: 20, credits: 2 },
  { seconds: 30, credits: 3 },
  { seconds: 60, credits: 5, discount: true },
  { seconds: 120, credits: 10, discount: true },
  { seconds: 240, credits: 20, discount: true }
]

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

const isDiscountTier = (seconds: number): boolean => {
  const tier = LENGTH_TIERS.find(t => t.seconds === seconds)
  return tier?.discount || false
}

export default function SongLengthSelector({ 
  selectedLength, 
  onLengthChange, 
  showValidation = false 
}: SongLengthSelectorProps) {
  
  const [userBalance, setUserBalance] = useState(0)
  const [isClient, setIsClient] = useState(false)
  
  // Load user's credit balance only on client
  useEffect(() => {
    setIsClient(true)
    const credits = creditSystemService.getUserCredits()
    setUserBalance(credits.balance)
  }, [])
  
  const credits = getCreditsForLength(selectedLength)
  const canAfford = isClient ? userBalance >= credits : true // Default to true during SSR
  const isDiscount = isDiscountTier(selectedLength)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-text-primary">Song Length</h2>
          {showValidation && selectedLength > 0 && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        
        {/* Simple Credits Display */}
        {selectedLength > 0 && (
          <div className="flex items-center space-x-2">
            {isDiscount && (
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                SAVE
              </span>
            )}
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
              canAfford 
                ? 'bg-purple-500/20 text-purple-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              <CreditCard className="w-4 h-4" />
              <span className="font-semibold">{credits} credit{credits !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Length Slider */}
      <div className="relative">
        {/* Slider Track */}
        <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
          {/* Clickable segments */}
          <div className="absolute inset-0 flex">
            {LENGTH_TIERS.map((tier) => {
              const isSelected = selectedLength === tier.seconds
                          const tierCanAfford = isClient ? userBalance >= tier.credits : true
            
            return (
                <button
                  key={tier.seconds}
                  onClick={() => onLengthChange(tier.seconds)}
                  disabled={!tierCanAfford}
                  className={`h-full flex-1 flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105 border-r border-gray-700 last:border-r-0 ${
                    !tierCanAfford
                      ? 'bg-red-500/20 text-red-300 cursor-not-allowed opacity-50'
                      : isSelected 
                        ? tier.discount
                          ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-white z-10'
                          : 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white z-10'
                        : tier.discount
                          ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-300'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3 mb-1" />
                  <span>{formatTime(tier.seconds)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tick marks and labels */}
        <div className="flex justify-between mt-2 px-1">
          {LENGTH_TIERS.map((tier) => {
            const isSelected = selectedLength === tier.seconds
            const tierCanAfford = isClient ? userBalance >= tier.credits : true
            
            return (
              <div key={tier.seconds} className="flex flex-col items-center">
                <div className={`w-1 h-4 rounded-full ${
                  !tierCanAfford
                    ? 'bg-red-500'
                    : isSelected 
                      ? tier.discount ? 'bg-yellow-500' : 'bg-purple-500'
                      : 'bg-gray-600'
                }`} />
                <div className="mt-1 text-center">
                  <div className={`text-xs font-medium ${
                    !tierCanAfford
                      ? 'text-red-300'
                      : isSelected ? 'text-white' : 'text-gray-400'
                  }`}>
                    {tier.credits}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Simple description */}
      {selectedLength > 0 && (
        <div className="text-sm text-gray-400 text-center">
          {formatTime(selectedLength)} song • {credits} credit{credits !== 1 ? 's' : ''} • 
          {selectedLength <= 30 ? ' Quick & impactful' : selectedLength <= 60 ? ' Verse-chorus structure' : ' Full song experience'}
        </div>
      )}
    </div>
  )
} 