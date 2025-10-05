"use client"

import { Button } from '@/design-system/atoms/button'
import { Card } from '@/design-system/atoms/card'
import {
    CreateOrganization,
    OrganizationProfile,
    OrganizationSwitcher,
    useOrganization,
    useOrganizationList
} from '@clerk/nextjs'
import {
    Building2,
    CheckCircle,
    Plus,
    Settings
} from 'lucide-react'
import { useState } from 'react'

interface OrganizationManagerProps {
  onOrganizationSelect?: (organizationId: string) => void
  showCreateOption?: boolean
}

export function OrganizationManager({ 
  onOrganizationSelect, 
  showCreateOption = true 
}: OrganizationManagerProps) {
  const { organization } = useOrganization()
  const { organizationList } = useOrganizationList()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  if (!organization && !showCreateForm) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Organization Selected
          </h3>
          <p className="text-gray-500 mb-4">
            You need to be part of an organization to access this workspace.
          </p>
          
          {organizationList.length > 0 ? (
            <div className="space-y-2 mb-4">
              {organizationList.map((org) => (
                <Button
                  key={org.organization.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onOrganizationSelect?.(org.organization.id)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {org.organization.name}
                  <span className="ml-auto text-xs text-gray-500">
                    {org.role}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}

          {showCreateOption && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          )}
        </Card>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create Organization</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
          <CreateOrganization 
            afterCreateOrganizationUrl="/stock-agent"
            afterSelectOrganizationUrl="/stock-agent"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {organization?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {organization?.membersCount || 0} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowProfile(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
            
            <OrganizationSwitcher 
              afterSelectOrganizationUrl="/stock-agent"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                }
              }}
            />
          </div>
        </div>

        {showProfile && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Organization Settings</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProfile(false)}
              >
                Close
              </Button>
            </div>
            <OrganizationProfile />
          </div>
        )}
      </Card>
    </div>
  )
}

export function OrganizationSelector() {
  const { organizationList } = useOrganizationList()

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Switch Organization</h3>
      {organizationList.map((org) => (
        <Button
          key={org.organization.id}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => org.organization.createInvitationUrl()}
        >
          <Building2 className="w-4 h-4 mr-2" />
          {org.organization.name}
          <span className="ml-auto text-xs text-gray-500">
            {org.role}
          </span>
        </Button>
      ))}
    </div>
  )
}

export function OrganizationStatus() {
  const { organization } = useOrganization()

  if (!organization) {
    return (
      <div className="flex items-center space-x-2 text-amber-600">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-sm">No organization selected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm">{organization.name}</span>
    </div>
  )
}
