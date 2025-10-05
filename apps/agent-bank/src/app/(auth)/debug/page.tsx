"use client"

import { Card } from '@/design-system/atoms/card'
import { useAuth, useOrganization, useOrganizationList } from '@clerk/nextjs'

export default function DebugPage() {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth()
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Information</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Auth Loaded:</span>
              <span className={authLoaded ? "text-green-600" : "text-red-600"}>
                {authLoaded ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Signed In:</span>
              <span className={isSignedIn ? "text-green-600" : "text-red-600"}>
                {isSignedIn ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="font-mono text-sm">{userId || "None"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Org Loaded:</span>
              <span className={orgLoaded ? "text-green-600" : "text-red-600"}>
                {orgLoaded ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Org List Loaded:</span>
              <span className={orgListLoaded ? "text-green-600" : "text-red-600"}>
                {orgListLoaded ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current Org:</span>
              <span>{organization?.name || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span>Org Count:</span>
              <span>{organizationList?.length || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Clerk Keys</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Publishable Key:</span>
                  <div className="font-mono bg-gray-100 p-1 rounded text-xs">
                    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20)}...
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Secret Key:</span>
                  <div className="font-mono bg-gray-100 p-1 rounded text-xs">
                    {process.env.CLERK_SECRET_KEY ? "Set" : "Not Set"}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Redirect URLs</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">After Sign In:</span>
                  <div className="font-mono bg-gray-100 p-1 rounded text-xs">
                    {process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "Not Set"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">After Sign Up:</span>
                  <div className="font-mono bg-gray-100 p-1 rounded text-xs">
                    {process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "Not Set"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
