"use client"

import { AgentCanvasLayout, createPanelConfig } from '@/design-system/layouts'
import { CopilotChat } from "@copilotkit/react-ui"
import { Building, FileText } from 'lucide-react'
import React, { useState } from 'react'
import RingiAgentChatInput from './ringi-agent-chat-input'

interface RingiAgentLayoutProps {
  children: React.ReactNode
}

export default function RingiAgentLayout({
  children
}: RingiAgentLayoutProps) {
  const [isClient, setIsClient] = useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">🏢</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Ringi System Agent</h2>
          <p className="text-slate-500">Initializing Japanese business decision-making assistant...</p>
        </div>
      </div>
    )
  }

  // Event handlers
  const handlePlusClick = () => {
    console.log('Create new proposal')
  }

  const handleShareClick = () => {
    console.log('Share proposal analysis')
  }

  const handleOpenNewTabClick = () => {
    console.log('Open in new tab')
  }

  const handleDownloadClick = () => {
    console.log('Download proposal report')
  }

  // Chat content component with working CopilotChat structure
  const chatContent = (
    <div className="h-full overflow-hidden">
      <CopilotChat
        className="h-full rounded-lg overflow-y-auto transparent-copilot-chat"
        labels={{
          initial: `Welcome to the Ringi System AI Agent! I'm your Japanese business decision-making assistant specialized in:

🏢 Ringi System Process:
• Analyze business proposals and their impact
• Facilitate stakeholder consensus building
• Manage collaborative decision-making workflows
• Track approval processes and timelines

📋 Proposal Management:
• Process budget requests and approvals
• Review policy changes and implementations
• Evaluate resource allocation proposals
• Assess strategic initiative recommendations

🚀 Try asking me:
• "Analyze this budget proposal for Q2 marketing"
• "Process the remote work policy change request"
• "Review stakeholder feedback for the software upgrade"
• "Generate decision for the team expansion proposal"

💡 I follow traditional Japanese business culture and help ensure all stakeholders are consulted before major decisions are made!`,
          placeholder: "Describe your business proposal for Ringi analysis..."
        }}
        Input={RingiAgentChatInput}
        imageUploadsEnabled={false}
        suggestions="auto"
        hideStopButton={false}
        onInProgress={(inProgress) => {
          console.log('Ringi Agent chat in progress:', inProgress)
        }}
        onSubmitMessage={(message) => {
          console.log('Ringi Agent message submitted:', message)
        }}
        onCopy={(message) => {
          console.log('Ringi Agent message copied:', message)
        }}
        onThumbsUp={(message) => {
          console.log('Ringi Agent thumbs up for message:', message)
        }}
        onThumbsDown={(message) => {
          console.log('Ringi Agent thumbs down for message:', message)
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
        "Ringi System Assistant",
        <Building className="w-5 h-5 text-indigo-600" />
      )}
      canvasPanel={createPanelConfig(
        "Proposal Dashboard",
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
