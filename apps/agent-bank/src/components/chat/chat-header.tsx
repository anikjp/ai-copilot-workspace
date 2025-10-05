"use client"

import { Button } from "@/design-system/atoms/button"
import { MoreHorizontal, Plus } from "lucide-react"
import { ModelSelector } from "./model-selector"

interface ChatHeaderProps {
  conversationTitle?: string
  selectedModelId: string
  onSelectModel: (modelId: string) => void
  onNewConversation: () => void
}

export function ChatHeader({ 
  conversationTitle, 
  selectedModelId, 
  onSelectModel, 
  onNewConversation 
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {conversationTitle || "New Chat"}
          </h1>
          <Button variant="ghost" size="sm" onClick={onNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ModelSelector 
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
        />
      </div>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  )
}
