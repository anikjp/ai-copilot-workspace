"use client"

import { Avatar } from '@/design-system/atoms/avatar'
import { Badge } from '@/design-system/atoms/badge'
import { Button } from '@/design-system/atoms/button'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
    Building,
    Calendar,
    Globe,
    Mail,
    Plug,
    User,
    UserPlus,
    Users,
    X
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { user } = useUser()
  const { userMemberships, isLoaded: membershipsLoaded } = useOrganizationList()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState('general')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    slug: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  // Workspace settings
  const [workspaceSettings, setWorkspaceSettings] = useState({
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

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'workspace', label: 'Workspace', icon: Globe }
  ]

  // Initialize edit data when organization loads
  useEffect(() => {
    if (organization) {
      setEditData({
        name: organization.name || '',
        slug: organization.slug || '',
        description: (organization.publicMetadata?.description as string) || ''
      })
    }
  }, [organization])

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleSave = async () => {
    if (!organization) return
    
    setIsLoading(true)
    try {
      await organization.update({
        name: editData.name,
        slug: editData.slug
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update organization:', error)
      alert('Failed to update organization. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (organization) {
      setEditData({
        name: organization.name || '',
        slug: organization.slug || '',
        description: (organization.publicMetadata?.description as string) || ''
      })
    }
    setIsEditing(false)
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return
    
    try {
      console.log('Inviting member:', inviteEmail)
      setInviteEmail('')
      setShowInviteForm(false)
      alert(`Invitation sent to ${inviteEmail}!`)
    } catch (error) {
      console.error('Failed to send invitation:', error)
      alert('Failed to send invitation. Please try again.')
    }
  }

  const handleWorkspaceSave = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    alert('Workspace settings saved successfully!')
  }

  // Get current user's role in the organization
  const currentUserMembership = userMemberships?.data?.find(
    membership => membership.organization.id === organization?.id
  )

  if (!orgLoaded || !membershipsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Settings...</h2>
          <p className="text-gray-500">Fetching organization details</p>
        </div>
      </div>
    )
  }

  if (!organization) {
  return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Found</h2>
          <p className="text-gray-500 mb-4">You need to be part of an organization to access this page.</p>
          <Button onClick={() => window.location.href = '/organization'}>
            Go to Organization Setup
          </Button>
        </div>
      </div>
    )
  }

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar 
              src={user?.imageUrl} 
              alt={user?.fullName || user?.firstName || 'You'} 
              className="w-16 h-16"
            />
            <div>
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                Change Photo
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">First Name</Label>
              <Input
                id="firstName"
                value={user?.firstName || ''}
                placeholder="Enter your first name"
                className="h-10"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">Last Name</Label>
              <Input
                id="lastName"
                value={user?.lastName || ''}
                placeholder="Enter your last name"
                className="h-10"
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">Email Address</Label>
              <Input
                id="email"
                value={user?.emailAddresses[0]?.emailAddress || ''}
                placeholder="Enter your email"
                className="h-10"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email address.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Role */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Role</h3>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Current Role</div>
              <div className="text-sm text-gray-500">Your role in this organization</div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {currentUserMembership?.role?.replace('org:', '') || 'Member'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">Account ID</div>
              <div className="text-sm text-gray-500">Unique identifier for your account</div>
            </div>
            <div className="text-sm font-mono text-gray-700">{user?.id}</div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">Member Since</div>
              <div className="text-sm text-gray-500">When you joined this organization</div>
            </div>
            <div className="text-sm text-gray-700">
              {currentUserMembership?.createdAt ? 
                new Date(currentUserMembership.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="pt-6 border-t border-gray-200">
        <Button onClick={handleWorkspaceSave} disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white">
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  )

  const renderGeneralTab = () => (
    <div className="space-y-8">
      {/* Workspace Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Workspace name</Label>
            <p className="text-sm text-gray-500 mb-3">The name of your company or organization</p>
            {isEditing ? (
              <Input
                id="name"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                placeholder="Enter organization name"
                className="h-10"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-900">{organization.name}</span>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="slug" className="text-sm font-medium text-gray-700 mb-2 block">Workspace URL</Label>
            {isEditing ? (
              <Input
                id="slug"
                value={editData.slug}
                onChange={(e) => setEditData({...editData, slug: e.target.value})}
                placeholder="organization-slug"
                className="h-10"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-mono text-sm text-gray-700">{organization.slug}</span>
              </div>
            )}
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
  )

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <Badge className="bg-gray-100 text-gray-700">{organization.membersCount || 0}</Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 h-9"
            />
            <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowInviteForm(false)} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
                </div>
      )}
                  
      {/* Members List */}
                  <div className="space-y-2">
        {/* Current User */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar 
              src={user?.imageUrl} 
              alt={user?.fullName || user?.firstName || 'You'} 
              className="w-8 h-8"
            />
            <div>
              <div className="font-medium text-gray-900 text-sm">
                {user?.fullName || user?.firstName || 'You'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.emailAddresses[0]?.emailAddress}
              </div>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
            {currentUserMembership?.role?.replace('org:', '') || 'Member'}
          </Badge>
        </div>

        {/* Placeholder for other members */}
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium text-gray-600 mb-1">No other members yet</p>
          <p className="text-xs text-gray-400">Invite colleagues to join your organization</p>
        </div>
      </div>
    </div>
  )

  const renderWorkspaceTab = () => (
    <div className="space-y-8">
      {/* Company Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">Company Name</Label>
            <Input
              id="companyName"
              value={workspaceSettings.companyName}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, companyName: e.target.value})}
              placeholder="Enter your company name"
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 mb-2 block">Timezone</Label>
            <Input
              id="timezone"
              value={workspaceSettings.timezone}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, timezone: e.target.value})}
              placeholder="Select timezone"
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="language" className="text-sm font-medium text-gray-700 mb-2 block">Language</Label>
            <Input
              id="language"
              value={workspaceSettings.language}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, language: e.target.value})}
              placeholder="Select language"
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="dateFormat" className="text-sm font-medium text-gray-700 mb-2 block">Date Format</Label>
            <Input
              id="dateFormat"
              value={workspaceSettings.dateFormat}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, dateFormat: e.target.value})}
              placeholder="Select date format"
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700 mb-2 block">Currency</Label>
            <Input
              id="currency"
              value={workspaceSettings.currency}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, currency: e.target.value})}
              placeholder="Select currency"
              className="h-10"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <Button onClick={handleWorkspaceSave} disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white">
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="theme" className="text-sm font-medium text-gray-700 mb-2 block">Theme</Label>
            <select
              id="theme"
              value={workspaceSettings.theme}
              onChange={(e) => setWorkspaceSettings({...workspaceSettings, theme: e.target.value})}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <Button onClick={handleWorkspaceSave} disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white">
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-sm font-medium text-gray-900">Email Notifications</Label>
              <p className="text-xs text-gray-600 mt-1">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={workspaceSettings.notifications.email}
              onChange={(e) => setWorkspaceSettings({
                ...workspaceSettings, 
                notifications: {...workspaceSettings.notifications, email: e.target.checked}
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-sm font-medium text-gray-900">Push Notifications</Label>
              <p className="text-xs text-gray-600 mt-1">Receive push notifications in browser</p>
            </div>
            <input
              type="checkbox"
              checked={workspaceSettings.notifications.push}
              onChange={(e) => setWorkspaceSettings({
                ...workspaceSettings, 
                notifications: {...workspaceSettings.notifications, push: e.target.checked}
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-sm font-medium text-gray-900">Desktop Notifications</Label>
              <p className="text-xs text-gray-600 mt-1">Show desktop notifications</p>
            </div>
            <input
              type="checkbox"
              checked={workspaceSettings.notifications.desktop}
              onChange={(e) => setWorkspaceSettings({
                ...workspaceSettings, 
                notifications: {...workspaceSettings.notifications, desktop: e.target.checked}
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <Button onClick={handleWorkspaceSave} disabled={isLoading} className="bg-gray-900 hover:bg-gray-800 text-white">
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  )

  const renderIntegrationsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Integrations</h3>
        <p className="text-sm text-gray-600 mb-6">Connect your workspace with external services and APIs.</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plug className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">REST API</div>
                <div className="text-sm text-gray-500">Connect with external services</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Plug className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Webhooks</div>
                <div className="text-sm text-gray-500">Real-time notifications</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMeetingsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Settings</h3>
        <p className="text-sm text-gray-600 mb-6">Configure meeting preferences and integrations.</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Calendar Integration</div>
                <div className="text-sm text-gray-500">Sync with Google Calendar, Outlook</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Video Conferencing</div>
                <div className="text-sm text-gray-500">Zoom, Teams, Google Meet</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
                          </div>
                          </div>
                        </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <p className="text-sm text-gray-600 mb-6">Manage security preferences and access controls.</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-500">Enhanced security for your account</div>
                  </div>
                </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Session Management</div>
                <div className="text-sm text-gray-500">Manage active sessions</div>
              </div>
            </div>
            <Button variant="outline" size="sm">View Sessions</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab()
      case 'profile':
        return renderProfileTab()
      case 'members':
        return renderMembersTab()
      case 'integrations':
        return renderIntegrationsTab()
      case 'workspace':
        return renderWorkspaceTab()
      default:
        return renderGeneralTab()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your workspace</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 py-2 px-1 text-sm font-medium whitespace-nowrap flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}