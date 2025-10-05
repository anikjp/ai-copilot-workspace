"use client"

import { ReactNode } from "react"

interface GenerativeCanvasProps {
  title?: string
  children: ReactNode
}

export function GenerativeCanvas({ 
  title = "Canvas",
  children 
}: GenerativeCanvasProps) {
  return (
    <div className="h-full w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
