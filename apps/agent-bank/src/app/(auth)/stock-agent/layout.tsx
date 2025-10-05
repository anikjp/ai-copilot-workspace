"use client"

import { AgentCanvasLayout, createPanelConfig } from '@/design-system/layouts'
import { useCopilotChat } from "@copilotkit/react-core"
import { CopilotChat } from "@copilotkit/react-ui"
import { BarChart3, TrendingUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import StockAgentChatInput from './stock-agent-chat-input'

interface StockAgentLayoutProps {
  children: React.ReactNode
}

export default function StockAgentLayout({
  children
}: StockAgentLayoutProps) {
  const [isClient, setIsClient] = useState(false)
  
  // Monitor CopilotChat messages
  const { visibleMessages, isLoading } = useCopilotChat()
  
  useEffect(() => {
    console.log('🟢 COPILOT CHAT: Messages changed:', visibleMessages.length)
    console.log('🟢 COPILOT CHAT: Loading state:', isLoading)
    if (visibleMessages.length > 0) {
      console.log('🟢 COPILOT CHAT: Last message:', visibleMessages[visibleMessages.length - 1])
    }
  }, [visibleMessages, isLoading])

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">📈</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Stock Agent</h2>
          <p className="text-slate-500">Initializing investment assistant...</p>
        </div>
      </div>
    )
  }

  // Event handlers
  const handlePlusClick = () => {
    console.log('Create new analysis')
  }

  const handleShareClick = () => {
    console.log('Share analysis')
  }

  const handleOpenNewTabClick = () => {
    console.log('Open in new tab')
  }

  const handleDownloadClick = () => {
    console.log('Download analysis')
  }

  // Chat content component with working CopilotChat structure
  const chatContent = (
    <div className="h-full overflow-hidden">
      <CopilotChat
        className="h-full rounded-lg overflow-y-auto transparent-copilot-chat"
        labels={{
          initial: `Welcome to the Stock Agent! I'm your AI investment assistant specialized in:

📊 Portfolio Analysis:
• Analyze stock performance and trends
• Create diversified investment portfolios
• Track market movements and opportunities
• Provide risk assessments and insights

🚀 Try asking me:
• "Analyze Apple stock performance since 2023"
• "Create a diversified portfolio with $50k"
• "What are the current market trends?"
• "Show me Tesla's financial metrics"

💡 I have access to 4 years of historical stock data and can help you make informed investment decisions!`,
          placeholder: "Ask Stock Agent anything..."
        }}
        Input={StockAgentChatInput}
        imageUploadsEnabled={false}
        suggestions="auto"
        hideStopButton={false}
        onInProgress={(inProgress) => {
          console.log('🟢 FRONTEND: Stock Agent chat in progress:', inProgress)
        }}
        onSubmitMessage={(message) => {
          console.log('🟢 FRONTEND: Stock Agent message submitted:', message)
        }}
        onCopy={(message) => {
          console.log('Stock Agent message copied:', message)
        }}
        onThumbsUp={(message) => {
          console.log('Stock Agent thumbs up for message:', message)
        }}
        onThumbsDown={(message) => {
          console.log('Stock Agent thumbs down for message:', message)
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
        "Stock Assistant",
        <TrendingUp className="w-5 h-5 text-green-600" />
      )}
      canvasPanel={createPanelConfig(
        "Analysis Dashboard",
        <BarChart3 className="w-5 h-5 text-blue-600" />
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