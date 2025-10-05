"use client"

import { Badge } from '@/design-system/atoms/badge'
import { Button } from '@/design-system/atoms/button'
import { Card } from '@/design-system/atoms/card'
import {
    CreateOrganization,
    OrganizationProfile,
    useOrganization,
    useOrganizationList
} from '@clerk/nextjs'
import {
    ArrowRight,
    Building2,
    CheckCircle,
    Crown,
    Plus,
    Settings,
    Shield,
    User
} from 'lucide-react'
import { useState } from 'react'

interface B2BOrganizationManagerProps {
  onOrganizationSelect?: (organizationId: string) => void
  showCreateOption?: boolean
}

export function B2BOrganizationManager({ 
  onOrganizationSelect, 
  showCreateOption = true 
}: B2BOrganizationManagerProps) {
  const { organization } = useOrganization()
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Show loading state
  if (!orgListLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white text-xl font-bold">AJ</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-500">Checking organization membership</p>
        </Card>
      </div>
    )
  }

  // B2B Model: Users should only have one organization
  const hasOrganization = organizationList && organizationList.length > 0
  const canCreateOrganization = !hasOrganization && showCreateOption

  if (!organization && !showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Company Workspace Required
          </h3>
          <p className="text-gray-600 mb-6">
            To access this B2B workspace, you need to be part of a company organization.
            Each company has one workspace with multiple team members.
          </p>
          
          {organizationList && organizationList.length > 0 ? (
            <div className="space-y-3 mb-6">
              {organizationList.map((org) => (
                <div key={org.organization.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{org.organization.name}</h4>
                        <p className="text-sm text-gray-500">
                          {org.organization.membersCount || 0} team members • Your role: {org.role}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => onOrganizationSelect?.(org.organization.id)}
                      className="ml-4"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Enter Workspace
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {canCreateOrganization ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Create Your Company Workspace</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Set up a workspace for your company. You'll become the admin and can invite team members.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Company Workspace
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Already have a company workspace? Ask your admin to invite you.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                You're already part of a company workspace. Contact your admin if you need access to a different company.
              </p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Company Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                Set up your company's dedicated workspace
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">B2B Workspace Model</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• One workspace per company</li>
              <li>• You'll become the workspace admin</li>
              <li>• Invite team members with different roles</li>
              <li>• All data is isolated to your company</li>
            </ul>
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
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {organization?.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{organization?.membersCount || 0} team members</span>
                <Badge variant="outline" className="text-xs">
                  Company Workspace
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowProfile(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Team
            </Button>
          </div>
        </div>

        {/* B2B Role Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Company Roles</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Admin</div>
                <div className="text-xs text-gray-500">Full workspace control</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Manager</div>
                <div className="text-xs text-gray-500">Team & project management</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Member</div>
                <div className="text-xs text-gray-500">Standard workspace access</div>
              </div>
            </div>
          </div>
        </div>

        {showProfile && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
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

export function B2BOrganizationStatus() {
  const { organization } = useOrganization()

  if (!organization) {
    return (
      <div className="flex items-center space-x-2 text-amber-600">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-sm">No company workspace</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm">{organization.name}</span>
      <Badge variant="outline" className="text-xs">
        Company
      </Badge>
    </div>
  )
}
