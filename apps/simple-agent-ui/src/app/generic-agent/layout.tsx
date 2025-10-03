"use client"

import { AgentCanvasLayout, createPanelConfig } from '@/design-system/layouts'
import { CopilotChat } from "@copilotkit/react-ui"
import { Brain, FileText } from 'lucide-react'
import React, { useState } from 'react'
import GenericAgentChatInput from './generic-agent-chat-input'

interface GenericAgentLayoutProps {
  children: React.ReactNode
}

export default function GenericAgentLayout({
  children
}: GenericAgentLayoutProps) {
  const [isClient, setIsClient] = useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">🤖</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Generic AI Agent</h2>
          <p className="text-slate-500">Initializing your intelligent workspace assistant...</p>
        </div>
      </div>
    )
  }

  // Event handlers
  const handlePlusClick = () => {
    console.log('Create new file or analysis')
  }

  const handleShareClick = () => {
    console.log('Share workspace analysis')
  }

  const handleOpenNewTabClick = () => {
    console.log('Open in new tab')
  }

  const handleDownloadClick = () => {
    console.log('Download workspace report')
  }

  // Chat content component with working CopilotChat structure
  const chatContent = (
    <div className="h-full overflow-hidden">
      <CopilotChat
        className="h-full rounded-lg overflow-y-auto transparent-copilot-chat"
        labels={{
          initial: `Welcome to the Generic AI Agent! I'm your intelligent workspace assistant specialized in:

🤖 AI-Powered Analysis:
• Analyze uploaded files and data
• Generate insights and reports
• Process various file formats
• Provide intelligent recommendations

📁 Workspace Management:
• Upload and organize files
• Create new documents and code
• Manage workspace structure
• Track file changes and versions

💻 Code & Content Generation:
• Generate Python scripts and code
• Create documentation and reports
• Process data and generate visualizations
• Build custom solutions

🚀 Try asking me:
• "Analyze the data in my workspace"
• "Create a Python script to process this file"
• "Generate a report based on my uploaded files"
• "Help me organize my workspace files"

💡 I can work with any type of file and help you build intelligent solutions!`,
          placeholder: "Describe what you'd like me to help you with..."
        }}
        Input={GenericAgentChatInput}
        imageUploadsEnabled={true}
        suggestions={[]}
        hideStopButton={false}
        onInProgress={(inProgress) => {
          console.log('Generic Agent chat in progress:', inProgress)
        }}
        onSubmitMessage={(message) => {
          console.log('Generic Agent message submitted:', message)
        }}
        onCopy={(message) => {
          console.log('Generic Agent message copied:', message)
        }}
        onThumbsUp={(message) => {
          console.log('Generic Agent thumbs up for message:', message)
        }}
        onThumbsDown={(message) => {
          console.log('Generic Agent thumbs down for message:', message)
        }}
      />
    </div>
  )

  return (
    <AgentCanvasLayout
      defaultChatWidth={0.4}
      minChatWidth={0.3}
      maxChatWidth={0.8}
      chatPanel={createPanelConfig(
        "Generic AI Assistant",
        <Brain className="w-5 h-5 text-blue-600" />
      )}
      canvasPanel={createPanelConfig(
        "Workspace Dashboard",
        <FileText className="w-5 h-5 text-purple-600" />
      )}
      chatContent={chatContent}
      canvasContent={children}
      onPlusClick={handlePlusClick}
      onShareClick={handleShareClick}
      onOpenNewTabClick={handleOpenNewTabClick}
      onDownloadClick={handleDownloadClick}
    >
      {/* Fallback content */}
      <div>Loading...</div>
    </AgentCanvasLayout>
  )
}