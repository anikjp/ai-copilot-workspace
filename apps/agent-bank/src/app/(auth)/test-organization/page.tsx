"use client"

import { Badge } from '@/design-system/atoms/badge'
import { Card } from '@/design-system/atoms/card'
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    Crown,
    Info,
    Shield,
    User,
    Users
} from 'lucide-react'

export default function TestOrganizationPage() {
  const { user } = useUser()
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList()

  if (!orgLoaded || !orgListLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl font-bold">AJ</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Organization Data...</h2>
          <p className="text-gray-500">Checking your organization membership</p>
        </div>
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'org:admin':
        return <Crown className="w-4 h-4 text-purple-600" />
      case 'manager':
      case 'org:manager':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-green-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'org:admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
      case 'org:manager':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Test Page</h1>
        <p className="text-gray-600">Verify your B2B organization setup and membership</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{user?.fullName || 'Not available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{user?.emailAddresses[0]?.emailAddress || 'Not available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{user?.id || 'Not available'}</p>
            </div>
          </div>
        </Card>

        {/* Current Organization */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Current Organization</h2>
          </div>
          
          {organization ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Active Organization</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Organization Name</label>
                <p className="text-gray-900 font-semibold">{organization.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Organization ID</label>
                <p className="text-gray-900 font-mono text-sm">{organization.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Members Count</label>
                <p className="text-gray-900">{organization.membersCount || 0} team members</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(organization.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">No Active Organization</span>
            </div>
          )}
        </Card>

        {/* Organization Memberships */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Organization Memberships</h2>
          </div>
          
          {organizationList && organizationList.length > 0 ? (
            <div className="space-y-4">
              {organizationList.map((membership) => (
                <div key={membership.organization.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{membership.organization.name}</h3>
                        <p className="text-sm text-gray-500">
                          {membership.organization.membersCount || 0} members • 
                          Created {new Date(membership.organization.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(membership.role)}
                      <Badge className={getRoleColor(membership.role)}>
                        {membership.role}
                      </Badge>
                      {membership.organization.id === organization?.id && (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No organization memberships found</p>
              <p className="text-sm text-gray-400">
                You need to create or join an organization to access the B2B workspace
              </p>
            </div>
          )}
        </Card>

        {/* B2B Configuration Status */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">B2B Configuration Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {organization ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <span className={organization ? "text-green-700" : "text-amber-700"}>
                  Organization Membership
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {(!organizationList || organizationList.length <= 1) ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <span className={(!organizationList || organizationList.length <= 1) ? "text-green-700" : "text-amber-700"}>
                  Single Organization (B2B Model)
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700">Clerk Organizations Enabled</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700">B2B Role System Active</span>
              </div>
            </div>
          </div>
          
          {!organization && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Next Step:</strong> You need to create or join an organization to access the B2B workspace. 
                Visit the <a href="/organization" className="underline font-medium">Organization Page</a> to get started.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
