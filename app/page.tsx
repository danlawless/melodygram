'use client'

import React, { useState } from 'react'
import CreationStudio from './components/creation/CreationStudio'
import CreditDebugPanel from './components/debug/CreditDebugPanel'
import MyScreen from './components/screens/MyScreen'
import ProfileScreen from './components/screens/ProfileScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import GlobalNavigation from './components/navigation/GlobalNavigation'
import AppHeader from './components/navigation/AppHeader'

type AppTab = 'create' | 'my'
type AppScreen = AppTab | 'profile' | 'settings'

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AppTab>('create')
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('create')

  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab)
    setCurrentScreen(tab)
  }

  const handleProfileClick = () => {
    setCurrentScreen('profile')
  }

  const handleSettingsClick = () => {
    setCurrentScreen('settings')
  }

  const handleBackToMain = () => {
    setCurrentScreen(currentTab)
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'create':
        return <CreationStudio />
      case 'my':
        return <MyScreen onProfileClick={handleProfileClick} />
      case 'profile':
        return <ProfileScreen onBack={handleBackToMain} />
      case 'settings':
        return <SettingsScreen onBack={handleBackToMain} />
      default:
        return <CreationStudio />
    }
  }

  const isMainScreen = currentScreen === 'create' || currentScreen === 'my'

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Fixed Header Area - Always takes up space */}
      {isMainScreen && (
        <div className="flex-shrink-0">
          <AppHeader 
            onProfileClick={handleProfileClick}
            onSettingsClick={handleSettingsClick}
          />
        </div>
      )}
      
      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 overflow-auto">
        {renderCurrentScreen()}
      </div>
      
      {/* Bottom Navigation - Fixed at bottom */}
      {isMainScreen && (
        <div className="flex-shrink-0">
          <GlobalNavigation 
            currentTab={currentTab} 
            onTabChange={handleTabChange} 
          />
        </div>
      )}
      
      {/* <CreditDebugPanel /> */}
    </div>
  )
} 