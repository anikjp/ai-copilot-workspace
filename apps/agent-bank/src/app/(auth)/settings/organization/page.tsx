"use client"

import { Button } from '@/design-system/atoms/button'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
    Building,
    Calendar,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OrganizationSettingsPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { user } = useUser()
  const { userMemberships, isLoaded: membershipsLoaded } = useOrganizationList()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    slug: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

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
      // This would typically call your backend API to send invitations
      console.log('Inviting member:', inviteEmail)
      setInviteEmail('')
      setShowInviteForm(false)
      alert(`Invitation sent to ${inviteEmail}!`)
    } catch (error) {
      console.error('Failed to send invitation:', error)
      alert('Failed to send invitation. Please try again.')
    }
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Organization...</h2>
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
        </div>
      </div>
    </div>
  )
}
