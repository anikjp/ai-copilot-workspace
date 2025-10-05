"use client"

import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/design-system/atoms/button'
import { cn } from '@/lib/utils'
import { useClerk, UserProfile, useUser } from '@clerk/nextjs'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Plug,
  Settings,
  Sun,
  User,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface SettingsDropdownProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export default function SettingsDropdown({ isOpen, onClose, className }: SettingsDropdownProps) {
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleProfileSettings = () => {
    setShowUserProfile(true)
    onClose() // Close the dropdown when opening profile
  }

  const handleThemeSettings = () => {
    setShowThemeSubmenu(!showThemeSubmenu)
  }

  // Show only Clerk UserProfile component
  if (showUserProfile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setShowUserProfile(false)}
              className="h-8 w-8 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="overflow-hidden">
            <UserProfile />
          </div>
        </div>
      </div>
    )
  }

  // Only show dropdown if it's open and not showing other modals
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
      <div
        className={cn(
          "absolute bottom-16 left-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center space-x-2">
              {user?.imageUrl && (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || user.emailAddresses[0]?.emailAddress || 'User'} 
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.fullName || user?.firstName || 'User'}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.emailAddresses[0]?.emailAddress || 'No email'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mb-3">
          <div className="space-y-0.5">
            <Link href="/settings?tab=general" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="text-sm">General</span>
              </Button>
            </Link>
            <Link href="/settings?tab=profile" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">Profile</span>
              </Button>
            </Link>
            <Link href="/settings?tab=members" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm">Members</span>
              </Button>
            </Link>
            <Link href="/settings?tab=integrations" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Plug className="w-4 h-4 mr-2" />
                <span className="text-sm">Integrations</span>
              </Button>
            </Link>
            <Link href="/settings?tab=workspace" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-sm">Workspace</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Interface Section */}
        <div className="mb-3">
          <div className="space-y-0.5">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={handleThemeSettings}
                className="w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Palette className="w-4 h-4 mr-2" />
                <span className="text-sm">Interface theme</span>
                {showThemeSubmenu ? (
                  <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                )}
              </Button>
              
              {/* Theme Submenu */}
              {showThemeSubmenu && (
                <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                  <div className="space-y-1">
                    {[
                      {
                        key: 'light' as const,
                        label: 'Light',
                        icon: Sun,
                        description: 'Light theme'
                      },
                      {
                        key: 'dark' as const,
                        label: 'Dark',
                        icon: Moon,
                        description: 'Dark theme'
                      },
                      {
                        key: 'system' as const,
                        label: 'System',
                        icon: Monitor,
                        description: 'Use system preference'
                      }
                    ].map((themeOption) => {
                      const Icon = themeOption.icon
                      const isSelected = theme === themeOption.key
                      
                      return (
                        <Button
                          key={themeOption.key}
                          variant="ghost"
                          onClick={() => {
                            setTheme(themeOption.key)
                            setShowThemeSubmenu(false)
                          }}
                          className={cn(
                            "w-full justify-start p-2 h-auto text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200",
                            isSelected && "bg-gray-100 dark:bg-gray-700"
                          )}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="text-sm flex-1 text-left">{themeOption.label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </Button>
                      )
                    })}
                  </div>
                  
                  {theme === 'system' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        Currently: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session Management Section */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start p-2 h-auto text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm rounded-md transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
