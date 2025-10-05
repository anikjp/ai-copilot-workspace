// Type definitions for the modular design system

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface NavigationItem {
  id: string
  label: string
  icon: string
  path: string
  active: boolean
  badge?: string | number
  children?: NavigationItem[]
}

export interface LayoutConfig {
  sidebar: {
    width: string
    mobileWidth: string
    collapsedWidth: string
  }
  topBar: {
    height: string
  }
  chat: {
    width: string
    mobileWidth: string
  }
  breakpoints: {
    mobile: string
    tablet: string
    desktop: string
    wide: string
  }
}

export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export interface PageConfig {
  title: string
  description?: string
  layout: 'dashboard' | 'portfolio' | 'analytics' | 'settings' | 'chat' | 'custom'
  showSidebar: boolean
  showTopBar: boolean
  showChat: boolean
  customLayout?: React.ComponentType<any>
}

export interface ComponentVariant {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  state?: 'default' | 'loading' | 'disabled' | 'error' | 'success'
}

export interface ResponsiveConfig {
  mobile?: any
  tablet?: any
  desktop?: any
  wide?: any
}
