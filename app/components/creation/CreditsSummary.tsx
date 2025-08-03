import React, { useState, useEffect } from 'react'
import { CreditCard, Zap, AlertCircle, Plus } from 'lucide-react'
import { creditSystemService, getCreditsForLength, getPriceForLength } from '../../services/creditSystem'

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
  
  // Load user's credit balance only on client
  useEffect(() => {
    setIsClient(true)
    const credits = creditSystemService.getUserCredits()
    setUserBalance(credits.balance)
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
              credits (${price.toFixed(2)})
            </div>
          </div>
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
                  ? remaining >= 3 ? 'text-green-400' : remaining >= 0 ? 'text-yellow-400' : 'text-white'
                  : 'text-red-400'
              }`}>
                {canAfford ? `${remaining} credits` : `Need ${needed} more`}
              </span>
            </div>
          </div>
          
          {canAfford && remaining < 3 && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Low balance - consider purchasing more credits for future songs
            </p>
          )}
          
          {!canAfford && (
            <p className="text-xs text-red-400 mt-1">
              ❌ Insufficient credits - please purchase more to continue
            </p>
          )}
        </div>
      </div>

      {/* Purchase Credits Button (placeholder for future) */}
      {(!canAfford || userBalance < 10) && (
        <button
          className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          onClick={() => {
            // Placeholder for future payment integration
            alert('Credit purchasing will be available soon! 💳')
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Purchase More Credits</span>
        </button>
      )}
    </div>
  )
} 