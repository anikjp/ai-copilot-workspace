"use client"

import { Button } from '@/design-system/atoms/button'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  Keyboard,
  LogOut,
  Palette,
  Settings,
  Shield,
  User,
  Users
} from 'lucide-react'
import { useState } from 'react'

interface SettingsDropdownProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export default function SettingsDropdown({ isOpen, onClose, className }: SettingsDropdownProps) {
  const [selectedTheme, setSelectedTheme] = useState('light')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
      <div
        className={cn(
          "absolute bottom-16 left-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
          <div>
            <div className="text-sm font-medium text-gray-900">anik_barua@amway.com</div>
            <div className="text-xs text-gray-500">Member</div>
          </div>
        </div>

        {/* Plan and Workspace Section */}
        <div className="mb-3">
          <div className="space-y-0.5">
            {/* <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Zap className="w-4 h-4 mr-2" />
              <span className="text-sm">Upgrade plan</span>
            </Button> */}
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="text-sm">Workspace settings</span>
              <div className="ml-auto flex space-x-1">
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded text-gray-600">⌘</kbd>
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded text-gray-600">⇧</kbd>
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded text-gray-600">M</kbd>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">Members</span>
            </Button>
          </div>
        </div>

        {/* Personal Settings Section */}
        <div className="mb-3">
          <div className="space-y-0.5">
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm">Profile settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="text-sm">Notification settings</span>
            </Button>
          </div>
        </div>

        {/* Interface and Shortcuts Section */}
        <div className="mb-3">
          <div className="space-y-0.5">
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              <span className="text-sm">Keyboard shortcuts</span>
              <div className="ml-auto flex space-x-1">
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded text-gray-600">⌘</kbd>
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded text-gray-600">.</kbd>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto text-gray-700 hover:bg-gray-100 hover:shadow-sm rounded-md transition-all duration-200"
            >
              <Palette className="w-4 h-4 mr-2" />
              <span className="text-sm">Interface theme</span>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Session Management Section */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 h-auto text-red-600 hover:bg-red-50 hover:shadow-sm rounded-md transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
