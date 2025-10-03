"use client"

import { ActionItem, QuickAction, StylingConfig, TextConfig } from '@/design-system/molecules/dynamic-chat-input'
import {
  BarChart3,
  Calendar,
  FileText,
  Folder,
  Globe,
  Paperclip,
  PieChart,
  TrendingUp
} from 'lucide-react'

// Stock Agent specific configuration
export const StockAgentConfig = {
  quickActions: [
    {
      id: 'invest-apple-microsoft',
      title: 'Invest $20,000 in Apple and $15,000 in Microsoft since January 2023',
      description: 'Invest $20,000 in Apple and $15,000 in Microsoft since January 2023',
      onClick: () => console.log('Investing in Apple and Microsoft...')
    },
    {
      id: 'analyze-stock',
      title: 'Analyze Apple stock performance since 2023',
      description: 'Get detailed analysis of AAPL stock trends and performance',
      onClick: () => console.log('Analyzing Apple stock...')
    },
    {
      id: 'create-portfolio',
      title: 'Create a diversified portfolio with $50k',
      description: 'Build a balanced investment portfolio with risk assessment',
      onClick: () => console.log('Creating portfolio...')
    },
    {
      id: 'market-trends',
      title: 'What are the current market trends?',
      description: 'Get latest market insights and sector analysis',
      onClick: () => console.log('Fetching market trends...')
    },
    {
      id: 'risk-analysis',
      title: 'Analyze portfolio risk factors',
      description: 'Assess risk exposure and diversification metrics',
      onClick: () => console.log('Analyzing risk...')
    }
  ] as QuickAction[],

  createItems: [
    {
      id: 'portfolio-analysis',
      label: 'Portfolio Analysis',
      description: 'Generate comprehensive portfolio report',
      icon: PieChart,
      status: 'available' as const,
      onClick: () => console.log('Creating portfolio analysis...')
    },
    {
      id: 'stock-chart',
      label: 'Stock Chart',
      description: 'Create interactive stock price charts',
      icon: BarChart3,
      status: 'beta' as const,
      onClick: () => console.log('Generating stock chart...')
    },
    {
      id: 'risk-assessment',
      label: 'Risk Assessment',
      description: 'Analyze portfolio risk and volatility',
      icon: TrendingUp,
      status: 'available' as const,
      onClick: () => console.log('Assessing risk...')
    },
    {
      id: 'earnings-report',
      label: 'Earnings Report',
      description: 'Generate quarterly earnings analysis',
      icon: FileText,
      status: 'available' as const,
      onClick: () => console.log('Creating earnings report...')
    },
    {
      id: 'market-outlook',
      label: 'Market Outlook',
      description: 'Create market forecast and predictions',
      icon: Globe,
      status: 'coming-soon' as const,
      onClick: () => console.log('Generating market outlook...')
    }
  ] as ActionItem[],

  knowledgeItems: [
    {
      id: 'folders',
      label: 'Portfolio Folders',
      icon: Folder
    },
    {
      id: 'upload-files',
      label: 'Upload Financial Docs',
      icon: Paperclip
    },
    {
      id: 'market-data',
      label: 'Market Data',
      icon: Globe
    },
    {
      id: 'reports',
      label: 'Previous Reports',
      icon: FileText
    },
    {
      id: 'calendar',
      label: 'Earnings Calendar',
      icon: Calendar
    }
  ] as ActionItem[],

  folderItems: [
    {
      id: 'quarterly-reports',
      label: 'Quarterly Reports',
      description: '8 files',
      icon: Folder
    },
    {
      id: 'earnings-calls',
      label: 'Earnings Calls',
      description: '12 files',
      icon: Folder
    },
    {
      id: 'research-notes',
      label: 'Research Notes',
      description: '25 files',
      icon: Folder
    },
    {
      id: 'portfolio-snapshots',
      label: 'Portfolio Snapshots',
      description: '15 files',
      icon: Folder
    },
    {
      id: 'market-analysis',
      label: 'Market Analysis',
      description: '18 files',
      icon: Folder
    }
  ] as ActionItem[],

  text: {
    placeholder: "Ask about stocks, portfolios, or market analysis...",
    workingPlaceholder: "Analyzing market data...",
    createLabel: "Create Analysis",
    knowledgeLabel: "Data Sources",
    quickActionsLabel: "Quick Analysis",
    foldersLabel: "Portfolio Folders",
    uploadFilesLabel: "Upload Financial Docs",
    meetingsLabel: "Earnings Calendar",
    fileUploadsLabel: "Previous Reports",
    searchWebLabel: "Market Data",
    betaLabel: "Beta",
    comingSoonLabel: "Coming Soon",
    allEnabledLabel: "All enabled",
    clearSelectionLabel: "Clear selection",
    selectedLabel: "Selected",
    backToLabel: "Back to"
  } as Partial<TextConfig>,

  styling: {
    primaryButtonClass: "bg-green-600 hover:bg-green-700",
    selectedButtonClass: "bg-green-500 hover:bg-green-600",
    secondaryButtonClass: "bg-slate-600 hover:bg-slate-700",
    popupClass: "border-green-200 bg-white/95 backdrop-blur-sm",
    popupItemClass: "hover:bg-green-50 group-hover:text-green-900"
  } as Partial<StylingConfig>
}

// Event handlers for stock agent specific actions
export const StockAgentHandlers = {
  onQuickActionSelect: (action: QuickAction) => {
    console.log('Stock Agent quick action selected:', action)
    // Add specific logic for each quick action
    switch (action.id) {
      case 'analyze-stock':
        // Trigger stock analysis
        break
      case 'create-portfolio':
        // Trigger portfolio creation
        break
      case 'market-trends':
        // Trigger market analysis
        break
      case 'risk-analysis':
        // Trigger risk assessment
        break
    }
  },

  onCreateItemSelect: (item: ActionItem) => {
    console.log('Stock Agent create item selected:', item)
    // Add specific logic for each create item
    switch (item.id) {
      case 'portfolio-analysis':
        // Generate portfolio analysis
        break
      case 'stock-chart':
        // Create stock chart
        break
      case 'risk-assessment':
        // Perform risk assessment
        break
      case 'earnings-report':
        // Generate earnings report
        break
    }
  },

  onKnowledgeItemSelect: (item: ActionItem) => {
    console.log('Stock Agent knowledge item selected:', item)
    // Add specific logic for knowledge base access
  },

  onFolderItemSelect: (item: ActionItem) => {
    console.log('Stock Agent folder item selected:', item)
    // Add specific logic for folder navigation
  }
}
