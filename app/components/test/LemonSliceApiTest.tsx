'use client'

import React, { useState } from 'react'
import { useLemonSliceAPI } from '../../hooks/useLemonSliceAPI'
import { lemonSliceApiService } from '../../services/lemonSliceApi'

// Local interface for image generation options
interface ImageGenerationOptions {
  prompt: string
  style?: string
  mood?: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
}

// Safe import for image generation service
let imageGenerationService: any = null

try {
  const imageGenModule = require('../../services/imageGeneration')
  imageGenerationService = imageGenModule.imageGenerationService
  console.log('✅ Image generation service loaded successfully')
} catch (error) {
  console.error('❌ Failed to load image generation service:', error)
}

export default function LemonSliceApiTest() {
  console.log('🎨 LemonSliceApiTest component loading!')
  
  const {
    isCreating,
    progress,
    error,
    avatarUrl,
    presets,
    createAvatarFromFiles,
    loadPresets,
    clearError,
    reset
  } = useLemonSliceAPI()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [testResults, setTestResults] = useState<string[]>([])

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState<string>('')
  const [imageStyle, setImageStyle] = useState<string>('')
  const [imageMood, setImageMood] = useState<string>('')
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  // Manual URL Test State
  const [manualImageUrl, setManualImageUrl] = useState<string>('')
  const [manualAudioUrl, setManualAudioUrl] = useState<string>('')
  const [isManualTesting, setIsManualTesting] = useState<boolean>(false)
  const [manualResult, setManualResult] = useState<any>(null)

  // Job Status Checker State
  const [jobId, setJobId] = useState('7e86d7fd-25d2-4fda-a81c-b2a6800470ef') // Your recent job
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      addTestResult(`Image uploaded: ${file.name} (${file.type})`)
    }
  }

  const testHealthCheck = async () => {
    try {
      const isHealthy = await lemonSliceApiService.healthCheck()
      addTestResult(`Health check: ${isHealthy ? 'PASS' : 'FAIL'}`)
    } catch (error) {
      addTestResult(`Health check error: ${error}`)
    }
  }

  const testLoadPresets = async () => {
    try {
      await loadPresets()
      addTestResult(`Presets loaded: ${presets.length} presets found`)
    } catch (error) {
      addTestResult(`Presets error: ${error}`)
    }
  }

  const testCreateAvatar = async () => {
    if (!imageFile) {
      addTestResult('Error: No image file selected')
      return
    }
    if (!audioUrl) {
      addTestResult('Error: No audio URL provided')
      return
    }

         try {
       addTestResult('Starting avatar creation...')
       const result = await createAvatarFromFiles(imageFile, audioUrl, {
         model: 'V2.5',
         resolution: '512',
         animation_style: 'autoselect',
         expressiveness: 0.8,
         crop_head: false
       })
      
      if (result) {
        addTestResult(`Avatar created successfully: ${result}`)
      } else {
        addTestResult('Avatar creation failed - no result returned')
      }
    } catch (error) {
      addTestResult(`Avatar creation error: ${error}`)
    }
  }

  const testManualUrlGeneration = async () => {
    if (!manualImageUrl.trim()) {
      addTestResult('Error: Manual image URL is required')
      return
    }
    if (!manualAudioUrl.trim()) {
      addTestResult('Error: Manual audio URL is required')
      return
    }

    setIsManualTesting(true)
    setManualResult(null)

    try {
      // COST PROTECTION: Estimate cost before proceeding
      const { estimateLemonSliceCost, checkCostLimit, COST_LIMITS } = await import('../../utils/costEstimator')
      const costEstimate = estimateLemonSliceCost('512', 15) // Assume 15 seconds for test
      const costCheck = checkCostLimit(costEstimate, COST_LIMITS.TESTING)
      
      addTestResult(`💰 Estimated cost: $${costEstimate.costUSD} (15s @ 512px)`)
      addTestResult(costCheck.message)
      
      if (!costCheck.allowed) {
        addTestResult('❌ Aborting due to cost limit')
        return
      }
      
      if (costEstimate.warning) {
        addTestResult(`⚠️ ${costEstimate.warning}`)
      }

      // Fix image URL to include extension if missing
      let fixedImageUrl = manualImageUrl
      if (!manualImageUrl.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)) {
        fixedImageUrl = manualImageUrl.includes('?') 
          ? manualImageUrl.replace('?', '.png?') 
          : manualImageUrl + '.png'
        addTestResult(`⚠️ Added .png extension to image URL`)
      }
      
      addTestResult('🎬 Starting manual URL avatar creation...')
      addTestResult(`Original Image URL: ${manualImageUrl}`)
      addTestResult(`Fixed Image URL: ${fixedImageUrl}`)
      addTestResult(`Audio URL: ${manualAudioUrl}`)
      
      const result = await lemonSliceApiService.createAvatar({
        image: fixedImageUrl,
        audio: manualAudioUrl,
        model: 'V2.5',
        resolution: '512',
        animation_style: 'autoselect',
        expressiveness: 0.8,
        crop_head: false
      })
      
      setManualResult(result)
      addTestResult(`✅ Manual avatar job created: ${result.job_id}`)
      
      // Automatically set the job ID for status checking
      setJobId(result.job_id)
      
    } catch (error) {
      addTestResult(`❌ Manual avatar creation error: ${error}`)
    } finally {
      setIsManualTesting(false)
    }
  }

  const checkJobStatus = async () => {
    if (!jobId.trim()) {
      setStatusError('Please enter a job ID')
      return
    }

    setIsCheckingStatus(true)
    setStatusError(null)
    setJobStatus(null)

    try {
      console.log('🔍 Checking job status for:', jobId)
      const status = await lemonSliceApiService.getTaskStatus(jobId)
      console.log('✅ Job status response:', status)
      setJobStatus(status)
      addTestResult(`Job ${jobId} status: ${status.status}`)
    } catch (err) {
      console.error('❌ Error checking job status:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to check job status'
      setStatusError(errorMsg)
      addTestResult(`Job status error: ${errorMsg}`)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const handleGenerateImage = async () => {
    console.log('🚀 handleGenerateImage called')
    
    if (!imageGenerationService) {
      addTestResult('Error: Image generation service not available')
      return
    }

    if (!imagePrompt.trim()) {
      addTestResult('Error: Image prompt is required')
      return
    }

    setIsGeneratingImage(true)
    setGeneratedImageUrl(null)

    try {
      addTestResult('Starting AI image generation...')
      const options: ImageGenerationOptions = {
        prompt: imagePrompt,
        style: imageStyle || undefined,
        mood: imageMood || undefined,
        size: '1024x1024',
        quality: 'standard'
      }

      console.log('📸 Calling imageGenerationService.generateImage with:', options)
      const result = await imageGenerationService.generateImage(options)
      setGeneratedImageUrl(result.imageUrl)
      addTestResult(`Image generated successfully: ${result.imageUrl}`)
      
      // Auto-fill manual test URL
      setManualImageUrl(result.imageUrl)
      
      if (result.revisedPrompt) {
        addTestResult(`Revised prompt: ${result.revisedPrompt}`)
      }

      // Convert URL to File for testing
      try {
        const file = await imageGenerationService.urlToFile(result.imageUrl, 'generated-avatar.png')
        setImageFile(file)
        addTestResult(`Image converted to file: ${file.name} (${file.size} bytes)`)
      } catch (error) {
        addTestResult(`Warning: Could not convert to file: ${error}`)
      }

    } catch (error) {
      console.error('🔥 Image generation error:', error)
      addTestResult(`Image generation error: ${error}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleUsePromptSuggestion = (suggestion: string) => {
    setImagePrompt(suggestion)
  }

  const clearImageGeneration = () => {
    setGeneratedImageUrl(null)
    setImagePrompt('')
    setImageStyle('')
    setImageMood('')
  }

  const formatJobStatus = (status: any) => {
    if (!status) return null

    return (
      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">🎬 Job Status Results:</h3>
        <div className="space-y-2 text-sm">
          <div className="text-white"><strong>Job ID:</strong> <span className="text-white/80">{status.job_id || status.id || 'N/A'}</span></div>
          <div className="text-white"><strong>Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              status.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
              status.status === 'processing' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
              status.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
              status.status === 'failed' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
              'bg-gray-500/20 text-gray-300 border border-gray-400/30'
            }`}>
              {status.status}
            </span>
          </div>
          {status.progress !== undefined && (
            <div className="text-white"><strong>Progress:</strong> <span className="text-white/80">{status.progress}%</span></div>
          )}
          {status.video_url && (
            <div className="text-white">
              <strong>Video URL:</strong> 
              <a href={status.video_url} target="_blank" rel="noopener noreferrer" 
                 className="ml-2 text-blue-400 hover:text-blue-300 hover:underline break-all">
                {status.video_url}
              </a>
            </div>
          )}
          {status.thumbnail_url && (
            <div className="text-white">
              <strong>Thumbnail:</strong> 
              <a href={status.thumbnail_url} target="_blank" rel="noopener noreferrer"
                 className="ml-2 text-blue-400 hover:text-blue-300 hover:underline break-all">
                {status.thumbnail_url}
              </a>
            </div>
          )}
          {status.duration && (
            <div className="text-white"><strong>Duration:</strong> <span className="text-white/80">{status.duration}ms ({(status.duration/1000).toFixed(1)}s)</span></div>
          )}
          {status.error_message && (
            <div className="text-red-300"><strong>Error:</strong> {status.error_message}</div>
          )}
          {status.failure_reason && (
            <div className="text-red-300"><strong>Failure Reason:</strong> {status.failure_reason}</div>
          )}
        </div>
        
        {status.video_url && (
          <div className="mt-4">
            <h4 className="font-semibold text-white mb-2">🎥 Preview:</h4>
            <video controls className="max-w-md rounded-lg border border-white/20 bg-black/50">
              <source src={status.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-white hover:text-white/80">📋 Raw Response</summary>
          <pre className="mt-2 p-3 bg-black/60 border border-white/20 rounded text-xs overflow-auto text-green-300 font-mono">
            {JSON.stringify(status, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  console.log('🎨 Rendering component, imageGenerationService available:', !!imageGenerationService)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          🍋 LemonSlice API Test Suite
          {!imageGenerationService && <span className="text-red-400 text-sm ml-2">(Image Gen Unavailable)</span>}
        </h2>
        
        {/* Emergency Dashboard Link */}
        <div className="mb-6">
          <a 
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors text-white"
          >
            🚨 JOB DASHBOARD - Monitor Spending & Cancel Jobs
          </a>
          <p className="text-white/60 text-xs mt-1">
            Check your account balance and cancel pending jobs to stop money burning
          </p>
        </div>
        
        {/* API Status */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">API Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={testHealthCheck}
              className="bg-black/40 hover:bg-black/60 border border-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              🔍 Test Health Check
            </button>
            <button
              onClick={testLoadPresets}
              className="bg-black/40 hover:bg-black/60 border border-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              ⚙️ Load Presets
            </button>
          </div>
        </div>

        {/* Manual URL Test Section */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🎯 Manual URL Test</h3>
          <p className="text-white/60 text-sm mb-4">Test avatar generation with direct image and audio URLs</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                🖼️ Image URL (direct link)
              </label>
              <input
                type="url"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                🎵 Audio URL (direct MP3 link)
              </label>
              <input
                type="url"
                value={manualAudioUrl}
                onChange={(e) => setManualAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
              />
              <p className="text-xs text-white/60 mt-1">
                ⚠️ Must be a direct MP3 URL, not a redirect or CDN URL with parameters
              </p>
            </div>
            
            <button
              onClick={testManualUrlGeneration}
              disabled={!manualImageUrl.trim() || !manualAudioUrl.trim() || isManualTesting}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm ${
                manualImageUrl.trim() && manualAudioUrl.trim() && !isManualTesting
                  ? 'bg-gradient-to-r from-green-500/80 to-blue-500/80 hover:from-green-600/80 hover:to-blue-600/80 text-white border border-white/30 shadow-lg'
                  : 'bg-black/40 text-white/50 cursor-not-allowed border border-white/20'
              }`}
            >
              {isManualTesting ? '⏳ Creating Avatar...' : '🎬 Test Manual Avatar Creation'}
            </button>
            
            {manualResult && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-green-200 text-sm mb-2">✅ Manual avatar job created!</p>
                <p className="text-green-300 text-xs font-mono">Job ID: {manualResult.job_id}</p>
                <p className="text-green-300 text-xs">Status: {manualResult.status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Job Status Checker */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🔍 Job Status Checker</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Job ID:
              </label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
                placeholder="Enter LemonSlice job ID"
              />
              <p className="text-xs text-white/60 mt-1">
                Your recent job ID is pre-filled above
              </p>
            </div>
            
            <button
              onClick={checkJobStatus}
              disabled={isCheckingStatus}
              className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 border border-white/30 backdrop-blur-sm"
            >
              {isCheckingStatus ? '🔍 Checking...' : '🔍 Check Job Status'}
            </button>
          </div>

          {statusError && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-400/50 rounded-lg backdrop-blur-sm">
              <p className="text-red-200">{statusError}</p>
            </div>
          )}

          {jobStatus && (
            <div className="mt-6">
              {formatJobStatus(jobStatus)}
            </div>
          )}
        </div>

        {/* Image Input Section */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🖼️ Image Input</h3>
          
          <div className="space-y-6">
            {/* Upload Image Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                📁 Upload Image (JPG, PNG)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black/40 file:text-white hover:file:bg-black/60 file:backdrop-blur-sm file:border file:border-white/30"
              />
            </div>

            {/* OR Divider */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="text-white/60 text-sm font-medium">OR</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>

            {/* Generate Image Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                🎨 Personalize Vocalist
              </label>
              
              <div className="space-y-3">
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the avatar you want to generate (e.g., 'A professional headshot of a friendly person with a warm smile')"
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm resize-none"
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Style</label>
                    <select
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm text-sm"
                    >
                      {(imageGenerationService?.getStyleOptions?.() || [
                        { value: '', label: 'Default' },
                        { value: 'photorealistic', label: 'Photorealistic' },
                        { value: 'portrait photography', label: 'Portrait Photography' }
                      ]).map((option: any) => (
                        <option key={option.value} value={option.value} className="bg-black text-white">{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Mood</label>
                    <select
                      value={imageMood}
                      onChange={(e) => setImageMood(e.target.value)}
                      className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm text-sm"
                    >
                      {(imageGenerationService?.getMoodOptions?.() || [
                        { value: '', label: 'Default' },
                        { value: 'friendly', label: 'Friendly' },
                        { value: 'professional', label: 'Professional' }
                      ]).map((option: any) => (
                        <option key={option.value} value={option.value} className="bg-black text-white">{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Suggestions */}
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-2">💡 Quick Suggestions:</label>
                  <div className="flex flex-wrap gap-2">
                    {(imageGenerationService?.getSuggestedPrompts?.() || [
                      "A professional headshot of a friendly person with a warm smile",
                      "Portrait of a creative artist with an inspiring expression",
                      "Headshot of a confident business professional"
                    ]).slice(0, 3).map((suggestion: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleUsePromptSuggestion(suggestion)}
                        className="text-xs bg-black/40 hover:bg-black/60 border border-white/30 text-white/80 px-2 py-1 rounded transition-colors"
                      >
                        "{suggestion.substring(0, 30)}..."
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGeneratingImage}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm text-sm ${
                      imagePrompt.trim() && !isGeneratingImage
                        ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/80 hover:to-pink-600/80 text-white border border-white/30'
                        : 'bg-black/40 text-white/50 cursor-not-allowed border border-white/20'
                    }`}
                  >
                    {isGeneratingImage ? '🎨 Generating...' : '🎨 Generate Avatar'}
                  </button>

                  {(generatedImageUrl || imagePrompt) && (
                    <button
                      onClick={clearImageGeneration}
                      className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white rounded-lg font-medium transition-all duration-200 border border-white/30 backdrop-blur-sm text-sm"
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {(imageFile || generatedImageUrl) && (
              <div className="mt-4 p-3 bg-black/30 border border-white/20 rounded backdrop-blur-sm">
                <p className="text-xs text-white/80 mb-2">
                  {imageFile && !generatedImageUrl ? '📁 Uploaded Image:' : '🎨 Generated Avatar:'}
                </p>
                <img
                  src={generatedImageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')}
                  alt="Preview"
                  className="max-w-xs max-h-40 object-contain rounded border border-white/20"
                />
                {imageFile && (
                  <p className="text-xs text-white/60 mt-1">
                    {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            )}

            {/* Audio URL Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Audio URL (from Mureka or other source)
              </label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full bg-black/40 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Presets Display */}
        {presets.length > 0 && (
          <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">🎭 Available Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presets.map((preset) => (
                <div key={preset.id} className="bg-black/40 border border-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <h4 className="font-medium text-white">{preset.name}</h4>
                  <p className="text-xs text-white/80 mt-1">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Creation Test */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🎬 Avatar Creation Test</h3>
          
          {/* Progress Bar */}
          {isCreating && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white">Creating avatar...</span>
                <span className="text-sm text-white font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-4 backdrop-blur-sm">
              <span className="text-red-200 text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-2 text-xs text-red-300 hover:text-red-100 underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Avatar Result */}
          {avatarUrl && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 mb-4 backdrop-blur-sm">
              <p className="text-green-200 text-sm mb-2">✅ Avatar created successfully!</p>
              <video
                src={avatarUrl}
                controls
                className="w-full max-w-md rounded-lg bg-black/50 border border-white/20"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={testCreateAvatar}
              disabled={!imageFile || !audioUrl || isCreating}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm ${
                imageFile && audioUrl && !isCreating
                  ? 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 text-white border border-white/30 shadow-lg'
                  : 'bg-black/40 text-white/50 cursor-not-allowed border border-white/20'
              }`}
            >
              {isCreating ? '⏳ Creating...' : '🚀 Test Avatar Creation'}
            </button>

            <button
              onClick={reset}
              className="px-6 py-2 bg-black/40 hover:bg-black/60 text-white rounded-lg font-medium transition-all duration-200 border border-white/30 backdrop-blur-sm"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">📊 Test Results</h3>
            <button
              onClick={clearTestResults}
              className="text-sm text-white/80 hover:text-white underline"
            >
              Clear Results
            </button>
          </div>
          <div className="bg-black/60 border border-white/20 rounded-lg p-3 max-h-60 overflow-y-auto backdrop-blur-sm">
            {testResults.length === 0 ? (
              <p className="text-white/60 text-sm">No test results yet...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono text-green-300">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 