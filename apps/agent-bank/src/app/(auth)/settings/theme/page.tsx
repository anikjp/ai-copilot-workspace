"use client"

import { useTheme } from '@/contexts/theme-context'
import { Card } from '@/design-system/atoms/card'
import { Button } from '@/design-system/atoms/button'
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themeOptions = [
    {
      key: 'light' as const,
      name: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
      preview: 'bg-white border-gray-200',
      textColor: 'text-gray-900'
    },
    {
      key: 'dark' as const,
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
      textColor: 'text-white'
    },
    {
      key: 'system' as const,
      name: 'System',
      description: 'Match your device preference',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
      textColor: 'text-gray-900'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Theme Settings</h2>
            <p className="text-gray-600">Customize the appearance of your workspace</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = theme === option.key
              
              return (
                <div
                  key={option.key}
                  className={cn(
                    "relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                    isSelected 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                  onClick={() => setTheme(option.key)}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Theme Preview */}
                    <div className={cn(
                      "h-20 rounded-lg border flex items-center justify-center",
                      option.preview
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        option.key === 'light' && "bg-gray-200",
                        option.key === 'dark' && "bg-gray-700",
                        option.key === 'system' && "bg-gray-400"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          option.key === 'light' && "text-gray-600",
                          option.key === 'dark' && "text-gray-300",
                          option.key === 'system' && "text-white"
                        )} />
                      </div>
                    </div>
                    
                    {/* Theme Info */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{option.name}</h4>
                      </div>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Current Theme Info */}
        {theme === 'system' && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">System Theme Active</h3>
                <p className="text-sm text-blue-700">
                  Currently using: <span className="font-medium">{resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This will automatically change based on your device's system preference
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Theme Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center space-x-2 mb-3">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-gray-900">Light Theme</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-blue-500 rounded"></div>
                <div className="h-2 bg-gray-300 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-green-400 rounded w-3/4"></div>
              </div>
            </div>

            {/* Dark Preview */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900">
              <div className="flex items-center space-x-2 mb-3">
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">Dark Theme</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-blue-600 rounded"></div>
                <div className="h-2 bg-gray-600 rounded"></div>
                <div className="h-2 bg-gray-700 rounded"></div>
                <div className="h-2 bg-green-500 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Theme Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">High Contrast Mode</div>
                <div className="text-sm text-gray-500">Increase contrast for better visibility</div>
              </div>
              <Button variant="outline" size="sm">
                Disabled
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Reduced Motion</div>
                <div className="text-sm text-gray-500">Minimize animations and transitions</div>
              </div>
              <Button variant="outline" size="sm">
                Disabled
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Font Size</div>
                <div className="text-sm text-gray-500">Adjust text size for better readability</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">Small</Button>
                <Button size="sm">Medium</Button>
                <Button variant="outline" size="sm">Large</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
