"use client"

import { Button } from '@/design-system/atoms/button'
import { Card } from '@/design-system/atoms/card'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { CreateOrganizationRequest, organizationAPI } from '@/lib/organization-api'
import { useAuth, useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
  ArrowRight,
  Building2,
  Check,
  Mail,
  Plus,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function OrganizationPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const { userMemberships, setActive, isLoaded: orgListLoaded } = useOrganizationList()
  const { getToken } = useAuth()
  const router = useRouter()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [backendOrganizations, setBackendOrganizations] = useState<any[]>([])
  const [loadingBackendOrgs, setLoadingBackendOrgs] = useState(false)

  // If user is already in an organization, redirect to dashboard
  if (organization) {
    router.push('/stock-agent')
    return null
  }

  // Show loading state while organization list is loading
  if (!orgListLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl font-bold">AJ</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-500">Checking organization membership</p>
        </div>
      </div>
    )
  }

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return
    
    setIsCreating(true)
    try {
      // Use custom backend API instead of Clerk SDK
      const request: CreateOrganizationRequest = {
        name: newOrgName,
        slug: newOrgName.toLowerCase().replace(/\s+/g, '-')
      }
      
      console.log('Creating organization via backend API:', request)
      const token = await getToken()
      const response = await organizationAPI.createOrganization(request, token)
      
      if (response.success && response.data) {
        console.log('Organization created successfully:', response.data.organization)
        setNewOrgName('')
        setShowCreateForm(false)
        
        // Reload backend organizations to show the new one
        await loadBackendOrganizations()
        
        // Navigate to organization management page
        router.push('/settings/workspace')
      } else {
        console.error('Failed to create organization:', response.error)
        alert(`Failed to create organization: ${response.error}`)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinOrganization = (orgId: string) => {
    setActive({ organization: orgId })
  }

  const loadBackendOrganizations = async () => {
    setLoadingBackendOrgs(true)
    try {
      const token = await getToken()
      const response = await organizationAPI.listOrganizations(token)
      
      if (response.success && response.data) {
        console.log('Backend organizations loaded:', response.data.organizations)
        setBackendOrganizations(response.data.organizations)
      } else {
        console.error('Failed to load backend organizations:', response.error)
        setBackendOrganizations([])
      }
    } catch (error) {
      console.error('Error loading backend organizations:', error)
      setBackendOrganizations([])
    } finally {
      setLoadingBackendOrgs(false)
    }
  }

  // Load backend organizations on component mount
  React.useEffect(() => {
    if (orgListLoaded) {
      loadBackendOrganizations()
    }
  }, [orgListLoaded])

  // Debug function to test token
  const debugToken = async () => {
    try {
      const token = await getToken()
      console.log('Token obtained:', token ? `${token.substring(0, 20)}...` : 'No token')
      
      const response = await fetch('http://localhost:8000/api/organization/debug-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Debug token response:', data)
      alert(`Debug result: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('Debug token error:', error)
      alert(`Debug error: ${error}`)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return
    
    try {
      // This will be handled by Clerk's invitation system
      console.log('Inviting user:', inviteEmail)
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error) {
      console.error('Error inviting user:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Your Company</h1>
          <p className="text-gray-600 text-lg">
            Welcome, {user?.firstName}! To continue, you need to be part of your company's workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Existing Organizations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Join Your Company</h2>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBackendOrganizations}
                  disabled={loadingBackendOrgs}
                >
                  {loadingBackendOrgs ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={debugToken}
                  className="text-xs"
                >
                  Debug Token
                </Button>
              </div>
            </div>
            
            {loadingBackendOrgs ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading organizations...</p>
              </div>
            ) : (userMemberships && userMemberships.data && userMemberships.data.length > 0) || backendOrganizations.length > 0 ? (
              <div className="space-y-3">
                {/* Show Clerk organizations */}
                {userMemberships && userMemberships.data && userMemberships.data.map((org: any) => (
                  <div key={org.organization.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{org.organization.name}</h3>
                        <p className="text-sm text-gray-500">
                          Role: {org.role} • Members: {org.organization.membersCount || 0} • Source: Clerk
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleJoinOrganization(org.organization.id)}
                        size="sm"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Show Backend organizations */}
                {backendOrganizations.map((org: any) => (
                  <div key={org.id} className="border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">
                          Role: {org.role} • Members: {org.members_count} • Source: Backend API
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleJoinOrganization(org.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You're not a member of any company workspace yet.</p>
                <p className="text-sm text-gray-400">
                  Ask your company admin to invite you, or create a new company workspace below.
                </p>
              </div>
            )}
          </Card>

          {/* Create New Company Workspace */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Plus className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create Company Workspace</h2>
            </div>
            
            {!showCreateForm ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  Create a new company workspace to get started with your team.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Company Workspace
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Company Name</Label>
                  <Input
                    id="orgName"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleCreateOrganization}
                    disabled={isCreating || !newOrgName.trim()}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isCreating ? "Creating..." : "Create Company Workspace"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewOrgName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Mail className="w-4 h-4" />
              <span className="text-sm">
                Need help? Contact your company admin or check your email for invitations.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
