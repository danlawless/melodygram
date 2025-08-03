import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { ToastProvider } from './components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MelodyGram - Create Beautiful Singing Avatars',
  description: 'Transform your photos into personalized singing avatars with AI. Upload, write lyrics, and create magical music experiences.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#8b5cf6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MelodyGram'
  }
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
          <main className="min-h-screen safe-area-top safe-area-bottom">
            {children}  
          </main>
        </ToastProvider>
      </body>
    </html>
  )
} 