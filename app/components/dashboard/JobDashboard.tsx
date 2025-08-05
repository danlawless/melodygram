'use client'

import { useState, useEffect } from 'react'
import BlurredAvatarPreview from '../ui/BlurredAvatarPreview'

interface Job {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at?: string
  progress?: number
  cost?: number
  video_url?: string
  thumbnail_url?: string
  error_message?: string
  img_url?: string
  audio_url?: string
}

interface AccountInfo {
  balance?: number
  currency?: string
  usage_today?: number
  usage_month?: number
  email?: string
  plan?: string
}

export default function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [account, setAccount] = useState<AccountInfo>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancellingJob, setCancellingJob] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('/api/lemonslice/account')
      const data = await response.json()
      
      if (response.ok) {
        setAccount(data)
      } else {
        console.log('Account info not available:', data)
        setAccount({ balance: 0, currency: 'USD' })
      }
    } catch (error) {
      console.log('Account fetch failed:', error)
      setAccount({ balance: 0, currency: 'USD' })
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/lemonslice/jobs?limit=50')
      const data = await response.json()
      
      if (response.ok && data._success) {
        // Handle different response formats
        const jobList = data.generations || data.jobs || data.data || []
        setJobs(Array.isArray(jobList) ? jobList : [])
      } else {
        console.log('Jobs list not available:', data)
        setJobs([])
      }
    } catch (error) {
      console.log('Jobs fetch failed:', error)
      setJobs([])
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([fetchAccountInfo(), fetchJobs()])
    setRefreshing(false)
  }

  const cancelJob = async (jobId: string) => {
    setCancellingJob(jobId)
    try {
      const response = await fetch(`/api/lemonslice/jobs/${jobId}/cancel`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Job ${jobId} cancelled successfully!`)
        await refreshData() // Refresh to see updated status
      } else {
        alert(`❌ Failed to cancel job: ${data.message || data.error}`)
      }
    } catch (error) {
      alert(`❌ Cancel failed: ${error}`)
    } finally {
      setCancellingJob(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'processing': return 'text-blue-400'
      case 'pending': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      case 'cancelled': return 'text-gray-400'
      default: return 'text-gray-300'
    }
  }

  const formatCost = (cost?: number) => {
    if (cost === undefined) return '~$0.10'
    return `$${cost.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    setLoading(true)
    refreshData().finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              🎬 LemonSlice Job Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Monitor your avatar generation jobs and account balance</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            💳 Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                ${account.balance?.toFixed(2) || '?.??'}
              </div>
              <div className="text-sm text-gray-400">Current Balance</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                ${account.usage_today?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-400">Used Today</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                ${account.usage_month?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-400">Used This Month</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {account.plan || 'API'}
              </div>
              <div className="text-sm text-gray-400">Plan Type</div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📋 Recent Jobs ({jobs.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No jobs found or API doesn't support job listing</p>
              <p className="text-sm text-gray-500 mt-2">
                Jobs may not be visible via API, but check your LemonSlice dashboard for complete info
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Job ID</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Progress</th>
                    <th className="text-left py-3 px-4">Cost</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.job_id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Mini preview for pending/processing jobs */}
                          {(job.status === 'pending' || job.status === 'processing') ? (
                            <BlurredAvatarPreview 
                              status={job.status as 'pending' | 'processing' | 'completed' | 'failed'}
                              imageUrl={job.img_url}
                              size="small"
                              className="rounded-lg"
                              showStatusText={false}
                            />
                          ) : job.thumbnail_url || job.video_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700">
                              <img 
                                src={job.thumbnail_url || job.video_url} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">📹</div>'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                              📹
                            </div>
                          )}
                          
                          <div className="font-mono text-xs">
                            {job.job_id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className={`py-3 px-4 font-medium ${getStatusColor(job.status)}`}>
                        <div className="flex items-center gap-2">
                          {job.status === 'processing' && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          )}
                          {job.status === 'pending' && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          )}
                          {job.status}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {job.progress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{job.progress}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {formatCost(job.cost)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {(job.status === 'pending' || job.status === 'processing') && (
                            <button
                              onClick={() => cancelJob(job.job_id)}
                              disabled={cancellingJob === job.job_id}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {cancellingJob === job.job_id ? '⏳' : '🛑 Cancel'}
                            </button>
                          )}
                          {job.video_url && (
                            <a
                              href={job.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              📹 View
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Emergency Stop */}
        <div className="mt-8 bg-red-900/20 border border-red-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            🚨 Emergency Cost Control
          </h3>
          <p className="text-gray-300 mb-4">
            If you're seeing unexpected charges or stuck jobs, try these steps:
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <div>1. Check your LemonSlice dashboard directly: <a href="https://lemonslice.com/dashboard" target="_blank" className="text-blue-400 hover:underline">lemonslice.com/dashboard</a></div>
            <div>2. Cancel any pending jobs using the buttons above</div>
            <div>3. Contact LemonSlice support if charges seem incorrect</div>
            <div>4. Consider setting up billing alerts in your LemonSlice account</div>
          </div>
        </div>
      </div>
    </div>
  )
} 