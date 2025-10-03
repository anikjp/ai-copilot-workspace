"use client"

import { cn } from '@/lib/utils'
import {
    ArrowLeft,
    Copy,
    Download,
    Menu,
    Plus,
    Save,
    Share2,
    Star,
    Upload
} from 'lucide-react'
import React from 'react'
import { ResizableLayout } from './resizable-layout'

interface DocumentEditorLayoutProps {
  children: React.ReactNode
  className?: string
  documentTitle?: string
  savePoint?: string
  onSave?: () => void
  onCopy?: () => void
  onShare?: () => void
  onDownload?: () => void
  onBack?: () => void
  onMenuToggle?: () => void
}

export function DocumentEditorLayout({
  children,
  className,
  documentTitle = "Untitled Document",
  savePoint = "Save Point-1",
  onSave,
  onCopy,
  onShare,
  onDownload,
  onBack,
  onMenuToggle
}: DocumentEditorLayoutProps) {
  return (
    <div className={cn("h-screen bg-slate-50 flex overflow-hidden", className)}>
      <ResizableLayout
        minLeftWidth={320}
        maxLeftWidth={500}
        defaultLeftWidth={380}
        resizeHandleClassName="hover:bg-blue-400 active:bg-blue-500"
      >
        {/* Left Panel - AI Chat Interface */}
        <div className="h-full flex flex-col bg-white shadow-sm">
          {/* Navigation Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-900">AI Assistant</h1>
            </div>
          </div>

          {/* Chat Content Area */}
          <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
            {/* Document Features */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Document Features</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  Complete working experience descriptions
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  Technical skills
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  Contact information with proper links
                </li>
              </ul>
            </div>

            {/* Markdown Features */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Markdown Features Used</h3>
              <ol className="space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
                <li>Headers (#, ##) for titles and sections</li>
                <li>Horizontal rules (---) for visual separation</li>
                <li>Unordered lists (-) for skills and details</li>
                <li>Emphasis (**bold**) for job titles and important information</li>
                <li>Links in proper Markdown format</li>
                <li>Clean, readable structure</li>
              </ol>
            </div>

            {/* Markdown Portability */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 leading-relaxed">
                Markdown format is portable and can be used in various documentation systems like GitHub, GitLab, or CMS systems.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-150 text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={onSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save to Notion
              </button>
            </div>
          </div>

          {/* AI Chat Interface */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-900">AI Docs</span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your doc request here..."
                  className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button className="p-1.5 hover:bg-slate-100 rounded transition-colors duration-150">
                    <Upload className="w-4 h-4 text-slate-500" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded transition-colors duration-150">
                    <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded transition-colors duration-150">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  <span>Rich Text</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Markdown</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Document Editor */}
        <div className="h-full flex flex-col bg-white shadow-sm">
          {/* Document Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium">{savePoint}</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                <Star className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                <Plus className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                <Upload className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                <Share2 className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                <Download className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </ResizableLayout>
    </div>
  )
}

// Document Editor Toolbar Component
interface DocumentToolbarProps {
  className?: string
}

export function DocumentToolbar({ className }: DocumentToolbarProps) {
  return (
    <div className={cn("flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50", className)}>
      {/* Formatting Tools */}
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 font-bold transition-colors duration-150">B</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 italic transition-colors duration-150">I</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 line-through transition-colors duration-150">S</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 underline transition-colors duration-150">U</button>
      </div>
      
      <div className="w-px h-6 bg-slate-300 mx-2"></div>
      
      {/* Alignment Tools */}
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">≡</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">≡</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">≡</button>
      </div>
      
      <div className="w-px h-6 bg-slate-300 mx-2"></div>
      
      {/* List Tools */}
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">•</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">1.</button>
      </div>
      
      <div className="w-px h-6 bg-slate-300 mx-2"></div>
      
      {/* Insert Tools */}
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">🔗</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">🖼️</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">📊</button>
        <button className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors duration-150">📋</button>
      </div>
    </div>
  )
}
