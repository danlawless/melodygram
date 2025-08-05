'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Trash2, Copy, Terminal } from 'lucide-react'
import { debugLogger } from '../../services/debugLogger'

interface LogEntry {
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error'
  message: string
  data?: any
}

interface DebugModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DebugModal({ isOpen, onClose }: DebugModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // Subscribe to log updates
    const unsubscribe = debugLogger.subscribe(setLogs)
    
    // Get initial logs
    setLogs(debugLogger.getLogs())

    return unsubscribe
  }, [isOpen])

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  )

  const handleCopyLogs = async () => {
    try {
      const logsText = debugLogger.exportLogs()
      await navigator.clipboard.writeText(logsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy logs:', error)
    }
  }

  const handleDownloadLogs = () => {
    const logsText = debugLogger.exportLogs()
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `melodygram-logs-${new Date().toISOString().slice(0, 19)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearLogs = () => {
    debugLogger.clearLogs()
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/10'
      case 'warn': return 'text-yellow-400 bg-yellow-500/10'
      case 'info': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-gray-300 bg-gray-500/10'
    }
  }

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Terminal className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Debug Console</h2>
              <span className="text-sm text-gray-400">({filteredLogs.length} logs)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Filter Buttons */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
                {(['all', 'log', 'info', 'warn', 'error'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setFilter(level)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      filter === level 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleCopyLogs}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Copy logs to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownloadLogs}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Download logs"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleClearLogs}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Close debug modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter buttons for mobile */}
          <div className="sm:hidden flex items-center space-x-1 bg-gray-800 rounded-lg p-1 mx-6 mt-4">
            {(['all', 'log', 'info', 'warn', 'error'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-2 py-1 text-xs rounded transition-colors flex-1 ${
                  filter === level 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Copy success message */}
          {copied && (
            <div className="mx-6 mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
              <p className="text-sm text-green-400">✅ Logs copied to clipboard!</p>
            </div>
          )}

          {/* Logs Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No logs captured yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Logs will appear here when you generate a MelodyGram
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-sm">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getLogLevelColor(log.level)} border-opacity-30`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getLogLevelIcon(log.level)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap break-all text-gray-300 leading-relaxed">
                          {log.message}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Debug mode enabled - logs are being captured</span>
              <button
                onClick={() => debugLogger.disableDebugMode()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Disable debug mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}