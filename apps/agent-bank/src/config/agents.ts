export interface AgentConfig {
  name: string
  runtimeUrl: string
  publicLicenseKey: string
  description: string
  icon: string
  color: string
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'agno': {
    name: 'agnoAgent',
    runtimeUrl: '/api/copilotkit',
    publicLicenseKey: 'ck_pub_2e7a571972c766fff858bb4bd697c86d',
    description: 'AI Investment Assistant',
    icon: '📈',
    color: 'green'
  },
  'stock-reference': {
    name: 'agnoAgent',
    runtimeUrl: '/api/copilotkit/stock-reference',
    publicLicenseKey: 'ck_pub_2e7a571972c766fff858bb4bd697c86d',
    description: 'Stock Analysis Agent (Reference Implementation)',
    icon: '📊',
    color: 'emerald'
  },
  'hr': {
    name: 'hrAgent',
    runtimeUrl: '/api/copilotkit/hr',
    publicLicenseKey: 'ck_pub_hr_agent_key_here',
    description: 'HR Management Assistant',
    icon: '👥',
    color: 'blue'
  },
  'it-support': {
    name: 'itSupportAgent',
    runtimeUrl: '/api/copilotkit/it-support',
    publicLicenseKey: 'ck_pub_it_agent_key_here',
    description: 'IT Support Assistant',
    icon: '🔧',
    color: 'purple'
  },
  'docu': {
    name: 'docuAgent',
    runtimeUrl: '/api/copilotkit/docu',
    publicLicenseKey: 'ck_pub_docu_agent_key_here',
    description: 'Document Management Assistant',
    icon: '📄',
    color: 'orange'
  },
  'ringi': {
    name: 'ringiAgent',
    runtimeUrl: '/api/copilotkit/ringi',
    publicLicenseKey: 'ck_pub_ringi_agent_key_here',
    description: 'Ringi System Decision-Making Assistant',
    icon: '🏢',
    color: 'indigo'
  },
  'bpp': {
    name: 'bppAgent',
    runtimeUrl: '/api/copilotkit/bpp',
    publicLicenseKey: 'ck_pub_bpp_agent_key_here',
    description: 'BPP AI Assistant for Business Process Planning',
    icon: '⚙️',
    color: 'cyan'
  },
  'generic': {
    name: 'genericAgent',
    runtimeUrl: '/api/copilotkit/generic',
    publicLicenseKey: 'ck_pub_generic_agent_key_here',
    description: 'A versatile agent capable of handling various tasks and workspace interactions.',
    icon: '🤖',
    color: 'blue'
  },
  'default': {
    name: 'agnoAgent',
    runtimeUrl: '/api/copilotkit',
    publicLicenseKey: 'ck_pub_2e7a571972c766fff858bb4bd697c86d',
    description: 'AI Assistant',
    icon: '🤖',
    color: 'gray'
  }
}

export function getAgentConfig(pathname: string): AgentConfig {
  // Extract agent type from pathname
  if (pathname.startsWith('/stock-agent-reference')) {
    return AGENT_CONFIGS['stock-reference']
  }
  if (pathname.startsWith('/stock-agent')) {
    return AGENT_CONFIGS['agno']
  }
  if (pathname.startsWith('/hr-agent')) {
    return AGENT_CONFIGS['hr']
  }
  if (pathname.startsWith('/it-support-agent')) {
    return AGENT_CONFIGS['it-support']
  }
  if (pathname.startsWith('/docu-agent')) {
    return AGENT_CONFIGS['docu']
  }
  if (pathname.startsWith('/ringi-agent')) {
    return AGENT_CONFIGS['ringi']
  }
  if (pathname.startsWith('/bpp-agent')) {
    return AGENT_CONFIGS['bpp']
  }
  if (pathname.startsWith('/generic-agent')) {
    return AGENT_CONFIGS['generic']
  }

  // Default agent for other routes
  return AGENT_CONFIGS['default']
}
