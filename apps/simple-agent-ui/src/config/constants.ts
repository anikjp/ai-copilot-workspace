// Centralized Configuration Constants
// All text, labels, and configuration in one place

export const APP_CONFIG = {
  name: "AI Finance",
  description: "Investment Assistant",
  version: "1.0.0",
  author: "AI Finance Team"
} as const

export const NAVIGATION_CONFIG = {
  primaryActions: [
    { 
      id: "new-chat", 
      label: "New chat", 
      icon: "Plus", 
      path: "/chat/new",
      active: true,
      variant: "primary"
    },
    { 
      id: "tasks", 
      label: "⚡ Tasks", 
      icon: "Zap", 
      path: "/tasks",
      active: false 
    },
    { 
      id: "search", 
      label: "🔍 Search", 
      icon: "Search", 
      path: "/search",
      active: false 
    },
    { 
      id: "meetings", 
      label: "🗓️ Meetings", 
      icon: "Calendar", 
      path: "/meetings",
      active: false 
    },
    { 
      id: "more", 
      label: "...", 
      icon: "MoreHorizontal", 
      path: "/more",
      active: false 
    }
  ],
  folders: [
    {
      id: "demo-folder",
      label: "🗂️ Demo folder",
      path: "/folders/demo",
      itemCount: 0
    }
  ],
  recentActivity: {
    today: [
      {
        id: "capabilities-inquiry",
        label: "Capabilities Inquiry",
        path: "/chat/capabilities-inquiry",
        timestamp: "Today"
      }
    ],
    yesterday: [
      {
        id: "document-sample",
        label: "Document Sample", 
        path: "/chat/document-sample",
        timestamp: "Yesterday"
      }
    ]
  }
} as const

export const UI_TEXT = {
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    success: "Success!",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous"
  },
  navigation: {
    sidebar: {
      newWorkspace: "New workspace",
      folders: "Folders",
      viewAll: "... View all",
      today: "Today",
      yesterday: "Yesterday",
      settings: "Settings"
    },
    topBar: {
      filter: "All",
      invite: "👥 Invite",
      help: "Help"
    }
  },
  chat: {
    title: "AI Investment Assistant",
    subtitle: "Powered by advanced analytics",
    placeholder: "⚡ Analyze my spreadsheet and turn the findings into a memo",
    quickPrompts: [
      "Write a newsletter about 10 major AI news this week",
      "Turn a report into a meeting pre-read",
      "Analyze my spreadsheet and turn the findings into a memo"
    ],
    attachments: {
      doc: "✨ Doc x",
      folder: "🗂️ Demo folder x"
    },
    model: "GPT-4.1"
  },
  portfolio: {
    cashPanel: {
      title: "Total Cash",
      invested: "Invested Amount",
      portfolioValue: "Portfolio Value",
      editCash: "Edit Cash Amount"
    },
    performance: {
      title: "Performance",
      noData: "No performance data to show."
    },
    allocation: {
      title: "Allocation",
      noData: "No allocation data to show."
    },
    returns: {
      title: "Returns", 
      noData: "No returns data to show."
    },
    insights: {
      title: "Market Insights",
      bullCase: "BULL CASE",
      bearCase: "BEAR CASE",
      noBullInsights: "No bull case insights.",
      noBearInsights: "No bear case insights."
    }
  },
  emptyStates: {
    noData: "No data available",
    loading: "Loading data...",
    error: "Failed to load data",
    empty: "Nothing to show here"
  },
  subscription: {
    usage: "7 meetings and 14 messages left this month",
    upgradeText: "Upgrade for unlimited use",
    upgradeButton: "Upgrade"
  }
} as const

export const LAYOUT_CONFIG = {
  sidebar: {
    width: "w-64",
    mobileWidth: "w-64",
    collapsedWidth: "w-16"
  },
  topBar: {
    height: "h-16"
  },
  chat: {
    width: "w-96",
    mobileWidth: "w-full"
  },
  breakpoints: {
    mobile: "sm",
    tablet: "md", 
    desktop: "lg",
    wide: "xl"
  }
} as const

export const THEME_CONFIG = {
  colors: {
    primary: "blue",
    secondary: "purple", 
    accent: "green",
    neutral: "slate"
  },
  spacing: {
    xs: "1",
    sm: "2", 
    md: "4",
    lg: "6",
    xl: "8"
  },
  borderRadius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl"
  }
} as const
