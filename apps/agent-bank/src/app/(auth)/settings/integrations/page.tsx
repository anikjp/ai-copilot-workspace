"use client"

import { useState } from 'react'
import { Card } from '@/design-system/atoms/card'
import { Button } from '@/design-system/atoms/button'
import { Badge } from '@/design-system/atoms/badge'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { Plug, Key, Globe, Plus, Trash2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function IntegrationsSettingsPage() {
  const [integrations] = useState([
    {
      id: 1,
      name: "OpenAI API",
      description: "AI model provider for chat and analysis",
      status: "Connected",
      type: "API",
      lastUsed: "2 minutes ago"
    },
    {
      id: 2,
      name: "Alpaca Markets",
      description: "Stock market data and trading API",
      status: "Connected",
      type: "Trading",
      lastUsed: "1 hour ago"
    },
    {
      id: 3,
      name: "Google Drive",
      description: "Document storage and collaboration",
      status: "Disconnected",
      type: "Storage",
      lastUsed: "Never"
    }
  ])

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    alpaca: "",
    google: ""
  })

  const [showKeys, setShowKeys] = useState({
    openai: false,
    alpaca: false,
    google: false
  })

  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected": return "bg-green-100 text-green-800"
      case "Disconnected": return "bg-red-100 text-red-800"
      case "Pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "API": return <Globe className="w-4 h-4" />
      case "Trading": return <Key className="w-4 h-4" />
      case "Storage": return <Plug className="w-4 h-4" />
      default: return <Plug className="w-4 h-4" />
    }
  }

  const handleSaveApiKey = async (provider: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Handle success/error
  }

  const handleConnect = async (integration: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Handle success/error
  }

  const handleDisconnect = async (integration: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Handle success/error
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
              <h2 className="text-2xl font-bold text-gray-900">API Integration</h2>
              <p className="text-gray-600">Manage your API keys and third-party integrations</p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
          <div className="space-y-4">
            {[
              { key: 'openai', name: 'OpenAI API Key', description: 'Required for AI chat and analysis features' },
              { key: 'alpaca', name: 'Alpaca Markets API Key', description: 'Required for stock data and trading features' },
              { key: 'google', name: 'Google API Key', description: 'Required for Google Drive integration' }
            ].map((apiKey) => (
              <div key={apiKey.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Key className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{apiKey.description}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          type={showKeys[apiKey.key as keyof typeof showKeys] ? "text" : "password"}
                          placeholder="Enter your API key"
                          value={apiKeys[apiKey.key as keyof typeof apiKeys]}
                          onChange={(e) => setApiKeys({...apiKeys, [apiKey.key]: e.target.value})}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowKeys({...showKeys, [apiKey.key]: !showKeys[apiKey.key as keyof typeof showKeys]})}
                      >
                        {showKeys[apiKey.key as keyof typeof showKeys] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveApiKey(apiKey.key)}
                        disabled={isLoading || !apiKeys[apiKey.key as keyof typeof apiKeys]}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Connected Integrations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Integrations</h3>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(integration.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{integration.name}</h4>
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{integration.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Type: {integration.type}</span>
                        <span>Last used: {integration.lastUsed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {integration.status === "Connected" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration)}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration)}
                        disabled={isLoading}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Available Integrations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Slack", description: "Team communication", icon: "💬", status: "Available" },
              { name: "Discord", description: "Community chat", icon: "🎮", status: "Available" },
              { name: "Telegram", description: "Messaging platform", icon: "📱", status: "Coming Soon" },
              { name: "Microsoft Teams", description: "Business communication", icon: "👥", status: "Available" },
              { name: "Zapier", description: "Workflow automation", icon: "⚡", status: "Available" },
              { name: "Webhook", description: "Custom integrations", icon: "🔗", status: "Available" }
            ].map((integration, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{integration.name}</h4>
                      <Badge className={integration.status === "Available" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {integration.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Webhook Configuration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://your-webhook-endpoint.com/webhook"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="Enter webhook secret for verification"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button>Save Webhook</Button>
              <Button variant="outline">Test Webhook</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
