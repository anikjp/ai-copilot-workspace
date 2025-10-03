"use client"

import { useEffect, useState } from "react"

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-white">AJ</div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading AI Platform</h2>
          <p className="text-slate-500">Initializing your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">AJ</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to AI Platform</h1>
        <p className="text-slate-600 text-lg mb-8">Select an option from the sidebar to get started</p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-sm">📊</span>
            </div>
            <h3 className="font-medium text-slate-900">Dashboard</h3>
            <p className="text-sm text-slate-500">View analytics</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-sm">📈</span>
            </div>
            <h3 className="font-medium text-slate-900">Stock Agent</h3>
            <p className="text-sm text-slate-500">AI trading</p>
          </div>
        </div>
      </div>
    </div>
  )
}
