"use client"

import { apiClient } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { ChatHeader } from "./chat-header"
import { ChatPanel } from "./chat-panel"
import { ChatSidebar } from "./chat-sidebar"

interface ChatConversation {
  id: string
  user_id: string
  title: string
  model_id: string
  created_at: string
  updated_at: string
  messages: any[]
}

export function ChatLayout() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-3-5-sonnet-20241022")
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)

  // Load conversation details when selected
  useEffect(() => {
    if (selectedConversationId) {
      const loadConversation = async () => {
        try {
          const conversation = await apiClient.getConversation(selectedConversationId)
          setCurrentConversation(conversation)
          setSelectedModelId(conversation.model_id)
        } catch (error) {
          console.error('Error loading conversation:', error)
        }
      }
      loadConversation()
    } else {
      setCurrentConversation(null)
    }
  }, [selectedConversationId])

  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId)
  }

  const handleNewConversation = () => {
    setSelectedConversationId(null)
    setCurrentConversation(null)
  }

  const handleConversationUpdate = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId)
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar 
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          conversationTitle={currentConversation?.title}
          selectedModelId={selectedModelId}
          onSelectModel={handleSelectModel}
          onNewConversation={handleNewConversation}
        />
        <ChatPanel 
          conversationId={selectedConversationId}
          selectedModel={selectedModelId}
          onConversationUpdate={handleConversationUpdate}
        />
      </div>
    </div>
  )
}
