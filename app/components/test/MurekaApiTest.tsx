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

  const testSongGeneration = () => testEndpoint('songGeneration', () => 
    murekaApiService.generateSong({
      lyrics: 'Happy birthday to you, Jessica so bright\nMay your day be filled with joy and light',
      title: 'Jessica\'s Birthday Song',
      style: 'pop',
      mood: 'happy'
    })
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mureka API Test Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testLyricGeneration}
          disabled={loading === 'lyrics'}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading === 'lyrics' ? 'Testing...' : 'Test Basic Lyrics'}
        </button>

        <button
          onClick={testCustomPrompt}
          disabled={loading === 'customPrompt'}
          className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading === 'customPrompt' ? 'Testing...' : 'Test Emotional Prompt'}
        </button>

        <button
          onClick={testCreativePrompt}
          disabled={loading === 'creativePrompt'}
          className="p-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50"
        >
          {loading === 'creativePrompt' ? 'Testing...' : 'Test Creative Prompt'}
        </button>

        <button
          onClick={testGetSingers}
          disabled={loading === 'singers'}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {loading === 'singers' ? 'Testing...' : 'Test Get Singers'}
        </button>

        <button
          onClick={testGetMoodsAndGenres}
          disabled={loading === 'moodsAndGenres'}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {loading === 'moodsAndGenres' ? 'Testing...' : 'Test Moods & Genres'}
        </button>

        <button
          onClick={testSongGeneration}
          disabled={loading === 'songGeneration'}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {loading === 'songGeneration' ? 'Testing...' : 'Test Song Generation'}
        </button>
      </div>

      {/* Results Display */}
      <div className="space-y-6">
        {Object.entries(results).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 capitalize">
              ✅ {key} Results
            </h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}

        {Object.entries(errors).map(([key, error]) => 
          error ? (
            <div key={key} className="border border-red-300 rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-semibold mb-2 capitalize text-red-700">
                ❌ {key} Error
              </h3>
              <p className="text-red-600">{String(error)}</p>
            </div>
          ) : null
        )}
      </div>

      {/* API Status */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">API Configuration</h3>
        <p><strong>Base URL:</strong> https://api.mureka.ai</p>
        <p><strong>API Key:</strong> op_mdv80rml6C9Ja67QJEB3Pf32QXKc9b2 (configured)</p>
      </div>
    </div>
  )
} 