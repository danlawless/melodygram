/**
 * Audio Processing Service
 * Handles audio effects like fade-out for song length control
 */

export interface AudioProcessingOptions {
  fadeOutDuration?: number // in seconds
  targetDuration: number   // in seconds
}

class AudioProcessingService {
  
  /**
   * Apply fade-out effect to audio blob starting at specified time
   */
  async applyFadeOut(audioBlob: Blob, options: AudioProcessingOptions): Promise<Blob> {
    const { fadeOutDuration = 0.5, targetDuration } = options
    const fadeStartTime = Math.max(0, targetDuration - fadeOutDuration)
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Calculate samples
      const sampleRate = audioBuffer.sampleRate
      const totalSamples = Math.floor(targetDuration * sampleRate)
      const fadeStartSample = Math.floor(fadeStartTime * sampleRate)
      const fadeLength = totalSamples - fadeStartSample
      
      // Create new buffer with target duration
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        totalSamples,
        sampleRate
      )
      
      // Copy and process each channel
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel)
        const outputData = newBuffer.getChannelData(channel)
        
        // Copy audio data up to fade start
        for (let i = 0; i < Math.min(fadeStartSample, inputData.length); i++) {
          outputData[i] = inputData[i]
        }
        
        // Apply fade-out
        for (let i = fadeStartSample; i < totalSamples && i < inputData.length; i++) {
          const fadeProgress = (i - fadeStartSample) / fadeLength
          const fadeMultiplier = Math.cos(fadeProgress * Math.PI / 2) // Smooth cosine fade
          outputData[i] = inputData[i] * fadeMultiplier
        }
      }
      
      // Convert back to blob
      const processedBlob = await this.audioBufferToBlob(newBuffer, audioContext)
      
      // Clean up
      audioContext.close()
      
      console.log(`🎵 Applied fade-out: ${targetDuration}s duration with ${fadeOutDuration}s fade`)
      return processedBlob
      
    } catch (error) {
      console.error('Audio processing failed:', error)
      // Return original blob if processing fails
      return audioBlob
    }
  }
  
  /**
   * Convert AudioBuffer to Blob
   */
  private async audioBufferToBlob(buffer: AudioBuffer, audioContext: AudioContext): Promise<Blob> {
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    
    const source = offlineContext.createBufferSource()
    source.buffer = buffer
    source.connect(offlineContext.destination)
    source.start(0)
    
    const renderedBuffer = await offlineContext.startRendering()
    
    // Convert to WAV format
    const wav = this.bufferToWav(renderedBuffer)
    return new Blob([wav], { type: 'audio/wav' })
  }
  
  /**
   * Convert AudioBuffer to WAV format
   */
  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bytesPerSample = 2 // 16-bit
    
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample)
    const view = new DataView(arrayBuffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // PCM format
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true)
    view.setUint16(32, numberOfChannels * bytesPerSample, true)
    view.setUint16(34, 8 * bytesPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true)
    
    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return arrayBuffer
  }
}

export const audioProcessingService = new AudioProcessingService() 