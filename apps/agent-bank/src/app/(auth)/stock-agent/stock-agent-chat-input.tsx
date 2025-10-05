"use client"

import DynamicChatInput from '@/design-system/molecules/dynamic-chat-input'
import { StockAgentConfig, StockAgentHandlers } from './stock-agent-config'

// CopilotKit InputProps interface
interface InputProps {
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: () => void
}

export default function StockAgentChatInput({
  inProgress,
  onSend,
  isVisible = true,
  onStop,
  onUpload,
}: InputProps) {
  return (
    <DynamicChatInput
      inProgress={inProgress}
      onSend={onSend}
      isVisible={isVisible}
      onStop={onStop}
      onUpload={onUpload ? (files) => onUpload() : undefined}
      {...StockAgentConfig}
      {...StockAgentHandlers}
    />
  )
}
