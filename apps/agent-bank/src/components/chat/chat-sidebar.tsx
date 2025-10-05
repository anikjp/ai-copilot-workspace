"use client"

import { Button } from "@/design-system/atoms/button"
import { Card, CardContent } from "@/design-system/atoms/card"
import { apiClient } from "@/lib/api-client"
import { MessageSquare, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ChatConversation {
  id: string
  user_id: string
  title: string
  model_id: string
  created_at: string
  updated_at: string
  messages: any[]
}

interface ChatSidebarProps {
  selectedConversationId?: string
  onSelectConversation: (conversationId: string | null) => void
  onNewConversation: () => void
}

export function ChatSidebar({ selectedConversationId, onSelectConversation, onNewConversation }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const fetchedConversations = await apiClient.getConversations()
      setConversations(fetchedConversations)
      setError(null)
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await apiClient.deleteConversation(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      // If we deleted the currently selected conversation, clear selection
      if (selectedConversationId === conversationId) {
        onSelectConversation(null)
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('Failed to delete conversation')
    }
  }

  const getLastMessage = (conversation: ChatConversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "No messages yet"
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    return lastMessage.content || "No content"
  }

  return (
    <div className="w-64 h-full bg-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Button className="w-full" onClick={onNewConversation}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground p-4">
            <p>Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadConversations} className="mt-2">
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <p>No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className={`cursor-pointer hover:bg-muted/50 ${
                selectedConversationId === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getLastMessage(conversation)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
