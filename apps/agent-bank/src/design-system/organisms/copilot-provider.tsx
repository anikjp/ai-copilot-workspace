"use client"

import { getAgentConfig } from "@/config/agents"
import { CopilotKit } from "@copilotkit/react-core"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface CopilotProviderProps {
  children: ReactNode
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  const pathname = usePathname()
  const agentConfig = getAgentConfig(pathname)

  return (
    <CopilotKit
      publicApiKey="ck_pub_2e7a571972c766fff858bb4bd697c86d"
      runtimeUrl={agentConfig.runtimeUrl}
      agent={agentConfig.name}
      publicLicenseKey={agentConfig.publicLicenseKey}
    >
      {children}
    </CopilotKit>
  )
}
