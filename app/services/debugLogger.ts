'use client'

interface LogEntry {
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error'
  message: string
  data?: any
}

class DebugLoggerService {
  private logs: LogEntry[] = []
  private listeners: Array<(logs: LogEntry[]) => void> = []
  private originalConsole: {
    log: typeof console.log
    info: typeof console.info
    warn: typeof console.warn
    error: typeof console.error
  }
  private isCapturing = false

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }
  }

  startCapturing() {
    if (this.isCapturing) return
    
    this.isCapturing = true
    this.logs = [] // Clear previous logs
    
    // Override console methods to capture logs
    console.log = (...args) => {
      this.addLog('log', args)
      this.originalConsole.log(...args)
    }
    
    console.info = (...args) => {
      this.addLog('info', args)
      this.originalConsole.info(...args)
    }
    
    console.warn = (...args) => {
      this.addLog('warn', args)
      this.originalConsole.warn(...args)
    }
    
    console.error = (...args) => {
      this.addLog('error', args)
      this.originalConsole.error(...args)
    }
    
    this.notifyListeners()
  }

  stopCapturing() {
    if (!this.isCapturing) return
    
    this.isCapturing = false
    
    // Restore original console methods
    console.log = this.originalConsole.log
    console.info = this.originalConsole.info
    console.warn = this.originalConsole.warn
    console.error = this.originalConsole.error
  }

  private addLog(level: LogEntry['level'], args: any[]) {
    const message = args.map(arg => {
      if (typeof arg === 'string') return arg
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: args.length > 1 ? args.slice(1) : undefined
    }

    this.logs.push(logEntry)
    
    // Keep only last 500 logs to prevent memory issues
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500)
    }
    
    this.notifyListeners()
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
    this.notifyListeners()
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]))
  }

  exportLogs(): string {
    return this.logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n')
  }

  // Check if debug mode is enabled
  isDebugMode(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check for debug mode in localStorage or URL params
    const localStorageDebug = localStorage.getItem('melodygram_debug') === 'true'
    const urlParams = new URLSearchParams(window.location.search)
    const urlDebug = urlParams.get('debug') === 'true'
    
    return localStorageDebug || urlDebug
  }

  enableDebugMode() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('melodygram_debug', 'true')
    }
  }

  disableDebugMode() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('melodygram_debug')
    }
  }
}

export const debugLogger = new DebugLoggerService()