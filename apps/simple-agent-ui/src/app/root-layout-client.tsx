"use client"

import { Sidebar } from "@/design-system/organisms/sidebar";
import { cn } from "@/lib/utils";
import { LayoutProvider, useLayout } from "@/providers/layout-provider";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <LayoutProvider>
      <RootLayoutContent>
        {children}
      </RootLayoutContent>
    </LayoutProvider>
  );
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout()
  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64"

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Constant Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col transition-all duration-300",
        sidebarWidth
      )}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area - Pages will render here */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
