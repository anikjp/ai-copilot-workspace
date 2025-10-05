"use client"

import { UI_TEXT } from '@/config/constants'
import { cn } from '@/lib/utils'
import { Send, X } from 'lucide-react'
import React, { useState } from 'react'
import { Badge } from '../atoms/badge'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { Text } from '../atoms/text'

interface ChatPanelProps {
  className?: string
}

export function ChatPanel({ className }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [attachments, setAttachments] = useState([
    { id: 'doc', label: UI_TEXT.chat.attachments.doc, removable: true },
    { id: 'folder', label: UI_TEXT.chat.attachments.folder, removable: true }
  ])

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      // Handle send logic here
      console.log('Sending:', inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex-1 flex flex-col bg-white", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Central Input Area */}
          <div className="space-y-4">
            {/* Main Input */}
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={UI_TEXT.chat.placeholder}
                className="w-full h-16 px-6 pr-16 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-0"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black hover:bg-slate-800 rounded-xl"
              >
                <Send className="w-5 h-5 text-white" />
              </Button>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex items-center space-x-2">
                {attachments.map((attachment) => (
                  <Badge
                    key={attachment.id}
                    variant="secondary"
                    className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <Text className="text-sm">{attachment.label}</Text>
                    {attachment.removable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-0 h-auto w-auto hover:bg-transparent"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </Badge>
                ))}
                <Text className="text-sm text-slate-500 ml-2">
                  {UI_TEXT.chat.model}
                </Text>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="space-y-4">
            <Text className="text-sm text-slate-500 text-center">
              Suggested prompts:
            </Text>
            <div className="space-y-2">
              {UI_TEXT.chat.quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-slate-50 border border-slate-100 rounded-lg"
                  onClick={() => setInputValue(prompt)}
                >
                  <Text className="text-sm text-slate-700">{prompt}</Text>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
