"use client"

import { AgentCanvasLayout, createPanelConfig } from '@/design-system/layouts'
import { CopilotChat } from "@copilotkit/react-ui"
import { Building, FileText } from 'lucide-react'
import React, { useState } from 'react'
import BppAgentChatInput from './bpp-agent-chat-input'

interface BppAgentLayoutProps {
  children: React.ReactNode
}

export default function BppAgentLayout({
  children
}: BppAgentLayoutProps) {
  const [isClient, setIsClient] = useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">⚙️</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading BPP AI Assistant</h2>
          <p className="text-slate-500">Initializing business process planning assistant...</p>
        </div>
      </div>
    )
  }

  // Event handlers
  const handlePlusClick = () => {
    console.log('Create new process')
  }

  const handleShareClick = () => {
    console.log('Share process analysis')
  }

  const handleOpenNewTabClick = () => {
    console.log('Open in new tab')
  }

  const handleDownloadClick = () => {
    console.log('Download process report')
  }

  // Chat content component with working CopilotChat structure
  const chatContent = (
    <div className="h-full overflow-hidden">
      <CopilotChat
        className="h-full rounded-lg overflow-y-auto transparent-copilot-chat"
        labels={{
          initial: "Welcome to the Best Practice Platform (BPP) Knowledge Assistant — Agent 1.\n\nWhat I do\n• Answer questions about real best practices used by our business leaders\n• Search semantically across leader profiles and practice cards (JP/EN)\n• Return concise summaries with citations to the exact source snippets\n• Let you filter by Region, Tenure band, Team size band, and Practice category\n\nTry asking me (English)\n• “Show Instagram tactics used by leaders with tenure under 6 months in Tokyo. Cite sources.”\n• “Compare workshop cadences for small teams in Kansai.”\n• “Who used LINE for follow‑ups? Provide steps and links.”\n• “Summarize common ‘Business Philosophy’ themes among top performers.”\n\nお試しください（日本語）\n• 「在籍6ヶ月以内のリーダーが使ったSNS施策を教えて。引用付きで」\n• 「関西の小規模チーム（1〜5人）の体験会の開催頻度は？」\n• 「LINEでのフォローアップ手順を使ったリーダーは？」\n• 「成果上位者の“ビジネス哲学”の共通点を要約して」\n\nNotes\n• I only use stored evidence; if sources are thin, I’ll show the closest matches.\n• Use filters to narrow results. Click ‘Sources’ to view original snippets.",
          placeholder: "Ask about leader best practices (JP/EN)… e.g., “SNS tactics for new leaders in Tokyo” / 「関西の小規模チームのワークショップ頻度は？」"
        }}
        Input={BppAgentChatInput}
        imageUploadsEnabled={false}
        suggestions="auto"
        hideStopButton={false}
        onInProgress={(inProgress) => {
          console.log('BPP Agent chat in progress:', inProgress)
        }}
        onSubmitMessage={(message) => {
          console.log('BPP Agent message submitted:', message)
        }}
        onCopy={(message) => {
          console.log('BPP Agent message copied:', message)
        }}
        onThumbsUp={(message) => {
          console.log('BPP Agent thumbs up for message:', message)
        }}
        onThumbsDown={(message) => {
          console.log('BPP Agent thumbs down for message:', message)
        }}
      />
    </div>
  )

  return (
    <AgentCanvasLayout
      defaultChatWidth={0.6}
      minChatWidth={0.3}
      maxChatWidth={0.8}
      chatPanel={createPanelConfig(
        "BPP AI Assistant",
        <Building className="w-5 h-5 text-blue-600" />
      )}
      canvasPanel={createPanelConfig(
        "AJ BPP Dashboard",
        <FileText className="w-5 h-5 text-cyan-600" />
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
