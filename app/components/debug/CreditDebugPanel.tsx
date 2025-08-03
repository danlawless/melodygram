'use client'

import React from 'react'
import { Plus, CreditCard, Trash2 } from 'lucide-react'
import { creditSystemService } from '../../services/creditSystem'

export default function CreditDebugPanel() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleAdd100Credits = () => {
    try {
      creditSystemService.addCredits(100, 'Testing credits - Debug panel')
      alert('✅ Added 100 credits! Check your balance.')
      window.location.reload() // Refresh to update UI
    } catch (error) {
      console.error('Error adding credits:', error)
      alert('❌ Error adding credits. Check console.')
    }
  }

  const handleAdd1000Credits = () => {
    try {
      creditSystemService.addCredits(1000, 'Testing credits - Debug panel (1000)')
      alert('✅ Added 1000 credits! You\'re set for extensive testing.')
      window.location.reload() // Refresh to update UI
    } catch (error) {
      console.error('Error adding credits:', error)
      alert('❌ Error adding credits. Check console.')
    }
  }

  const handleResetCredits = () => {
    if (confirm('⚠️ Reset all credits to 3? This will clear your transaction history.')) {
      try {
        localStorage.removeItem('melodygram_credits')
        alert('✅ Credits reset to default (3). Page will refresh.')
        window.location.reload()
      } catch (error) {
        console.error('Error resetting credits:', error)
        alert('❌ Error resetting credits. Check console.')
      }
    }
  }

  const checkCurrentBalance = () => {
    try {
      const credits = creditSystemService.getUserCredits()
      alert(`💳 Current Balance: ${credits.balance} credits\n📊 Transactions: ${credits.transactions.length}`)
      console.log('Credit Details:', credits)
    } catch (error) {
      console.error('Error checking credits:', error)
      alert('❌ Error checking credits. Check console.')
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600/90 backdrop-blur-sm border border-red-500 rounded-lg p-3 space-y-2">
      <div className="text-white text-xs font-bold mb-2">🔧 DEV ONLY - Credit Debug</div>
      
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleAdd100Credits}
          className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>+100 Credits</span>
        </button>

        <button
          onClick={handleAdd1000Credits}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>+1000 Credits</span>
        </button>

        <button
          onClick={checkCurrentBalance}
          className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
        >
          <CreditCard className="w-3 h-3" />
          <span>Check Balance</span>
        </button>

        <button
          onClick={handleResetCredits}
          className="flex items-center space-x-1 px-2 py-1 bg-red-700 hover:bg-red-800 text-white text-xs rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Reset Credits</span>
        </button>
      </div>
    </div>
  )
} 