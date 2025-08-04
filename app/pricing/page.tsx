'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import PricingPlans from '../components/ui/PricingPlans'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="p-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-12">
        <PricingPlans />
      </div>
    </div>
  )
} 