"use client"

import { Button } from '@/design-system/atoms/button'
import { Card } from '@/design-system/atoms/card'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { CreateOrganizationRequest, organizationAPI } from '@/lib/organization-api'
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs'
import {
    ArrowRight,
    Building2,
    Check,
    Mail,
    Plus,
    Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function OrganizationPageWithBackend() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const { organizationList, setActive, isLoaded: orgListLoaded } = useOrganizationList()
  const router = useRouter()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [useBackendAPI, setUseBackendAPI] = useState(false) // Toggle between approaches

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
      if (useBackendAPI) {
        // Option 2: Use custom backend API
        const request: CreateOrganizationRequest = {
          name: newOrgName,
          slug: newOrgName.toLowerCase().replace(/\s+/g, '-')
        }
        
        const response = await organizationAPI.createOrganization(request)
        
        if (response.success && response.data) {
          console.log('Organization created via backend API:', response.data.organization)
          setNewOrgName('')
          setShowCreateForm(false)
          // Refresh the page to update organization state
          window.location.reload()
        } else {
          alert(`Failed to create organization: ${response.error}`)
        }
      } else {
        // Option 1: Use Clerk SDK directly (current implementation)
        const newOrg = await organizationList?.create({
          name: newOrgName,
          slug: newOrgName.toLowerCase().replace(/\s+/g, '-')
        })
        
        if (newOrg) {
          console.log('Organization created via Clerk SDK:', newOrg)
          setNewOrgName('')
          setShowCreateForm(false)
        }
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
          
          {/* API Toggle */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-600">API Method:</span>
            <Button
              variant={useBackendAPI ? "outline" : "default"}
              size="sm"
              onClick={() => setUseBackendAPI(false)}
            >
              Clerk SDK
            </Button>
            <Button
              variant={useBackendAPI ? "default" : "outline"}
              size="sm"
              onClick={() => setUseBackendAPI(true)}
            >
              Backend API
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Existing Organizations */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Join Your Company</h2>
            </div>
            
            {organizationList && organizationList.length > 0 ? (
              <div className="space-y-3">
                {organizationList.map((org) => (
                  <div key={org.organization.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{org.organization.name}</h3>
                        <p className="text-sm text-gray-500">
                          Role: {org.role} • Members: {org.organization.membersCount || 0}
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
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No organizations available to join</p>
                <p className="text-sm text-gray-400">
                  You need an invitation to join an existing company workspace.
                </p>
              </div>
            )}
          </Card>

          {/* Create Organization */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Plus className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create Company</h2>
            </div>
            
            {!showCreateForm ? (
              <div className="text-center py-6">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  Create a new company workspace for your team.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
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
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create Organization
                      </>
                    )}
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
                
                <div className="text-xs text-gray-500">
                  Using: {useBackendAPI ? 'Backend API' : 'Clerk SDK'}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Invite Section */}
        {organization && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Invite Team Members</h3>
                  <p className="text-sm text-gray-500">Add colleagues to your workspace</p>
                </div>
              </div>
              
              {!showInviteForm ? (
                <Button variant="outline" onClick={() => setShowInviteForm(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
                    Send
                  </Button>
                  <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
