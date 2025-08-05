import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

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

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, selectedGender, songTitle }: AudioGenderAnalysisRequest = await request.json()
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openaiClient = getOpenAIClient()
    if (!openaiClient) {
      return NextResponse.json(
        { error: 'Failed to initialize OpenAI client' },
        { status: 500 }
      )
    }

    if (!audioUrl || !selectedGender) {
      return NextResponse.json(
        { error: 'audioUrl and selectedGender are required' },
        { status: 400 }
      )
    }

    console.log(`🎵 Analyzing audio gender mismatch...`)
    console.log(`🎯 User selected: ${selectedGender}`)
    console.log(`🎧 Analyzing audio: ${audioUrl.substring(0, 80)}...`)
    if (songTitle) console.log(`🎼 Song title: ${songTitle}`)

    // Step 1: Get audio transcription and analysis using Whisper
    console.log(`🔄 Step 1: Transcribing audio with Whisper...`)
    
    // Download audio file for analysis
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`)
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })

    // Transcribe audio to get lyrics and initial analysis
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    })

    console.log(`📝 Transcription complete: ${transcription.substring(0, 100)}...`)

    // Step 2: Analyze the transcribed content and vocal characteristics
    console.log(`🔄 Step 2: Analyzing vocal gender characteristics...`)

    const analysisPrompt = `Analyze this song audio and determine the apparent gender of the vocalist(s).

AUDIO TRANSCRIPTION:
"${transcription}"

CONTEXT: The user selected "${selectedGender}" but we need to verify if the generated song actually matches this selection.

ANALYSIS CRITERIA:
- Vocal pitch and range (typical male vs female ranges)
- Vocal timber and tone characteristics
- Linguistic patterns and pronunciation style
- Overall vocal presentation
- Consider backing vocals or harmonies if present

IMPORTANT: 
- Focus on actual vocal characteristics, not lyrical content
- Consider that some voices may be androgynous or processed
- Note if there are multiple vocalists of different genders
- Be objective about what you hear in the vocal performance
- If unclear due to processing/effects, indicate lower confidence

RESPONSE FORMAT:
Provide a JSON response with:
- detectedGender: "male" | "female" | "neutral" | "mixed" (use "mixed" if multiple genders detected)
- confidence: "high" | "medium" | "low" 
- reasoning: Brief explanation of vocal characteristics that led to this determination
- audioCharacteristics: {
    "vocalRange": "description of pitch range (e.g., 'baritone', 'soprano', 'alto')",
    "tone": "description of vocal tone (e.g., 'warm', 'bright', 'deep')",
    "pitch": "general pitch level (e.g., 'low', 'medium', 'high')"
  }

Respond with ONLY the JSON object, no other text.`

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.1, // Low temperature for consistent analysis
    })

    const analysisText = response.choices[0]?.message?.content?.trim()
    
    if (!analysisText) {
      throw new Error('No analysis returned from GPT-4')
    }

    console.log(`🔍 GPT-4 raw audio analysis response:`, analysisText)

    // Parse the JSON response
    let analysisResult
    try {
      analysisResult = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('❌ Failed to parse GPT audio analysis as JSON:', analysisText)
      // Fallback: assume no correction needed
      analysisResult = {
        detectedGender: selectedGender,
        confidence: 'low',
        reasoning: 'Could not parse analysis result',
        audioCharacteristics: {
          vocalRange: 'unknown',
          tone: 'unknown',
          pitch: 'unknown'
        }
      }
    }

    // Determine if correction is needed
    const correctionNeeded = analysisResult.detectedGender !== selectedGender && 
                            analysisResult.detectedGender !== 'neutral' &&
                            analysisResult.detectedGender !== 'mixed' &&
                            analysisResult.confidence !== 'low'

    const result: AudioGenderDetectionResult = {
      detectedGender: analysisResult.detectedGender,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      correctionNeeded,
      originalSelection: selectedGender,
      audioCharacteristics: analysisResult.audioCharacteristics || {
        vocalRange: 'unknown',
        tone: 'unknown', 
        pitch: 'unknown'
      },
      transcription: transcription.length > 500 ? transcription.substring(0, 500) + '...' : transcription
    }

    console.log(`✅ Audio gender analysis complete:`)
    console.log(`   🎤 Detected Gender: ${result.detectedGender} (${result.confidence})`)
    console.log(`   🎯 Selected Gender: ${result.originalSelection}`)
    console.log(`   🔄 Mismatch: ${result.correctionNeeded ? 'YES - Regeneration Suggested' : 'NO'}`)
    console.log(`   🎵 Vocal Range: ${result.audioCharacteristics.vocalRange}`)
    console.log(`   🎨 Tone: ${result.audioCharacteristics.tone}`)
    console.log(`   📊 Pitch: ${result.audioCharacteristics.pitch}`)
    console.log(`   📝 Transcription: ${result.transcription?.substring(0, 100)}...`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Audio gender analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'Audio gender analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}