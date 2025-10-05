"use client"

import { LAYOUT_CONFIG } from '@/config/constants'
import { LayoutConfig, PageConfig } from '@/types/design-system'
import React, { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  currentPage: PageConfig
  setCurrentPage: (config: PageConfig) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  layoutConfig: LayoutConfig
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

interface LayoutProviderProps {
  children: React.ReactNode
  initialPage?: PageConfig
}

export function LayoutProvider({ children, initialPage }: LayoutProviderProps) {
  const [currentPage, setCurrentPage] = useState<PageConfig>(
    initialPage || {
      title: "Dashboard",
      layout: "dashboard",
      showSidebar: true,
      showTopBar: true,
      showChat: true
    }
  )
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const value: LayoutContextType = {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    setSidebarCollapsed,
    layoutConfig: LAYOUT_CONFIG
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}
