'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

interface ToastProviderProps {
  children: React.ReactNode
}

// Toast context for global state management
const ToastContext = React.createContext<{
  showToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
} | null>(null)

// Individual Toast Component
function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Fade in
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto remove after duration
    if (toast.duration !== 0) { // 0 means no auto-remove
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration || 4000)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // Match animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4"
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-500/10`
      case 'error':
        return `${baseStyles} border-red-500 bg-red-500/10`
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-500/10`
      case 'info':
        return `${baseStyles} border-blue-500 bg-blue-500/10`
    }
  }

  return (
    <div
      className={`
        relative max-w-sm w-full backdrop-blur-xl rounded-xl p-4 shadow-2xl transition-all duration-300 transform
        ${getStyles()}
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-gray-300">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container
function ToastContainer({ toasts, onRemove }: { toasts: ToastData[], onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Toast Provider Component
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastData = {
      ...toastData,
      id,
      duration: toastData.duration ?? 4000
    }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Listen for custom toast events
  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      showToast(event.detail)
    }

    window.addEventListener('toast', handleToastEvent as EventListener)
    return () => {
      window.removeEventListener('toast', handleToastEvent as EventListener)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Custom hook to use toast
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience functions
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'success', title, message, duration }
      })
      window.dispatchEvent(event)
    }
  },
  error: (title: string, message?: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', title, message, duration }
      })
      window.dispatchEvent(event)
    }
  },
  warning: (title: string, message?: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'warning', title, message, duration }
      })
      window.dispatchEvent(event)
    }
  },
  info: (title: string, message?: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'info', title, message, duration }
      })
      window.dispatchEvent(event)
    }
  }
} 