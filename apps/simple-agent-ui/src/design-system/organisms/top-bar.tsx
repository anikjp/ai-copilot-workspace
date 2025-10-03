"use client"

import { UI_TEXT } from '@/config/constants'
import { cn } from '@/lib/utils'
import { ChevronDown, HelpCircle, Users } from 'lucide-react'
import { Button } from '@/design-system/atoms/button'

interface TopBarProps {
  className?: string
}

export function TopBar({ className }: TopBarProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4", className)}>
      {/* Left Side - Filter */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" className="p-2 h-auto">
          <span className="text-sm font-medium text-slate-900">
            {UI_TEXT.navigation.topBar.filter}
          </span>
          <ChevronDown className="w-4 h-4 ml-1 text-slate-500" />
        </Button>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" className="p-2 h-auto">
          <Users className="w-4 h-4 mr-2" />
          <span className="text-sm">{UI_TEXT.navigation.topBar.invite}</span>
        </Button>
        <Button variant="ghost" className="p-2 h-auto">
          <HelpCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{UI_TEXT.navigation.topBar.help}</span>
        </Button>
      </div>
    </div>
  )
}
