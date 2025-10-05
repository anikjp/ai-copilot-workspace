"use client"

import { Avatar } from '@/design-system/atoms/avatar'
import { Badge } from '@/design-system/atoms/badge'
import { Button } from '@/design-system/atoms/button'
import { Card } from '@/design-system/atoms/card'
import { Input } from '@/design-system/atoms/input'
import { Mail, MoreHorizontal, Plus, Shield, Trash2, Users } from 'lucide-react'
import { useState } from 'react'

export default function MembersSettingsPage() {
  const [members] = useState([
    {
      id: 1,
      name: "AJ User",
      email: "aj@example.com",
      role: "Owner",
      status: "Active",
      avatar: null,
      lastActive: "2 minutes ago"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Admin",
      status: "Active",
      avatar: null,
      lastActive: "1 hour ago"
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      role: "Member",
      status: "Active",
      avatar: null,
      lastActive: "3 hours ago"
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: "Member",
      status: "Pending",
      avatar: null,
      lastActive: "Never"
    }
  ])

  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail) return
    
    setIsInviting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setInviteEmail("")
    setIsInviting(false)
    // Handle success/error
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner": return "bg-purple-100 text-purple-800"
      case "Admin": return "bg-blue-100 text-blue-800"
      case "Member": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Pending": return "bg-yellow-100 text-yellow-800"
      case "Suspended": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Company Team</h2>
              <p className="text-gray-600">Manage your company team members and their roles</p>
            </div>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invite Member */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
              <Mail className="w-4 h-4 mr-2" />
              {isInviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </Card>

        {/* Members List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Team Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Member</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {member.lastActive}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        {member.role !== "Owner" && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Role Permissions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { role: "Admin", description: "Full company workspace control and management", permissions: ["All permissions", "Manage team members", "Billing & subscription", "Company settings", "Export data"] },
              { role: "Manager", description: "Team management and project oversight", permissions: ["Manage team members", "Project management", "View analytics", "Manage integrations", "Invite users"] },
              { role: "Member", description: "Standard company workspace access", permissions: ["View content", "Create content", "Use AI agents", "View analytics", "Collaborate"] }
            ].map((roleInfo) => (
              <div key={roleInfo.role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getRoleColor(roleInfo.role)}>
                    {roleInfo.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{roleInfo.description}</p>
                <div className="space-y-1">
                  {roleInfo.permissions.map((permission, index) => (
                    <div key={index} className="text-xs text-gray-500 flex items-center">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
