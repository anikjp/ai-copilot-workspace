"use client"

import { useState } from 'react'
import { Card } from '@/design-system/atoms/card'
import { Button } from '@/design-system/atoms/button'
import { Badge } from '@/design-system/atoms/badge'
import { Bell, Mail, Smartphone, Volume2, VolumeX } from 'lucide-react'

export default function NotificationSettingsPage() {
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      agentUpdates: true,
      portfolioAlerts: true,
      systemUpdates: false,
      marketing: false
    },
    push: {
      enabled: true,
      agentUpdates: true,
      portfolioAlerts: true,
      systemUpdates: false
    },
    inApp: {
      enabled: true,
      agentUpdates: true,
      portfolioAlerts: true,
      systemUpdates: true,
      chatMessages: true
    }
  })

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: "22:00",
    end: "08:00"
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const toggleCategory = (category: string, key: string) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: !prev[category as keyof typeof prev][key as keyof typeof prev[category as keyof typeof prev]]
      }
    }))
  }

  const toggleCategoryEnabled = (category: string) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        enabled: !prev[category as keyof typeof prev].enabled
      }
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
            <p className="text-gray-600">Control how and when you receive notifications</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <Button 
              variant={notifications.email.enabled ? "default" : "outline"}
              onClick={() => toggleCategoryEnabled('email')}
            >
              {notifications.email.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          {notifications.email.enabled && (
            <div className="space-y-3">
              {[
                { key: 'agentUpdates', label: 'AI Agent Updates', description: 'Get notified when agents complete tasks' },
                { key: 'portfolioAlerts', label: 'Portfolio Alerts', description: 'Important portfolio changes and alerts' },
                { key: 'systemUpdates', label: 'System Updates', description: 'Product updates and maintenance notices' },
                { key: 'marketing', label: 'Marketing Emails', description: 'Tips, features, and promotional content' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <Button 
                    variant={notifications.email[item.key as keyof typeof notifications.email] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory('email', item.key)}
                  >
                    {notifications.email[item.key as keyof typeof notifications.email] ? "On" : "Off"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Push Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Mobile and desktop push notifications</p>
              </div>
            </div>
            <Button 
              variant={notifications.push.enabled ? "default" : "outline"}
              onClick={() => toggleCategoryEnabled('push')}
            >
              {notifications.push.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          {notifications.push.enabled && (
            <div className="space-y-3">
              {[
                { key: 'agentUpdates', label: 'AI Agent Updates', description: 'Real-time agent activity notifications' },
                { key: 'portfolioAlerts', label: 'Portfolio Alerts', description: 'Critical portfolio changes' },
                { key: 'systemUpdates', label: 'System Updates', description: 'Important system notifications' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <Button 
                    variant={notifications.push[item.key as keyof typeof notifications.push] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory('push', item.key)}
                  >
                    {notifications.push[item.key as keyof typeof notifications.push] ? "On" : "Off"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* In-App Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">In-App Notifications</h3>
                <p className="text-sm text-gray-500">Notifications within the application</p>
              </div>
            </div>
            <Button 
              variant={notifications.inApp.enabled ? "default" : "outline"}
              onClick={() => toggleCategoryEnabled('inApp')}
            >
              {notifications.inApp.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          {notifications.inApp.enabled && (
            <div className="space-y-3">
              {[
                { key: 'agentUpdates', label: 'AI Agent Updates', description: 'Agent completion and status updates' },
                { key: 'portfolioAlerts', label: 'Portfolio Alerts', description: 'Portfolio-related notifications' },
                { key: 'systemUpdates', label: 'System Updates', description: 'System and maintenance updates' },
                { key: 'chatMessages', label: 'Chat Messages', description: 'New messages in conversations' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <Button 
                    variant={notifications.inApp[item.key as keyof typeof notifications.inApp] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory('inApp', item.key)}
                  >
                    {notifications.inApp[item.key as keyof typeof notifications.inApp] ? "On" : "Off"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quiet Hours */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {quietHours.enabled ? (
                <VolumeX className="w-5 h-5 text-green-600" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
                <p className="text-sm text-gray-500">Pause notifications during specific hours</p>
              </div>
            </div>
            <Button 
              variant={quietHours.enabled ? "default" : "outline"}
              onClick={() => setQuietHours({...quietHours, enabled: !quietHours.enabled})}
            >
              {quietHours.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          {quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) => setQuietHours({...quietHours, start: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) => setQuietHours({...quietHours, end: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Notification Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
