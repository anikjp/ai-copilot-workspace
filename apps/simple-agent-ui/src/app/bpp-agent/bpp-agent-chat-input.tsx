"use client"

import DynamicChatInput from '@/design-system/molecules/dynamic-chat-input'
import { Building, FileText, Settings, Workflow } from 'lucide-react'

// CopilotKit InputProps interface
interface InputProps {
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: () => void
}

// BPP AI Assistant specific configuration
const BppAgentConfig = {
  quickActions: [
    {
      id: "analyze-process",
      title: "Analyze Process",
      description: "Start analyzing a business process",
      onClick: () => console.log("Analyze process clicked")
    },
    {
      id: "design-workflow",
      title: "Design Workflow",
      description: "Create automated workflow design",
      onClick: () => console.log("Design workflow clicked")
    },
    {
      id: "compliance-check",
      title: "Compliance Check",
      description: "Verify process compliance requirements",
      onClick: () => console.log("Compliance check clicked")
    }
  ],
  createItems: [
    {
      id: "financial-process",
      label: "Financial Process",
      description: "Create a financial workflow",
      icon: FileText,
      onClick: () => console.log("Financial process clicked")
    },
    {
      id: "operational-process",
      label: "Operational Process",
      description: "Design operational workflow",
      icon: Workflow,
      onClick: () => console.log("Operational process clicked")
    },
    {
      id: "compliance-process",
      label: "Compliance Process",
      description: "Build compliance workflow",
      icon: Settings,
      onClick: () => console.log("Compliance process clicked")
    }
  ],
  knowledgeItems: [
    {
      id: "process-optimization",
      label: "Process Optimization",
      description: "Learn about workflow optimization",
      icon: Building,
      onClick: () => console.log("Process optimization clicked")
    },
    {
      id: "automation-guide",
      label: "Automation Guide",
      description: "Best practices for process automation",
      icon: Workflow,
      onClick: () => console.log("Automation guide clicked")
    }
  ]
}

const BppAgentHandlers = {
  onQuickAction: (actionId: string) => {
    console.log("BPP quick action:", actionId)
  },
  onCreateItem: (itemId: string) => {
    console.log("BPP create item:", itemId)
  },
  onKnowledgeItem: (itemId: string) => {
    console.log("BPP knowledge item:", itemId)
  }
}

export default function BppAgentChatInput({
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
      {...BppAgentConfig}
      {...BppAgentHandlers}
    />
  )
}
