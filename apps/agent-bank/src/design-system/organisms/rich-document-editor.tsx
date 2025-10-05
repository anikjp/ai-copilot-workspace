"use client"

import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { DocumentToolbar } from '../layouts/document-editor-layout'

interface RichDocumentEditorProps {
  className?: string
  title?: string
  onTitleChange?: (title: string) => void
}

export function RichDocumentEditor({ 
  className, 
  title = "Markdown Document Regeneration Process",
  onTitleChange
}: RichDocumentEditorProps) {
  const [documentTitle, setDocumentTitle] = useState(title)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setDocumentTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Document Title */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={documentTitle}
            onChange={handleTitleChange}
            className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none flex-1 placeholder:text-slate-400"
            placeholder="Document Title"
          />
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <DocumentToolbar />

      {/* Document Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <DocumentContent />
        </div>
      </div>
    </div>
  )
}

// Language Proficiency Bar Component
interface LanguageBarProps {
  language: string
  percentage: number
  className?: string
}

function LanguageBar({ language, percentage, className }: LanguageBarProps) {
  return (
    <div className={cn("flex items-center gap-3 py-1", className)}>
      <span className="text-sm font-medium text-slate-700 w-32">{language}</span>
      <div className="flex-1 bg-slate-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-slate-600 w-12 text-right">{percentage}%</span>
    </div>
  )
}

// Document Content Component
function DocumentContent() {
  return (
    <div className="space-y-8">
      {/* Language Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Language</h2>
        
        {/* Verbal Languages */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Verbal</h3>
          <div className="space-y-3">
            <LanguageBar language="Chinese" percentage={100} />
            <LanguageBar language="English" percentage={85} />
            <LanguageBar language="Bahasa Malaysia" percentage={70} />
            <LanguageBar language="Cantonese" percentage={90} />
          </div>
        </div>

        {/* Written Languages */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Written</h3>
          <div className="space-y-3">
            <LanguageBar language="Chinese" percentage={95} />
            <LanguageBar language="English" percentage={90} />
            <LanguageBar language="Bahasa Malaysia" percentage={75} />
          </div>
        </div>
      </div>

      {/* Personal Skills Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Skills</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-700 text-lg">Punctual</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-700 text-lg">Self-discipline</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-700 text-lg">Time management</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-700 text-lg">Teamwork</span>
          </li>
        </ul>
      </div>

      {/* Working Experience Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Working Experience</h2>
        <div className="space-y-4">
          <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors duration-150">
            <h3 className="font-semibold text-slate-900 text-lg">
              Talent in Social Experimental Reality TV Program 'What Youth Think'
            </h3>
          </div>
        </div>
      </div>
    </div>
  )
}
