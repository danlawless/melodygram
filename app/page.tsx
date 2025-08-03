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
        return <MyScreen />
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
    <div className="min-h-screen bg-bg-primary">
      {isMainScreen && (
        <AppHeader 
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
      )}
      
      {/* Content area with conditional top padding for fixed header */}
      <div className={isMainScreen ? "pt-16" : ""}>
        {renderCurrentScreen()}
      </div>
      
      {isMainScreen && (
        <GlobalNavigation 
          currentTab={currentTab} 
          onTabChange={handleTabChange} 
        />
      )}
      
      {/* <CreditDebugPanel /> */}
    </div>
  )
} 