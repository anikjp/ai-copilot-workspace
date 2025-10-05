"use client"

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/design-system/atoms/card'
import { Button } from '@/design-system/atoms/button'
import { Input } from '@/design-system/atoms/input'
import { Label } from '@/design-system/atoms/label'
import { Avatar } from '@/design-system/atoms/avatar'
import { User, Mail, Shield, Camera, Save, RotateCcw } from 'lucide-react'

export default function AccountSettingsPage() {
  const { user } = useUser()
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses[0]?.emailAddress || "",
    bio: "AI enthusiast and portfolio manager",
    location: "San Francisco, CA",
    website: "https://aj-copilot.com"
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSaveProfile = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Handle success/error
  }

  const handleSaveSecurity = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Handle success/error
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
            <p className="text-gray-600">Manage your personal information and security preferences</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="flex items-start space-x-6">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-20 h-20">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || "User"} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {user?.firstName?.[0] || "U"}
                    </span>
                  </div>
                )}
              </Avatar>
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
              </div>
              <Button 
                variant={security.twoFactorEnabled ? "default" : "outline"}
                onClick={() => setSecurity({...security, twoFactorEnabled: !security.twoFactorEnabled})}
              >
                {security.twoFactorEnabled ? "Enabled" : "Enable"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive important updates via email</div>
              </div>
              <Button 
                variant={security.emailNotifications ? "default" : "outline"}
                onClick={() => setSecurity({...security, emailNotifications: !security.emailNotifications})}
              >
                {security.emailNotifications ? "Enabled" : "Enable"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">SMS Notifications</div>
                <div className="text-sm text-gray-500">Receive security alerts via SMS</div>
              </div>
              <Button 
                variant={security.smsNotifications ? "default" : "outline"}
                onClick={() => setSecurity({...security, smsNotifications: !security.smsNotifications})}
              >
                {security.smsNotifications ? "Enabled" : "Enable"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Login Alerts</div>
                <div className="text-sm text-gray-500">Get notified of new login attempts</div>
              </div>
              <Button 
                variant={security.loginAlerts ? "default" : "outline"}
                onClick={() => setSecurity({...security, loginAlerts: !security.loginAlerts})}
              >
                {security.loginAlerts ? "Enabled" : "Enable"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveSecurity} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Security Settings"}
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <div className="font-medium text-red-900">Change Password</div>
                <div className="text-sm text-red-700">Update your account password</div>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <div className="font-medium text-red-900">Delete Account</div>
                <div className="text-sm text-red-700">Permanently delete your account and all data</div>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
