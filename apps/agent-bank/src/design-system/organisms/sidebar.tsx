"use client"

import { UI_TEXT } from '@/config/constants'
import { Button } from '@/design-system/atoms/button'
import SettingsDropdown from '@/design-system/molecules/settings-dropdown'
import { cn } from '@/lib/utils'
import { useOrganization } from '@clerk/nextjs'
import {
  Building,
  FileText,
  Folder,
  Grid3X3,
  PanelLeftOpen,
  PanelRightOpen,
  Plus,
  Settings,
  TrendingUp,
  Users,
  Workflow
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  collapsed?: boolean
  className?: string
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, className, onToggle }: SidebarProps) {
  const { subscription } = UI_TEXT
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { organization } = useOrganization()

  if (collapsed) {
    return (
      <div className={cn("w-12 bg-white flex flex-col h-full", className)}>
        {/* Expand Button Only */}
        <div className="p-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={onToggle}
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-56 bg-white border-r border-gray-200 flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 flex-shrink-0 relative">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-semibold tracking-wide">{organization?.name?.charAt(0) || 'A'}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 truncate">{organization?.name || 'Your Organization'}</div>
            <div className="text-xs text-gray-500">Workspace</div>
          </div>
        </div>
        
        {/* Collapse button positioned on the right border */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          onClick={onToggle}
          title="Collapse sidebar"
        >
          <PanelRightOpen className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
        {/* Quick Actions */}
        <div className="space-y-1">
          {[
            { id: "new-chat", label: "New Chat", icon: Plus, href: "/chat/new" },
          ].map((action) => {
            const IconComponent = action.icon
            const isActive = pathname === action.href
            return (
              <Link key={action.id} href={action.href || '#'}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 rounded-xl text-left transition-all duration-200",
                    isActive 
                      ? "bg-blue-500 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span className="font-medium">{action.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>


        {/* AI Agents */}
        <div className="mt-8">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4 px-1">
            AI Agents
          </div>
          <div className="space-y-1">
            {[
              { id: "stock-agent", label: "Stock Agent", icon: TrendingUp, href: "/stock-agent" },
              { id: "stock-agent-reference", label: "Stock Reference", icon: TrendingUp, href: "/stock-agent-reference" },
              { id: "docu-agent", label: "Document Agent", icon: FileText, href: "/docu-agent" },
              { id: "hr-agent", label: "HR Agent", icon: Users, href: "/hr-agent" },
              { id: "it-support-agent", label: "IT Support", icon: Settings, href: "/it-support-agent" },
              { id: "ringi-agent", label: "Ringi System", icon: Building, href: "/ringi-agent" },
              { id: "bpp-agent", label: "BPP Assistant", icon: Workflow, href: "/bpp-agent" }
            ].map((agent) => {
              const isActive = pathname === agent.href
              return (
                <Link key={agent.id} href={agent.href || '#'}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-blue-500 text-white shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <agent.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{agent.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Knowledge */}
        <div className="mt-8">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4 px-1">
            Knowledge
          </div>
          <div className="space-y-1">
            {[
              { id: "demo-folder-1", label: "Demo Folder 1", icon: Folder, href: "/knowledge/demo-folder-1" },
              { id: "demo-folder-2", label: "Demo Folder 2", icon: Folder, href: "/knowledge/demo-folder-2" },
              { id: "view-all-knowledge", label: "Browse All", icon: Grid3X3, href: "/knowledge" }
            ].map((knowledge) => {
              const isActive = pathname === knowledge.href
              return (
                <Link key={knowledge.id} href={knowledge.href || '#'}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-blue-500 text-white shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <knowledge.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{knowledge.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="mt-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
            Recent Chats
          </div>
          <div className="space-y-1">
            {[
              { id: "capabilities-inquiry", label: "Capabilities Inquiry", timestamp: "2:30 PM", href: "/chat/capabilities-inquiry" },
              { id: "stock-analysis", label: "Stock Analysis", timestamp: "1:15 PM", href: "/chat/stock-analysis" },
              { id: "portfolio-review", label: "Portfolio Review", timestamp: "11:45 AM", href: "/chat/portfolio-review" },
              { id: "document-sample", label: "Document Sample", timestamp: "Yesterday", href: "/chat/document-sample" },
              { id: "market-research", label: "Market Research", timestamp: "Yesterday", href: "/chat/market-research" }
            ].map((chat) => {
              const isActive = pathname === chat.href
              return (
                <Link key={chat.id} href={chat.href || '#'}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-2 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-blue-500 text-white shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-medium truncate">{chat.label}</div>
                      <div className="text-xs text-gray-500">{chat.timestamp}</div>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

      </div>

      {/* Settings */}
      <div className="mt-auto border-t border-gray-100 p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start p-3 rounded-xl transition-all duration-200",
            isSettingsOpen
              ? "bg-blue-500 text-white shadow-sm" 
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Settings</span>
        </Button>
      </div>

      {/* Settings Dropdown */}
      <SettingsDropdown
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
