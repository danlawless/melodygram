'use client'

import React, { useState } from 'react'
import CreationStudio from './components/creation/CreationStudio'
import ExploreScreen from './components/screens/ExploreScreen'
import MyScreen from './components/screens/MyScreen'
import GlobalNavigation from './components/navigation/GlobalNavigation'

type AppTab = 'create' | 'explore' | 'my'

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AppTab>('create')

  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab)
  }

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'create':
        return <CreationStudio />
      case 'explore':
        return <ExploreScreen />
      case 'my':
        return <MyScreen />
      default:
        return <CreationStudio />
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {renderCurrentScreen()}
      <GlobalNavigation 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  )
} 