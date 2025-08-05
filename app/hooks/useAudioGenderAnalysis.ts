import { useState, useCallback } from 'react'

interface AudioGenderAnalysisRequest {
  audioUrl: string
  selectedGender: 'male' | 'female'
  songTitle?: string
}

interface AudioGenderDetectionResult {
  detectedGender: 'male' | 'female' | 'neutral' | 'mixed'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  correctionNeeded: boolean
  originalSelection: 'male' | 'female'
  audioCharacteristics: {
    vocalRange: string
    tone: string
    pitch: string
  }
  transcription?: string
}

interface UseAudioGenderAnalysisReturn {
  // State
  isAnalyzing: boolean
  result: AudioGenderDetectionResult | null
  error: string | null
  
  // Actions
  analyzeAudioGender: (request: AudioGenderAnalysisRequest) => Promise<AudioGenderDetectionResult | null>
  clearError: () => void
  reset: () => void
}

export function useAudioGenderAnalysis(): UseAudioGenderAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AudioGenderDetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeAudioGender = useCallback(async (request: AudioGenderAnalysisRequest): Promise<AudioGenderDetectionResult | null> => {
    try {
      setIsAnalyzing(true)
      setError(null)
      setResult(null)

      console.log(`🎵 Starting audio gender analysis...`)
      console.log(`🎧 Audio URL: ${request.audioUrl}`)
      console.log(`🎯 Expected Gender: ${request.selectedGender}`)
      if (request.songTitle) console.log(`🎼 Song: ${request.songTitle}`)

      const response = await fetch('/api/analyze-audio-gender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const analysisResult: AudioGenderDetectionResult = await response.json()
      
      console.log(`✅ Audio gender analysis complete:`)
      console.log(`   🎤 Detected: ${analysisResult.detectedGender} (${analysisResult.confidence})`)
      console.log(`   🎯 Expected: ${analysisResult.originalSelection}`)
      console.log(`   🔄 Needs Correction: ${analysisResult.correctionNeeded ? 'YES' : 'NO'}`)
      console.log(`   🎵 Vocal Characteristics:`, analysisResult.audioCharacteristics)
      if (analysisResult.transcription) {
        console.log(`   📝 Transcription: ${analysisResult.transcription.substring(0, 150)}...`)
      }

      // Show detailed reasoning in console
      console.log(`   💭 Analysis Reasoning: ${analysisResult.reasoning}`)

      setResult(analysisResult)
      return analysisResult

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Audio gender analysis failed'
      console.error('❌ Audio gender analysis error:', errorMessage)
      setError(errorMessage)
      return null

    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setIsAnalyzing(false)
    setResult(null)
    setError(null)
  }, [])

  return {
    // State
    isAnalyzing,
    result,
    error,
    
    // Actions
    analyzeAudioGender,
    clearError,
    reset,
  }
}