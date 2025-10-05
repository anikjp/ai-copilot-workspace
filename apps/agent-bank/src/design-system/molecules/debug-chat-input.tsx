"use client"

import DynamicChatInput from './dynamic-chat-input'
import { 
  File, 
  FileText, 
  Image, 
  Calendar, 
  Globe, 
  Zap, 
  Plus, 
  Layers, 
  Folder,
  Paperclip,
  Upload,
  FileSpreadsheet,
  FilePlus
} from 'lucide-react'

// CopilotKit InputProps interface
interface InputProps {
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: () => void
}

// Default configuration that matches the original behavior
const DEFAULT_CONFIG = {
  quickActions: [
    {
      id: 'interview-summary',
      title: 'Summarize key points from an interview',
      description: 'I\'ve hosted the following interview with...',
      onClick: () => console.log('Interview summary selected')
    },
    {
      id: 'support-ticket',
      title: 'Summarize a support ticket',
      description: 'I\'m a customer support agent for {{Pro...',
      onClick: () => console.log('Support ticket selected')
    },
    {
      id: 'product-specs',
      title: 'Locate product specifications',
      description: 'What is the {{product specification/all...',
      onClick: () => console.log('Product specs selected')
    },
    {
      id: 'all-tasks',
      title: 'All tasks',
      description: '',
      onClick: () => console.log('All tasks selected')
    }
  ],

  createItems: [
    {
      id: 'doc',
      label: 'Doc',
      description: 'Write and collaborate',
      icon: File,
      status: 'beta' as const
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Create custom images',
      icon: Image,
      status: 'available' as const
    },
    {
      id: 'slides',
      label: 'Slides',
      description: 'Generate a presentation',
      icon: FilePlus,
      status: 'coming-soon' as const
    },
    {
      id: 'sheet',
      label: 'Sheet',
      description: 'Create a spreadsheet',
      icon: FileSpreadsheet,
      status: 'coming-soon' as const
    },
    {
      id: 'task',
      label: 'Task',
      description: 'Build a custom workflow',
      icon: Zap,
      status: 'coming-soon' as const
    }
  ],

  knowledgeItems: [
    {
      id: 'folders',
      label: 'Folders',
      icon: Folder
    },
    {
      id: 'upload-files',
      label: 'Upload files',
      icon: Paperclip
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: Calendar
    },
    {
      id: 'file-uploads',
      label: 'File uploads',
      icon: Upload
    },
    {
      id: 'search-web',
      label: 'Search web',
      icon: Globe
    }
  ],

  folderItems: [
    {
      id: 'project-documents',
      label: 'Project Documents',
      description: '12 files',
      icon: Folder
    },
    {
      id: 'research-papers',
      label: 'Research Papers',
      description: '8 files',
      icon: Folder
    },
    {
      id: 'meeting-notes',
      label: 'Meeting Notes',
      description: '15 files',
      icon: Folder
    },
    {
      id: 'templates',
      label: 'Templates',
      description: '5 files',
      icon: Folder
    },
    {
      id: 'archives',
      label: 'Archives',
      description: '23 files',
      icon: Folder
    }
  ],

  text: {
    placeholder: "What would you like to do?",
    workingPlaceholder: "Working…",
    quickActionsLabel: "Quick actions",
    createLabel: "Create",
    knowledgeLabel: "Knowledge",
    sendLabel: "Send",
    stopLabel: "Stop",
    foldersLabel: "Folders",
    uploadFilesLabel: "Upload files",
    meetingsLabel: "Meetings",
    fileUploadsLabel: "File uploads",
    searchWebLabel: "Search web",
    betaLabel: "Beta",
    comingSoonLabel: "Coming soon",
    allEnabledLabel: "All enabled",
    clearSelectionLabel: "Clear selection",
    selectedLabel: "Selected",
    backToLabel: "Back to"
  }
}

export default function DebugChatInput({
  inProgress,
  onSend,
  isVisible = true,
  onStop,
  onUpload,
}: InputProps) {
  return (
    <DynamicChatInput
      inProgress={inProgress}
      onSend={onSend}
      isVisible={isVisible}
      onStop={onStop}
      onUpload={onUpload ? (files) => onUpload() : undefined}
      {...DEFAULT_CONFIG}
    />
  )
}
