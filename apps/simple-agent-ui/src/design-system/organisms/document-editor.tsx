"use client"

import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { DocumentToolbar } from '../layouts/document-editor-layout'

interface DocumentEditorProps {
  className?: string
  title?: string
  content?: string
  onTitleChange?: (title: string) => void
  onContentChange?: (content: string) => void
}

export function DocumentEditor({ 
  className, 
  title = "Markdown Document Regeneration Process",
  content,
  onTitleChange,
  onContentChange
}: DocumentEditorProps) {
  const [documentTitle, setDocumentTitle] = useState(title)
  const [documentContent, setDocumentContent] = useState(content || getDefaultContent())

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setDocumentTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setDocumentContent(newContent)
    onContentChange?.(newContent)
  }

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Document Title */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={documentTitle}
            onChange={handleTitleChange}
            className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none flex-1"
            placeholder="Document Title"
          />
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <DocumentToolbar />

      {/* Document Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <textarea
            value={documentContent}
            onChange={handleContentChange}
            className="w-full h-full resize-none border-none outline-none text-slate-900 leading-relaxed"
            placeholder="Start writing your document..."
            style={{ minHeight: '600px' }}
          />
        </div>
      </div>
    </div>
  )
}

// Language Proficiency Component
interface LanguageProficiencyProps {
  language: string
  percentage: number
  className?: string
}

function LanguageProficiency({ language, percentage, className }: LanguageProficiencyProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-sm font-medium text-slate-700 w-24">{language}</span>
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

// Document Preview Component (for rendering the actual content)
export function DocumentPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none">
      <div className="whitespace-pre-wrap text-slate-900 leading-relaxed">
        {content}
      </div>
    </div>
  )
}

function getDefaultContent(): string {
  return `## Language

### Verbal
- Chinese: 100%
- English: 85%
- Bahasa Malaysia: 70%
- Cantonese: 90%

### Written
- Chinese: 95%
- English: 90%
- Bahasa Malaysia: 75%

## Personal Skills
- Punctual
- Self-discipline
- Time management
- Teamwork

## Working Experience
**Talent in Social Experimental Reality TV Program 'What Youth Think'**`
}

function renderLanguageSection(languages: { name: string; percentage: number }[]): string {
  return languages.map(lang => 
    `- **${lang.name}**: ${lang.percentage}%`
  ).join('\n')
}
