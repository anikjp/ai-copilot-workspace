"use client"

import { Button } from '@/design-system/atoms/button'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import {
    Calendar,
    Users
} from 'lucide-react'
import { useState } from 'react'

export default function WorkspaceSettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "Your Company",
    timezone: "UTC-8 (Pacific Time)",
    language: "English",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    theme: "system",
    notifications: {
      email: true,
      push: true,
      desktop: false
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    alert('Workspace settings saved successfully!')
  }

  const handleReset = () => {
    setSettings({
      companyName: "Your Company",
      timezone: "UTC-8 (Pacific Time)",
      language: "English",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
      theme: "system",
      notifications: {
        email: true,
        push: true,
        desktop: false
      }
    })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your workspace</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button className="border-b-2 border-gray-900 py-2 px-1 text-sm font-medium text-gray-900">
                General
              </button>
              <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Members
              </button>
              <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Integrations
              </button>
              <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Meetings
              </button>
            </nav>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            
            {/* Workspace Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">Workspace name</Label>
                  <p className="text-sm text-gray-500 mb-3">The name of your company or organization</p>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    placeholder="Enter your company name"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Start screen agents Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start screen agents</h3>
              <p className="text-sm text-gray-600 mb-4">Add agents that all users of this workspace should have available to them on the start screen.</p>
              
              <div className="mb-4">
                <Input
                  placeholder="Search agents"
                  className="h-10 pl-10"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">All</div>
                      <div className="text-sm text-gray-500">Personalized page for each user</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Start page</div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Sales agent</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">Only agents made available to all users can be selected.</p>
            </div>

            {/* "All" persona Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">"All" persona</h3>
              <p className="text-sm text-gray-600 mb-4">Set the name and instructions for the general agent for all users in this workspace.</p>
            </div>

            {/* Save Changes Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button onClick={handleSave} disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white">
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}