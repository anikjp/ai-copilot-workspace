"use client"

import { useState } from 'react'
import { Card } from '@/design-system/atoms/card'
import { Button } from '@/design-system/atoms/button'
import { Badge } from '@/design-system/atoms/badge'
import { Plug, ExternalLink, Trash2, Check, X, AlertTriangle } from 'lucide-react'

export default function ThirdPartyAppsPage() {
  const [apps] = useState([
    {
      id: 1,
      name: "Slack Bot",
      description: "AI assistant for Slack workspace",
      status: "Active",
      permissions: ["Read messages", "Send messages", "Manage channels"],
      lastActivity: "2 minutes ago",
      connectedBy: "AJ User",
      connectedAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Discord Integration",
      description: "Portfolio updates in Discord server",
      status: "Active",
      permissions: ["Send messages", "Embed links"],
      lastActivity: "1 hour ago",
      connectedBy: "AJ User",
      connectedAt: "2024-01-10"
    },
    {
      id: 3,
      name: "Zapier Automation",
      description: "Automated workflow triggers",
      status: "Inactive",
      permissions: ["Read portfolio data", "Create tasks"],
      lastActivity: "3 days ago",
      connectedBy: "AJ User",
      connectedAt: "2024-01-05"
    }
  ])

  const [availableApps] = useState([
    {
      name: "Microsoft Teams",
      description: "Integrate with your Teams workspace",
      icon: "👥",
      category: "Communication",
      status: "Available"
    },
    {
      name: "Telegram Bot",
      description: "Get portfolio updates via Telegram",
      icon: "📱",
      category: "Messaging",
      status: "Available"
    },
    {
      name: "WhatsApp Business",
      description: "Send alerts via WhatsApp",
      icon: "💬",
      category: "Messaging",
      status: "Coming Soon"
    },
    {
      name: "Notion Integration",
      description: "Sync data with Notion pages",
      icon: "📝",
      category: "Productivity",
      status: "Available"
    },
    {
      name: "Airtable Sync",
      description: "Keep your data in sync",
      icon: "🗃️",
      category: "Data",
      status: "Available"
    },
    {
      name: "Google Calendar",
      description: "Schedule AI agent tasks",
      icon: "📅",
      category: "Productivity",
      status: "Available"
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Inactive": return "bg-red-100 text-red-800"
      case "Available": return "bg-blue-100 text-blue-800"
      case "Coming Soon": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleConnect = async (app: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleDisconnect = async (app: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleRevokePermissions = async (app: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plug className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Third-party Apps</h2>
              <p className="text-gray-600">Manage connected applications and their permissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Connected Apps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Applications</h3>
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Plug className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{app.name}</h4>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{app.description}</p>
                      
                      {/* Permissions */}
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {app.permissions.map((permission, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* App Info */}
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Last activity: {app.lastActivity}</div>
                        <div>Connected by: {app.connectedBy}</div>
                        <div>Connected at: {app.connectedAt}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View App
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokePermissions(app)}
                      disabled={isLoading}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Permissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(app)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Available Apps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Applications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableApps.map((app, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="text-2xl">{app.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{app.name}</h4>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{app.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => handleConnect(app)}
                    disabled={isLoading || app.status === "Coming Soon"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {app.status === "Coming Soon" ? "Coming Soon" : "Connect"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* App Development */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Develop Your Own Integration</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              Want to build a custom integration? Use our API to connect your application with AJ Copilot.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">API Documentation</h4>
                <p className="text-sm text-gray-500 mb-3">Complete guide to our REST API and webhooks</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Developer Portal</h4>
                <p className="text-sm text-gray-500 mb-3">Create and manage your app credentials</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Developer Portal
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Security Notice</h4>
              <p className="text-sm text-yellow-800">
                Only connect applications from trusted sources. Review permissions carefully before authorizing access to your data. 
                You can revoke access at any time from this page.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
