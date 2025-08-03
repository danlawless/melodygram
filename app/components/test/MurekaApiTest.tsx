'use client'

import React, { useState } from 'react'
import { murekaApiService } from '../../services/murekaApi'

export default function MurekaApiTest() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<any>({})

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    setLoading(name)
    setErrors(prev => ({ ...prev, [name]: null }))
    
    try {
      const result = await testFn()
      setResults(prev => ({ ...prev, [name]: result }))
      console.log(`✅ ${name} success:`, result)
    } catch (error) {
      console.error(`❌ ${name} error:`, error)
      setErrors(prev => ({ ...prev, [name]: error.message }))
    } finally {
      setLoading(null)
    }
  }

  const testLyricGeneration = () => testEndpoint('lyrics', () => 
    murekaApiService.generateLyrics({
      prompt: 'Write a happy birthday song for Jessica with upbeat energy and celebration vibes. Include a catchy title.',
      style: 'pop',
      mood: 'happy'
    })
  )

  const testCustomPrompt = () => testEndpoint('customPrompt', () => 
    murekaApiService.generateLyrics({
      prompt: 'Create emotional lyrics about a long-distance relationship, focusing on missing someone special and the hope of reuniting. Make it heartfelt and relatable. Include a meaningful title that captures the longing.',
      style: 'ballad',
      mood: 'romantic'
    })
  )

  const testCreativePrompt = () => testEndpoint('creativePrompt', () => 
    murekaApiService.generateLyrics({
      prompt: 'Write an adventurous song about exploring new cities, trying new foods, and making unexpected friends while traveling. Capture the excitement and freedom of discovery. Create an inspiring title about wanderlust.',
      style: 'indie',
      mood: 'energetic'
    })
  )

  const testGetSingers = () => testEndpoint('singers', () => 
    murekaApiService.getVocals()
  )

  const testGetMoodsAndGenres = () => testEndpoint('moodsAndGenres', () => 
    murekaApiService.getReferenceTracksAndGenres()
  )

  const testSongGeneration = async () => {
    setLoading('songGeneration')
    setErrors(prev => ({ ...prev, songGeneration: null }))
    
    try {
      console.log('🎵 Starting song generation...')
      
      // Step 1: Generate song (SHORT FOR TESTING)
      const songResponse = await murekaApiService.generateSong({
        lyrics: 'Happy birthday to you\nJessica so bright', // Shorter lyrics = shorter song
        title: 'Jessica\'s Birthday Song',
        style: 'pop',
        mood: 'happy',
        duration: 15 // Try to limit to 15 seconds
      })
      
      console.log('🎵 Song generation response:', songResponse)
      setResults(prev => ({ ...prev, songGeneration: { ...songResponse, status: 'polling...' } }))
      
      // Step 2: Poll for completion
      let songCompleted = false
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max
      
      // Wait before first status check
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      while (!songCompleted && attempts < maxAttempts) {
        attempts++
        
        try {
          const statusResponse = await murekaApiService.querySongTask(songResponse.id)
          console.log(`🔄 Song status check ${attempts}:`, statusResponse)
          
          if (statusResponse.status === 'succeeded' && statusResponse.choices?.[0]?.url) {
            songCompleted = true
            const finalResult = {
              ...songResponse,
              completedStatus: statusResponse.status,
              audioUrl: statusResponse.choices[0].url,
              duration: statusResponse.choices[0].duration,
              attempts: attempts
            }
            setResults(prev => ({ ...prev, songGeneration: finalResult }))
            console.log('✅ Song generation completed:', finalResult)
            break
          } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
            throw new Error(statusResponse.message || 'Song generation failed')
          }
          
          // Update progress
          setResults(prev => ({ 
            ...prev, 
            songGeneration: { 
              ...songResponse, 
              status: `polling... (${attempts}/${maxAttempts})`,
              currentStatus: statusResponse.status 
            }
          }))
          
        } catch (statusError) {
          console.warn(`Status check failed (${attempts}):`, statusError)
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      if (!songCompleted) {
        throw new Error('Song generation timed out after 5 minutes')
      }
      
    } catch (error) {
      console.error('❌ songGeneration error:', error)
      setErrors(prev => ({ ...prev, songGeneration: error.message }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">🎵 Mureka API Test Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testLyricGeneration}
          disabled={loading === 'lyrics'}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'lyrics' ? 'Testing...' : 'Test Basic Lyrics'}
        </button>

        <button
          onClick={testCustomPrompt}
          disabled={loading === 'customPrompt'}
          className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'customPrompt' ? 'Testing...' : 'Test Emotional Prompt'}
        </button>

        <button
          onClick={testCreativePrompt}
          disabled={loading === 'creativePrompt'}
          className="p-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'creativePrompt' ? 'Testing...' : 'Test Creative Prompt'}
        </button>

        <button
          onClick={testGetSingers}
          disabled={loading === 'singers'}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'singers' ? 'Testing...' : 'Test Get Singers'}
        </button>

        <button
          onClick={testGetMoodsAndGenres}
          disabled={loading === 'moodsAndGenres'}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'moodsAndGenres' ? 'Testing...' : 'Test Moods & Genres'}
        </button>

        <button
          onClick={testSongGeneration}
          disabled={loading === 'songGeneration'}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading === 'songGeneration' ? 'Testing...' : 'Test Song Generation'}
        </button>
      </div>

      {/* Results Display */}
      <div className="space-y-6">
        {Object.entries(results).map(([key, value]) => (
          <div key={key} className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 capitalize text-white">
              ✅ {key} Results
            </h3>
            <pre className="bg-black/40 p-3 rounded text-sm overflow-auto text-white/80 border border-white/20">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}

        {Object.entries(errors).map(([key, error]) => 
          error ? (
            <div key={key} className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-2 capitalize text-red-300">
                ❌ {key} Error
              </h3>
              <p className="text-red-200">{String(error)}</p>
            </div>
          ) : null
        )}
      </div>

      {/* API Status */}
      <div className="mt-8 p-4 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
        <h3 className="font-semibold mb-2 text-white">🔧 API Configuration</h3>
        <p className="text-white/80"><strong className="text-white">Base URL:</strong> https://api.mureka.ai</p>
        <p className="text-white/80"><strong className="text-white">API Key:</strong> op_mdv80rml6C9Ja67QJEB3Pf32QXKc9b2 (configured)</p>
      </div>
    </div>
  )
} 