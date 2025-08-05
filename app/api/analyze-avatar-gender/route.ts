import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenderAnalysisRequest {
  imageUrl: string
  selectedGender: 'male' | 'female'
}

interface GenderDetectionResult {
  detectedGender: 'male' | 'female' | 'neutral'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  correctionNeeded: boolean
  originalSelection: 'male' | 'female'
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, selectedGender }: GenderAnalysisRequest = await request.json()
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!imageUrl || !selectedGender) {
      return NextResponse.json(
        { error: 'imageUrl and selectedGender are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Analyzing avatar gender mismatch...`)
    console.log(`🎯 User selected: ${selectedGender}`)
    console.log(`🖼️ Analyzing image: ${imageUrl.substring(0, 80)}...`)

    const prompt = `Analyze this avatar/person image and determine the apparent gender presentation.

TASK: Determine if this person appears to be male, female, or neutral/androgynous.

CONTEXT: The user selected "${selectedGender}" but we need to verify if the generated avatar actually matches this selection.

ANALYSIS CRITERIA:
- Facial features (jawline, cheekbones, eye shape, etc.)
- Hair style and length
- Overall appearance and presentation
- Clothing or styling (if visible)

IMPORTANT: 
- Focus on visual appearance, not stereotypes
- Consider that some people may have androgynous features
- Be objective about what you actually see in the image
- If unclear, err on the side of "neutral"

RESPONSE FORMAT:
Provide a JSON response with:
- detectedGender: "male" | "female" | "neutral"
- confidence: "high" | "medium" | "low" 
- reasoning: Brief explanation of visual cues that led to this determination

Respond with ONLY the JSON object, no other text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low' // Use low detail for faster processing and lower cost
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent analysis
    })

    const analysisText = response.choices[0]?.message?.content?.trim()
    
    if (!analysisText) {
      throw new Error('No analysis returned from GPT Vision')
    }

    console.log(`🔍 GPT Vision raw response:`, analysisText)

    // Parse the JSON response
    let analysisResult
    try {
      analysisResult = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('❌ Failed to parse GPT analysis as JSON:', analysisText)
      // Fallback: assume no correction needed
      analysisResult = {
        detectedGender: selectedGender,
        confidence: 'low',
        reasoning: 'Could not parse analysis result'
      }
    }

    // Determine if correction is needed
    const correctionNeeded = analysisResult.detectedGender !== selectedGender && 
                            analysisResult.detectedGender !== 'neutral' &&
                            analysisResult.confidence !== 'low'

    const result: GenderDetectionResult = {
      detectedGender: analysisResult.detectedGender,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      correctionNeeded,
      originalSelection: selectedGender
    }

    console.log(`✅ Gender analysis complete:`)
    console.log(`   - Detected: ${result.detectedGender} (${result.confidence})`)
    console.log(`   - Selected: ${result.originalSelection}`)
    console.log(`   - Mismatch: ${result.correctionNeeded ? 'YES' : 'NO'}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Avatar gender analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'Gender analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}