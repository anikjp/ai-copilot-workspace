"use client"

import DynamicChatInput from "@/design-system/molecules/dynamic-chat-input"

// CopilotKit InputProps interface (mirrors stock agent)
interface InputProps {
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: () => void
}

export default function GenericAgentChatInput({
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
    />
  )
}
