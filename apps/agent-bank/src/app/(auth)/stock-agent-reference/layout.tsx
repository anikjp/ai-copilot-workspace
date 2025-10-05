"use client"

import { getAgentConfig } from '@/config/agents'
import { AgentCanvasLayout, createPanelConfig } from '@/design-system/layouts'
import DynamicChatInput from '@/design-system/molecules/dynamic-chat-input'
import { CopilotChat } from "@copilotkit/react-ui"
import { BarChart3, TrendingUp } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

interface StockAgentReferenceLayoutProps {
  children: React.ReactNode
}

export default function StockAgentReferenceLayout({
  children
}: StockAgentReferenceLayoutProps) {
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const agentConfig = getAgentConfig(pathname)

  React.useEffect(() => {
    setIsClient(true)
    // Debug: Log the agent configuration being used
    console.log('🔵 STOCK REFERENCE LAYOUT: Pathname:', pathname)
    console.log('🔵 STOCK REFERENCE LAYOUT: Agent Config:', agentConfig)
    console.log('🔵 STOCK REFERENCE LAYOUT: Runtime URL:', agentConfig.runtimeUrl)
  }, [pathname, agentConfig])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">📈</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Stock Analysis Agent</h2>
          <p className="text-slate-500">Initializing your investment analysis assistant...</p>
          <p className="text-xs text-slate-400 mt-2">Using: {agentConfig.runtimeUrl}</p>
        </div>
      </div>
    )
  }

  // Event handlers
  const handlePlusClick = () => {
    console.log('Create new portfolio analysis')
  }

  const handleShareClick = () => {
    console.log('Share portfolio analysis')
  }

  const handleOpenNewTabClick = () => {
    console.log('Open analysis in new tab')
  }

  const handleDownloadClick = () => {
    console.log('Download portfolio report')
  }

  // Chat content component with CopilotChat structure
  const chatContent = (
    <div className="h-full overflow-hidden">
      <CopilotChat
        className="h-full rounded-lg overflow-y-auto transparent-copilot-chat"
        labels={{
          initial: `Welcome to the Stock Analysis Agent (Reference Implementation)! I'm your intelligent investment assistant specialized in:

📈 **Portfolio Analysis & Management:**
• Analyze stock performance and trends
• Generate investment recommendations
• Create portfolio allocations
• Track market performance vs benchmarks

📊 **Advanced Analytics:**
• Bull and bear case analysis
• Risk assessment and insights
• Performance visualization with charts
• Real-time market data integration

💰 **Investment Strategies:**
• Portfolio optimization
• Asset allocation recommendations
• Risk-return analysis
• Market timing insights

🚀 **Try asking me:**
• "Analyze AAPL and NVDA for my portfolio"
• "Create a balanced portfolio with $100K"
• "Show me the performance of tech stocks"
• "What's the bull case for renewable energy stocks?"

💡 This is a reference implementation showcasing advanced agent capabilities with interactive charts, real-time analysis, and comprehensive investment insights!`,
          placeholder: "Ask me about stocks, portfolios, or investment strategies..."
        }}
        Input={DynamicChatInput}
        imageUploadsEnabled={false}
        suggestions="auto"
        hideStopButton={false}
        onInProgress={(inProgress) => {
          console.log('Stock Agent Reference chat in progress:', inProgress)
        }}
        onSubmitMessage={(message) => {
          console.log('Stock Agent Reference message submitted:', message)
        }}
        onCopy={(message) => {
          console.log('Stock Agent Reference message copied:', message)
        }}
        onThumbsUp={(message) => {
          console.log('Stock Agent Reference thumbs up for message:', message)
        }}
        onThumbsDown={(message) => {
          console.log('Stock Agent Reference thumbs down for message:', message)
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
        "Stock Analysis Assistant",
        <TrendingUp className="w-5 h-5 text-green-600" />
      )}
      canvasPanel={createPanelConfig(
        "Portfolio Dashboard",
        <BarChart3 className="w-5 h-5 text-emerald-600" />
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
