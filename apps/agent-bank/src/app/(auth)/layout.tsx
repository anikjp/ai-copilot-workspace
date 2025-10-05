"use client"

import { Sidebar } from '@/design-system/organisms/sidebar'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  // Redirect unauthenticated users to public routes
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl font-bold">AJ</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading...</h2>
          <p className="text-slate-500">Checking authentication status</p>
        </div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content - Full screen with pure white background */}
      <main className="flex-1 overflow-y-auto focus:outline-none bg-white">
        {children}
      </main>
    </div>
  )
}
