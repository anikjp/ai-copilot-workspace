"use client"

import { Button } from "@/design-system/atoms/button"
import { Input } from "@/design-system/atoms/input"
import { apiClient } from "@/lib/api-client"
import { Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  model?: string
}

interface ChatPanelProps {
  conversationId?: string
  selectedModel: string
  onConversationUpdate?: (conversationId: string) => void
}

export function ChatPanel({ conversationId, selectedModel, onConversationUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  const loadConversation = async (id: string) => {
    try {
      const conversation = await apiClient.getConversation(id)
      setMessages(conversation.messages || [])
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setStreamingMessage("")

    try {
      await apiClient.sendMessageStream(
        {
          message: input,
          model_id: selectedModel,
          conversation_id: conversationId,
          stream: true
        },
        (chunk) => {
          setStreamingMessage(prev => prev + chunk)
        },
        (newConversationId) => {
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: streamingMessage,
            timestamp: new Date().toISOString(),
            model: selectedModel
          }
          
          setMessages(prev => [...prev, assistantMessage])
          setStreamingMessage("")
          setIsLoading(false)
          
          if (onConversationUpdate) {
            onConversationUpdate(newConversationId)
          }
        },
        (error) => {
          console.error('Streaming error:', error)
          setStreamingMessage("")
          setIsLoading(false)
        }
      )
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingMessage ? (
          <div className="text-center text-muted-foreground">
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.model && (
                    <p className="text-xs opacity-70 mt-1">Model: {message.model}</p>
                  )}
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm">{streamingMessage}</p>
                  <p className="text-xs opacity-70 mt-1">Model: {selectedModel}</p>
                </div>
              </div>
            )}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
