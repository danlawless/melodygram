'use client'

import React, { useState } from 'react'
import MurekaApiTest from '../components/test/MurekaApiTest'
import LemonSliceApiTest from '../components/test/LemonSliceApiTest'

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<'mureka' | 'lemonslice'>('mureka')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('mureka')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mureka'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Mureka API Test
            </button>
            <button
              onClick={() => setActiveTab('lemonslice')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'lemonslice'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              LemonSlice API Test
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'mureka' && <MurekaApiTest />}
        {activeTab === 'lemonslice' && <LemonSliceApiTest />}
      </div>
    </div>
  )
} 