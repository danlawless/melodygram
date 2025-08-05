/**
 * GPT Vision-based Gender Detection Service
 * Analyzes avatar images to detect apparent gender and correct metadata mismatches
 */

interface GenderDetectionResult {
  detectedGender: 'male' | 'female' | 'neutral'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  correctionNeeded: boolean
  originalSelection: 'male' | 'female'
}

class GenderDetectionService {
  /**
   * Analyze avatar image to detect apparent gender using GPT Vision
   */
  async analyzeAvatarGender(
    imageUrl: string, 
    selectedGender: 'male' | 'female'
  ): Promise<GenderDetectionResult> {
    try {
      console.log(`🔍 Analyzing avatar gender for mismatch detection...`)
      console.log(`🎯 User selected: ${selectedGender}`)
      console.log(`🖼️ Image URL: ${imageUrl.substring(0, 100)}...`)

      const response = await fetch('/api/analyze-avatar-gender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          selectedGender
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Gender analysis failed: ${response.status}`)
      }

      const result: GenderDetectionResult = await response.json()
      
      console.log(`🔍 Gender analysis result:`)
      console.log(`   - Detected: ${result.detectedGender} (${result.confidence} confidence)`)
      console.log(`   - Selected: ${result.originalSelection}`)
      console.log(`   - Correction needed: ${result.correctionNeeded ? 'YES ⚠️' : 'NO ✅'}`)
      console.log(`   - Reasoning: ${result.reasoning}`)

      return result

    } catch (error) {
      console.error('❌ Gender analysis failed:', error)
      
      // Return safe fallback - assume no correction needed
      return {
        detectedGender: selectedGender, // Assume selected gender is correct
        confidence: 'low',
        reasoning: 'Analysis failed - assuming selected gender is correct',
        correctionNeeded: false,
        originalSelection: selectedGender
      }
    }
  }

  /**
   * Get corrected gender for voice/avatar matching
   */
  getCorrectedGender(result: GenderDetectionResult): 'male' | 'female' {
    if (result.correctionNeeded && result.confidence !== 'low') {
      // Only correct if detected gender is male or female, not neutral
      if (result.detectedGender === 'male' || result.detectedGender === 'female') {
        console.log(`🔧 Gender correction applied: ${result.originalSelection} → ${result.detectedGender}`)
        return result.detectedGender
      } else {
        console.log(`⚠️ Detected neutral gender, keeping original: ${result.originalSelection}`)
        return result.originalSelection
      }
    }
    
    console.log(`✅ No gender correction needed, using original: ${result.originalSelection}`)
    return result.originalSelection
  }

  /**
   * Log gender mismatch for analytics/debugging
   */
  logGenderMismatch(result: GenderDetectionResult, jobId: string) {
    if (result.correctionNeeded) {
      console.log(`📊 GENDER MISMATCH DETECTED [Job: ${jobId}]:`)
      console.log(`   - User selected: ${result.originalSelection}`)
      console.log(`   - Avatar appears: ${result.detectedGender}`)
      console.log(`   - Confidence: ${result.confidence}`)
      console.log(`   - This will be corrected automatically`)
      
      // In production, you might want to track this for improving the avatar generation
      // analytics.track('avatar_gender_mismatch', { 
      //   jobId, 
      //   selected: result.originalSelection, 
      //   detected: result.detectedGender,
      //   confidence: result.confidence 
      // })
    }
  }
}

export const genderDetectionService = new GenderDetectionService()