// Configuration management system for dynamic UI updates

import { PageConfig } from '@/types/design-system'
import { LAYOUT_CONFIG, NAVIGATION_CONFIG, THEME_CONFIG, UI_TEXT } from './constants'

export class ConfigManager {
  private static instance: ConfigManager
  private config: {
    uiText: typeof UI_TEXT
    navigation: typeof NAVIGATION_CONFIG
    layout: typeof LAYOUT_CONFIG
    theme: typeof THEME_CONFIG
    pages: Record<string, PageConfig>
  }

  private constructor() {
    this.config = {
      uiText: UI_TEXT,
      navigation: NAVIGATION_CONFIG,
      layout: LAYOUT_CONFIG,
      theme: THEME_CONFIG,
      pages: {}
    }
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // Get configuration values
  public getUIText(path: string): any {
    return this.getNestedValue(this.config.uiText, path)
  }

  public getNavigationConfig() {
    return this.config.navigation
  }

  public getLayoutConfig() {
    return this.config.layout
  }

  public getThemeConfig() {
    return this.config.theme
  }

  public getPageConfig(pageId: string): PageConfig | undefined {
    return this.config.pages[pageId]
  }

  // Update configuration values
  public updateUIText(path: string, value: any): void {
    this.setNestedValue(this.config.uiText, path, value)
  }

  public updateNavigationConfig(updates: Partial<typeof NAVIGATION_CONFIG>): void {
    this.config.navigation = { ...this.config.navigation, ...updates }
  }

  public updateLayoutConfig(updates: Partial<typeof LAYOUT_CONFIG>): void {
    this.config.layout = { ...this.config.layout, ...updates }
  }

  public updateThemeConfig(updates: Partial<typeof THEME_CONFIG>): void {
    this.config.theme = { ...this.config.theme, ...updates }
  }

  public setPageConfig(pageId: string, config: PageConfig): void {
    this.config.pages[pageId] = config
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  // Export current configuration
  public exportConfig() {
    return JSON.stringify(this.config, null, 2)
  }

  // Import configuration
  public importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson)
      this.config = { ...this.config, ...importedConfig }
      return true
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return false
    }
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance()
