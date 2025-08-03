'use client'

import React, { useState, useCallback } from 'react'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import TipButton from '../ui/TipButton'

interface ImageUploadProps {
  uploadedImage: File | null
  onImageUpload: (file: File | null) => void
  showValidation?: boolean
}

export default function ImageUpload({ uploadedImage, onImageUpload, showValidation = false }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onImageUpload(file)
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }
    }
  }, [onImageUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageUpload(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [onImageUpload])

  const removeImage = () => {
    onImageUpload(null)
    setPreview(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-text-primary">Upload Photo</h2>
          <TipButton
            title="Image Inspiration"
            content="Upload an image that captures the mood, style, or story of your song. This visual inspiration helps the AI understand the emotional tone and aesthetic you're aiming for."
            position="right"
            size="sm"
          />
        </div>
        {showValidation && uploadedImage && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-600 text-sm font-medium">Complete</span>
          </div>
        )}
      </div>
      
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
            ${isDragOver 
              ? 'border-melody-pink bg-melody-pink/10 shadow-glow' 
              : showValidation && !uploadedImage
                ? 'border-amber-500 bg-amber-500/10 hover:border-amber-600'
                : 'border-melody-purple bg-gradient-to-br from-melody-purple/5 to-melody-pink/5 hover:border-melody-pink hover:shadow-glow'
            }
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-melody-gradient flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-text-primary">
                {isDragOver ? 'Drop your photo here!' : 'Upload'}
              </p>
              <p className="text-text-secondary">
                Drag and drop or tap to select your photo
              </p>
              <p className="text-sm text-text-muted">
                JPG, PNG up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-card">
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Remove button */}
          <button
            onClick={removeImage}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Image info overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {uploadedImage?.name || 'Uploaded Image'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 