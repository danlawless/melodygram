import React from 'react'
import { Clock } from 'lucide-react'

interface SongLengthSelectorProps {
  selectedLength: number
  onLengthChange: (length: number) => void
  showValidation?: boolean
}

// Song length options
const LENGTH_OPTIONS = [
  { seconds: 10, label: '10s' },
  { seconds: 20, label: '20s' },
  { seconds: 30, label: '30s' },
  { seconds: 60, label: '1m' },
  { seconds: 120, label: '2m' },
  { seconds: 240, label: '4m' }
]

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

export default function SongLengthSelector({ 
  selectedLength, 
  onLengthChange, 
  showValidation = false 
}: SongLengthSelectorProps) {

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <h2 className="text-xl font-semibold text-text-primary">Song Length</h2>
        {showValidation && selectedLength > 0 && (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      {/* Length Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {LENGTH_OPTIONS.map((option) => {
          const isSelected = selectedLength === option.seconds
          const isDiscount = option.seconds >= 60 // Longer durations get visual emphasis
          
          return (
            <button
              key={option.seconds}
              onClick={() => onLengthChange(option.seconds)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                isSelected 
                  ? isDiscount
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
                    : 'border-purple-500 bg-purple-500/10 text-purple-300'
                  : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {isDiscount && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                  SAVE
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-lg">{option.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Simple description */}
      {selectedLength > 0 && (
        <div className="text-sm text-gray-400 text-center">
          {formatTime(selectedLength)} song • 
          {selectedLength <= 30 ? ' Quick & impactful' : selectedLength <= 60 ? ' Verse-chorus structure' : ' Full song experience'}
        </div>
      )}
    </div>
  )
} 