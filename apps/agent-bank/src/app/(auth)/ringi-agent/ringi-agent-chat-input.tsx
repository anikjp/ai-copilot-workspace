"use client"

import DynamicChatInput from '@/design-system/molecules/dynamic-chat-input'
import { BookOpen, DollarSign, FileText, Users } from 'lucide-react'

// CopilotKit InputProps interface
interface InputProps {
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: () => void
}

// Ringi System specific configuration
const RingiAgentConfig = {
  quickActions: [
    {
      id: "analyze-proposal",
      title: "Analyze Proposal",
      description: "Start analyzing a business proposal",
      onClick: () => console.log("Analyze proposal clicked")
    },
    {
      id: "check-consensus",
      title: "Check Consensus",
      description: "Review stakeholder consensus",
      onClick: () => console.log("Check consensus clicked")
    },
    {
      id: "generate-decision",
      title: "Generate Decision",
      description: "Create final decision recommendation",
      onClick: () => console.log("Generate decision clicked")
    }
  ],
  createItems: [
    {
      id: "budget-proposal",
      label: "Budget Proposal",
      description: "Create a budget approval request",
      icon: DollarSign,
      onClick: () => console.log("Budget proposal clicked")
    },
    {
      id: "policy-change",
      label: "Policy Change",
      description: "Request a policy modification",
      icon: FileText,
      onClick: () => console.log("Policy change clicked")
    },
    {
      id: "resource-request",
      label: "Resource Request",
      description: "Request additional resources",
      icon: Users,
      onClick: () => console.log("Resource request clicked")
    }
  ],
  knowledgeItems: [
    {
      id: "ringi-process",
      label: "Ringi Process Guide",
      description: "Learn about Japanese decision-making",
      icon: BookOpen,
      onClick: () => console.log("Ringi process guide clicked")
    },
    {
      id: "stakeholder-management",
      label: "Stakeholder Management",
      description: "Best practices for consensus building",
      icon: Users,
      onClick: () => console.log("Stakeholder management clicked")
    }
  ]
}

const RingiAgentHandlers = {
  onQuickAction: (actionId: string) => {
    console.log("Ringi quick action:", actionId)
  },
  onCreateItem: (itemId: string) => {
    console.log("Ringi create item:", itemId)
  },
  onKnowledgeItem: (itemId: string) => {
    console.log("Ringi knowledge item:", itemId)
  }
}

export default function RingiAgentChatInput({
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
      {...RingiAgentConfig}
      {...RingiAgentHandlers}
    />
  )
}
