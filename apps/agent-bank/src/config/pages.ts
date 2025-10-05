// Page configurations for different layouts
import { PageConfig } from '@/types/design-system'

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  dashboard: {
    title: "Dashboard",
    description: "Overview of your investment portfolio",
    layout: "dashboard",
    showSidebar: true,
    showTopBar: true,
    showChat: true
  },
  portfolio: {
    title: "Portfolio",
    description: "Detailed portfolio analysis and management",
    layout: "portfolio", 
    showSidebar: true,
    showTopBar: true,
    showChat: true
  },
  analytics: {
    title: "Analytics",
    description: "Advanced analytics and insights",
    layout: "analytics",
    showSidebar: true,
    showTopBar: true,
    showChat: false
  },
  settings: {
    title: "Settings",
    description: "Application settings and preferences",
    layout: "settings",
    showSidebar: true,
    showTopBar: true,
    showChat: false
  },
  chat: {
    title: "AI Chat",
    description: "Chat with your AI investment assistant",
    layout: "chat",
    showSidebar: false,
    showTopBar: true,
    showChat: true
  },
  fullscreen: {
    title: "Fullscreen",
    description: "Fullscreen view without sidebars",
    layout: "custom",
    showSidebar: false,
    showTopBar: false,
    showChat: false
  }
}

export function getPageConfig(pageId: string): PageConfig {
  return PAGE_CONFIGS[pageId] || PAGE_CONFIGS.dashboard
}
