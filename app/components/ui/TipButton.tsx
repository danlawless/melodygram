'use client'

import React, { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface TipButtonProps {
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

export default function TipButton({ 
  title, 
  content, 
  position = 'top',
  size = 'md' 
}: TipButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-bg-accent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-bg-accent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-bg-accent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-bg-accent'
  }

  const showTooltip = isVisible || isHovered

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${sizeClasses[size]} 
          text-text-secondary hover:text-melody-purple transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-melody-purple/20 rounded-full
          flex items-center justify-center
        `}
        aria-label={`Tip: ${title}`}
      >
        <HelpCircle className="w-full h-full" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className={`
            absolute z-50 ${positionClasses[position]}
            bg-bg-accent border border-border-subtle rounded-xl shadow-lg
            p-4 max-w-xs w-max
            animate-in fade-in-0 zoom-in-95 duration-200
          `}
        >
          {/* Close button for mobile */}
          {isVisible && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1 text-text-secondary hover:text-text-primary transition-colors md:hidden"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">
              {title}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {content}
            </p>
          </div>

          {/* Arrow */}
          <div 
            className={`
              absolute w-0 h-0 border-4 ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  )
} 