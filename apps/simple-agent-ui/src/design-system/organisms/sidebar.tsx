"use client"

import { UI_TEXT } from '@/config/constants'
import { Button } from '@/design-system/atoms/button'
import SettingsDropdown from '@/design-system/molecules/settings-dropdown'
import { cn } from '@/lib/utils'
import {
  Building,
  FileText,
  Folder,
  Grid3X3,
  Info,
  PanelRightClose,
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

  if (collapsed) {
    return (
      <div className={cn("w-16 bg-slate-100 flex flex-col h-full", className)}>
        {/* Fixed Header */}
        <div className="p-3 flex-shrink-0">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AJ</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 h-auto text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              onClick={onToggle}
              title="Expand sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
          {[
            { id: "new-chat", icon: Plus, href: "/chat/new" },
            { id: "browse-all-agents", icon: Grid3X3, href: "/agents" },
            { id: "browse-all-knowledge", icon: Folder, href: "/knowledge" }
          ].map((action) => {
            const IconComponent = action.icon
            const isActive = pathname === action.href
            return (
              <Link key={action.id} href={action.href || '#'}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-center p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-slate-200 text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-300 hover:shadow-sm"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Fixed Bottom Section */}
        <div className="mt-auto border-t border-gray-200 bg-slate-100 p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-center p-2 rounded-lg transition-all duration-200",
              isSettingsOpen
                ? "bg-slate-200 text-slate-900 shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300 hover:shadow-sm"
            )}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="w-4 h-4" />
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

  return (
    <div className={cn("w-64 bg-slate-100 flex flex-col h-full", className)}>
      {/* Fixed Header */}
      <div className="p-3 flex-shrink-0">
        <div className="w-full p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">AJ</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">AJ Copilot</div>
                <div className="text-xs text-gray-500">Amway AI Workspace</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 h-auto text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              onClick={onToggle}
              title="Collapse sidebar"
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Primary Actions */}
        <div className="px-4 pb-4">
        {[
          { id: "new-chat", label: "New chat", icon: Plus, href: "/chat/new" },
        ].map((action) => {
          const IconComponent = action.icon
          const isActive = pathname === action.href
          return (
            <Link key={action.id} href={action.href || '#'}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-10 rounded-lg text-left transition-all duration-200",
                  isActive 
                    ? "bg-slate-200 text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                )}
              >
                <IconComponent className="w-4 h-4 mr-3" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>


      {/* AI Agents Section */}
      <div className="px-4 pb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block px-1">
          AI Agents
        </span>
        <div className="space-y-1">
              {[
                { id: "stock-agent", label: "Stock Agent", icon: "TrendingUp", href: "/stock-agent" },
                { id: "stock-agent-reference", label: "Stock Agent (Reference)", icon: "TrendingUp", href: "/stock-agent-reference" },
                { id: "docu-agent", label: "Docu Agent", icon: "FileText", href: "/docu-agent" },
                { id: "hr-agent", label: "HR Agent", icon: "Users", href: "/hr-agent" },
                { id: "it-support-agent", label: "IT Support Agent", icon: "Settings", href: "/it-support-agent" },
                 {id: "product-search-agent", label: "Product Search Agent", icon: "Search", href: "/product-search-agent" },
                 {id: "order-analysis-agent", label: "Order Analysis Agent", icon: "ShoppingBag", href: "/order-analysis-agent" },
                { id: "ringi-agent", label: "Ringi System", icon: "Building", href: "/ringi-agent" },
                { id: "bpp-agent", label: "BPP AI Assistant", icon: "Workflow", href: "/bpp-agent" },
                { id: "browse-all-agents", label: "Browse All", icon: "Grid3X3", href: "/agents" }
              ].map((agent) => {
            const IconComponent = agent.icon === 'TrendingUp' ? TrendingUp :
                                 agent.icon === 'FileText' ? FileText :
                                 agent.icon === 'Users' ? Users :
                                 agent.icon === 'Settings' ? Settings :
                                 agent.icon === 'Building' ? Building :
                                 agent.icon === 'Workflow' ? Workflow :
                                 agent.icon === 'Info' ? Info :
                                 agent.icon === 'Grid3X3' ? Grid3X3 : TrendingUp
            const isActive = pathname === agent.href
              return (
                <Link key={agent.id} href={agent.href || '#'}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 h-10 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-slate-200 text-slate-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                    )}
                  >
                    <IconComponent className="w-4 h-4 mr-3" />
                    <span className="text-sm">{agent.label}</span>
                  </Button>
                </Link>
              )
            })}
        </div>
      </div>

      {/* Knowledge Section */}
      <div className="px-4 pb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block px-1">
          Knowledge
        </span>
        <div className="space-y-1">
          {[
            { id: "demo-folder-1", label: "Demo Folder 1", icon: "Folder", href: "/knowledge/demo-folder-1" },
            { id: "demo-folder-2", label: "Demo Folder 2", icon: "Folder", href: "/knowledge/demo-folder-2" },
            { id: "view-all-knowledge", label: "View All", icon: "Grid3X3", href: "/knowledge" }
          ].map((knowledge) => {
            const IconComponent = knowledge.icon === 'Folder' ? Folder :
                                 knowledge.icon === 'Grid3X3' ? Grid3X3 : Folder
            const isActive = pathname === knowledge.href
            return (
              <Link key={knowledge.id} href={knowledge.href || '#'}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 h-10 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-slate-200 text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                  )}
                >
                  <IconComponent className="w-4 h-4 mr-3" />
                  <span className="text-sm">{knowledge.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

        {/* Chat History */}
        <div className="px-4 pb-4 space-y-4">
          {/* Today */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block px-1">
              Today
            </span>
            <div className="space-y-1">
              {[
                { id: "capabilities-inquiry", label: "Capabilities Inquiry", timestamp: "2:30 PM", href: "/chat/capabilities-inquiry" },
                { id: "stock-analysis", label: "Stock Analysis", timestamp: "1:15 PM", href: "/chat/stock-analysis" },
                { id: "portfolio-review", label: "Portfolio Review", timestamp: "11:45 AM", href: "/chat/portfolio-review" }
              ].map((chat) => {
                const isActive = pathname === chat.href
                return (
                  <Link key={chat.id} href={chat.href || '#'}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 h-10 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-slate-200 text-slate-900 shadow-sm" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                      )}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{chat.label}</div>
                        <div className="text-xs text-gray-400">{chat.timestamp}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Yesterday */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block px-1">
              Yesterday
            </span>
            <div className="space-y-1">
              {[
                { id: "document-sample", label: "Document Sample", timestamp: "4:20 PM", href: "/chat/document-sample" },
                { id: "market-research", label: "Market Research", timestamp: "3:10 PM", href: "/chat/market-research" },
                { id: "investment-strategy", label: "Investment Strategy", timestamp: "2:00 PM", href: "/chat/investment-strategy" }
              ].map((chat) => {
                const isActive = pathname === chat.href
                return (
                  <Link key={chat.id} href={chat.href || '#'}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 h-10 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-slate-200 text-slate-900 shadow-sm" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                      )}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{chat.label}</div>
                        <div className="text-xs text-gray-400">{chat.timestamp}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Previous Days */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block px-1">
              Previous
            </span>
            <div className="space-y-1">
              {[
                { id: "portfolio-optimization", label: "Portfolio Optimization", timestamp: "Dec 15", href: "/chat/portfolio-optimization" },
                { id: "risk-assessment", label: "Risk Assessment", timestamp: "Dec 14", href: "/chat/risk-assessment" },
                { id: "market-trends", label: "Market Trends Analysis", timestamp: "Dec 13", href: "/chat/market-trends" },
                { id: "investment-advice", label: "Investment Advice", timestamp: "Dec 12", href: "/chat/investment-advice" },
                { id: "trading-strategy", label: "Trading Strategy", timestamp: "Dec 11", href: "/chat/trading-strategy" },
                { id: "market-analysis", label: "Market Analysis", timestamp: "Dec 10", href: "/chat/market-analysis" },
                { id: "portfolio-review", label: "Portfolio Review", timestamp: "Dec 9", href: "/chat/portfolio-review" },
                { id: "risk-management", label: "Risk Management", timestamp: "Dec 8", href: "/chat/risk-management" },
                { id: "investment-research", label: "Investment Research", timestamp: "Dec 7", href: "/chat/investment-research" },
                { id: "financial-planning", label: "Financial Planning", timestamp: "Dec 6", href: "/chat/financial-planning" }
              ].map((chat) => {
                const isActive = pathname === chat.href
                return (
                  <Link key={chat.id} href={chat.href || '#'}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 h-10 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-slate-200 text-slate-900 shadow-sm" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
                      )}
                    >
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{chat.label}</div>
                        <div className="text-xs text-gray-400">{chat.timestamp}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div className="mt-auto border-t border-gray-200 bg-slate-100">
        {/* Subscription Section */}
        {/* <div className="p-3">
          <div className="bg-white rounded-lg p-3 space-y-2 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 block truncate">
                  {subscription.usage}
                </span>
                <span className="text-xs text-gray-500 block truncate">
                  {subscription.upgradeText}
                </span>
              </div>
            </div>
            <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-md font-medium text-xs py-2">
              {subscription.upgradeButton}
            </Button>
          </div>
        </div> */}

        {/* Settings */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start p-3 h-auto rounded-lg transition-all duration-200",
              isSettingsOpen
                ? "bg-slate-200 text-slate-900 font-medium shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:shadow-sm"
            )}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{UI_TEXT.navigation.sidebar.settings}</span>
          </Button>
        </div>

        {/* Settings Dropdown */}
        <SettingsDropdown
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  )
}
