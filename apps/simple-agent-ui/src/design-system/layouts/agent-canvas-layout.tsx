"use client"

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'

interface PanelConfig {
  title: string
  icon?: React.ReactNode
}

interface AgentCanvasLayoutProps {
  children: React.ReactNode
  className?: string
  
  // Layout configuration
  defaultChatWidth?: number // percentage (0-1)
  minChatWidth?: number // percentage (0-1)
  maxChatWidth?: number // percentage (0-1)
  
  // Panel configurations
  chatPanel: PanelConfig
  canvasPanel: PanelConfig
  
  // Content components
  chatContent?: React.ReactNode // Component to render in chat area
  canvasContent?: React.ReactNode // Component to render in canvas area
  
  // Fallback content configuration
  fallbackTitle?: string // Title when no canvas content
  fallbackDescription?: string // Description when no canvas content
  
  // Event handlers for top bar actions
  onPlusClick?: () => void
  onShareClick?: () => void
  
  // Event handlers for canvas header actions
  onOpenNewTabClick?: () => void
  onDownloadClick?: () => void
  
}

// Helper function to create panel configurations
export function createPanelConfig(
  title: string,
  icon?: React.ReactNode
): PanelConfig {
  return { title, icon }
}


export function AgentCanvasLayout({
  children,
  className,
  defaultChatWidth = 0.4,
  minChatWidth = 0.3,
  maxChatWidth = 0.8,
  chatPanel,
  canvasPanel,
  chatContent,
  canvasContent,
  fallbackTitle = "Start working...",
  fallbackDescription = "Your content will appear here",
  onPlusClick,
  onShareClick,
  onOpenNewTabClick,
  onDownloadClick
}: AgentCanvasLayoutProps) {
  const [chatWidth, setChatWidth] = useState(() => {
    // Use defaultChatWidth percentage of screen width
    return typeof window !== 'undefined' ? window.innerWidth * defaultChatWidth : 400
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  // No automatic resize - only manual resize via drag handle

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = chatWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const screenWidth = window.innerWidth
      const minWidth = screenWidth * minChatWidth
      const maxWidth = screenWidth * maxChatWidth
      const newChatWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
      setChatWidth(newChatWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [chatWidth, minChatWidth, maxChatWidth])
  return (
    <div className={cn("h-screen bg-slate-50", className)}>
            {/* Top Bar */}
            <div className="h-12 bg-transparent flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                {chatPanel?.icon && (
                  <div className="w-6 h-6 flex items-center justify-center">
                    {chatPanel.icon}
                  </div>
                )}
                <h1 className="text-lg font-semibold text-slate-900">{chatPanel?.title || 'AI Assistant'}</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150" 
                  title="Plus"
                  onClick={onPlusClick}
                >
                  <Plus className="w-5 h-5 text-slate-500" />
                </button>
                <button 
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150" 
                  title="Share"
                  onClick={onShareClick}
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-3rem)] overflow-hidden flex">
        {/* Left Chat Panel */}
        <div 
          className="bg-transparent flex flex-col pb-2 min-w-[200px] flex-shrink-0" 
          style={{ width: `${chatWidth}px` }}
        >
          {/* Chat Content - Children will be rendered here */}
          <div className="flex-1 p-4 overflow-y-auto">
            {chatContent || children}
          </div>
        </div>

          {/* Right Floating Canvas Panel */}
          <div 
            className="bg-slate-50 py-1 pb-3 pl-3 pr-3 relative flex-1"
          >
            <div className="h-full bg-white/95 rounded-2xl shadow-2xl border border-slate-200/30 flex flex-col backdrop-blur-md hover:shadow-3xl transition-all duration-300 ease-out relative">
              {/* Functional Vertical Bar for Resizing - Reduced Height */}
              <div 
                ref={resizeRef}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/4 bg-gradient-to-b from-slate-300 to-slate-400 rounded-l-xl cursor-col-resize hover:w-1.5 transition-all duration-200 hover:from-slate-400 hover:to-slate-500 z-10 ${isResizing ? 'w-1.5 from-slate-500 to-slate-600' : ''}`}
                onMouseDown={handleMouseDown}
                title="Drag to resize panels"
              ></div>
            {/* Canvas Header - Reduced Height with Background */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-slate-700">{canvasPanel?.title || 'Document Editor'}</h2>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 hover:bg-slate-100 rounded transition-colors duration-150" 
                  title="Open in new tab"
                  onClick={onOpenNewTabClick}
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button 
                  className="p-1.5 hover:bg-slate-100 rounded transition-colors duration-150" 
                  title="Download"
                  onClick={onDownloadClick}
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Canvas Content Area */}
            <div 
              className="flex-1 p-6 relative overflow-y-auto scrollbar-hide canvas-content-scroll" 
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              } as React.CSSProperties}
            >
              {canvasContent || (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {canvasPanel?.icon || (
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-slate-600 mb-2">{fallbackTitle}</h3>
                    <p className="text-sm text-slate-400">{fallbackDescription}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
