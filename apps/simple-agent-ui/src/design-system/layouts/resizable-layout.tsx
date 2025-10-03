"use client"

import { cn } from '@/lib/utils'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface ResizableLayoutProps {
  children: [React.ReactNode, React.ReactNode] // [leftPanel, rightPanel]
  className?: string
  minLeftWidth?: number
  maxLeftWidth?: number
  defaultLeftWidth?: number
  resizeHandleClassName?: string
}

export function ResizableLayout({
  children,
  className,
  minLeftWidth = 300,
  maxLeftWidth = 800,
  defaultLeftWidth = 480,
  resizeHandleClassName
}: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newLeftWidth = e.clientX - containerRect.left

    // Constrain the width within min/max bounds
    const constrainedWidth = Math.min(
      Math.max(newLeftWidth, minLeftWidth),
      maxLeftWidth
    )

    setLeftWidth(constrainedWidth)
  }, [isResizing, minLeftWidth, maxLeftWidth])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className={cn("flex h-full", className)}>
      {/* Left Panel */}
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={{ width: `${leftWidth}px` }}
      >
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className={cn(
          "resizable-handle group relative",
          isResizing && "active",
          resizeHandleClassName
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Invisible wider hit area for easier grabbing */}
        <div className="w-2 h-full -ml-0.5 cursor-col-resize" />
        
        {/* Visual indicator dots */}
        <div className="resizable-handle-indicator">
          <div className="flex flex-col space-y-0.5">
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {children[1]}
      </div>
    </div>
  )
}

// Hook for managing resizable panel state
export function useResizablePanel(
  defaultWidth: number = 480,
  minWidth: number = 300,
  maxWidth: number = 800
) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)

  const updateWidth = useCallback((newWidth: number) => {
    const constrainedWidth = Math.min(
      Math.max(newWidth, minWidth),
      maxWidth
    )
    setWidth(constrainedWidth)
  }, [minWidth, maxWidth])

  return {
    width,
    setWidth: updateWidth,
    isResizing,
    setIsResizing,
    minWidth,
    maxWidth
  }
}
