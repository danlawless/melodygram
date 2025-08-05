import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { ToastProvider } from './components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MelodyGram - Create Beautiful Singing Avatars',
  description: 'Transform your photos into personalized singing avatars with AI. Upload, write lyrics, and create magical music experiences.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'MelodyGram'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
  colorScheme: 'dark'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg-primary text-text-primary`}>
        <ToastProvider>
          <div className="min-h-screen flex flex-col safe-area-top safe-area-bottom">
            {children}  
          </div>
        </ToastProvider>
      </body>
    </html>
  )
} 