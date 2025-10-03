"use client"

import { ArrowUp, Calendar, ChevronRight, File, FilePlus, FileSpreadsheet, FileText, Folder, Globe, Image, Layers, LucideIcon, Paperclip, Plus, Square, Upload, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Dynamic configuration interfaces
export interface ActionItem {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  status?: 'available' | 'beta' | 'coming-soon'
  onClick?: () => void
}

export interface PopupConfig {
  id: string
  title: string
  items: ActionItem[]
  position?: {
    bottom?: string
    left?: string
    right?: string
    top?: string
  }
  width?: string
  zIndex?: number
}

export interface QuickAction {
  id: string
  title: string
  description: string
  onClick: () => void
}

export interface FileTypeConfig {
  extensions: string[]
  icon: LucideIcon
  color: string
}

export interface StylingConfig {
  // Container styling
  containerClass?: string
  formClass?: string
  
  // Button styling
  primaryButtonClass?: string
  secondaryButtonClass?: string
  selectedButtonClass?: string
  
  // Popup styling
  popupClass?: string
  popupItemClass?: string
  
  // File display styling
  fileCardClass?: string
  fileIconClass?: string
}

export interface TextConfig {
  // Placeholders
  placeholder?: string
  workingPlaceholder?: string
  
  // Button labels
  quickActionsLabel?: string
  createLabel?: string
  knowledgeLabel?: string
  sendLabel?: string
  stopLabel?: string
  
  // Popup labels
  foldersLabel?: string
  uploadFilesLabel?: string
  meetingsLabel?: string
  fileUploadsLabel?: string
  searchWebLabel?: string
  
  // Status labels
  betaLabel?: string
  comingSoonLabel?: string
  allEnabledLabel?: string
  
  // Action labels
  clearSelectionLabel?: string
  selectedLabel?: string
  backToLabel?: string
}

export interface BehaviorConfig {
  // File handling
  acceptedFileTypes?: string
  maxFileSize?: number
  maxFiles?: number
  
  // Textarea behavior
  minRows?: number
  maxRows?: number
  maxHeight?: number
  
  // Popup behavior
  closeOnOutsideClick?: boolean
  closeOnItemSelect?: boolean
  
  // Auto-resize
  autoResize?: boolean
}

// Main component props
export interface DynamicChatInputProps {
  // Core functionality
  inProgress: boolean
  onSend: (text: string) => Promise<any>
  isVisible?: boolean
  onStop?: () => void
  onUpload?: (files: File[]) => void
  
  // Dynamic configurations
  quickActions?: QuickAction[]
  createItems?: ActionItem[]
  knowledgeItems?: ActionItem[]
  folderItems?: ActionItem[]
  
  // Popup configurations
  popups?: PopupConfig[]
  
  // File handling
  fileTypes?: FileTypeConfig[]
  enableFileUpload?: boolean
  
  // Customization
  styling?: StylingConfig
  text?: TextConfig
  behavior?: BehaviorConfig
  
  // Event handlers
  onQuickActionSelect?: (action: QuickAction) => void
  onCreateItemSelect?: (item: ActionItem) => void
  onKnowledgeItemSelect?: (item: ActionItem) => void
  onFolderItemSelect?: (item: ActionItem) => void
}

// Default configurations
const DEFAULT_TEXT: Required<TextConfig> = {
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

const DEFAULT_BEHAVIOR: Required<BehaviorConfig> = {
  acceptedFileTypes: "image/*,.pdf,.csv,.xlsx,.doc,.docx",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  minRows: 3,
  maxRows: 12,
  maxHeight: 288,
  closeOnOutsideClick: true,
  closeOnItemSelect: true,
  autoResize: true
}

const DEFAULT_FILE_TYPES: FileTypeConfig[] = [
  { extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'], icon: Image, color: 'text-blue-500' },
  { extensions: ['pdf'], icon: FileText, color: 'text-red-500' },
  { extensions: ['xlsx', 'xls', 'csv'], icon: FileSpreadsheet, color: 'text-green-500' },
  { extensions: ['doc', 'docx'], icon: FileText, color: 'text-blue-600' }
]

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'interview-summary',
    title: 'Summarize key points from an interview',
    description: 'I\'ve hosted the following interview with...',
    onClick: () => {}
  },
  {
    id: 'support-ticket',
    title: 'Summarize a support ticket',
    description: 'I\'m a customer support agent for {{Pro...',
    onClick: () => {}
  },
  {
    id: 'product-specs',
    title: 'Locate product specifications',
    description: 'What is the {{product specification/all...',
    onClick: () => {}
  },
  {
    id: 'all-tasks',
    title: 'All tasks',
    description: '',
    onClick: () => {}
  }
]

const DEFAULT_CREATE_ITEMS: ActionItem[] = [
  {
    id: 'doc',
    label: 'Doc',
    description: 'Write and collaborate',
    icon: File,
    status: 'beta'
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Create custom images',
    icon: Image,
    status: 'available'
  },
  {
    id: 'slides',
    label: 'Slides',
    description: 'Generate a presentation',
    icon: FilePlus,
    status: 'coming-soon'
  },
  {
    id: 'sheet',
    label: 'Sheet',
    description: 'Create a spreadsheet',
    icon: FileSpreadsheet,
    status: 'coming-soon'
  },
  {
    id: 'task',
    label: 'Task',
    description: 'Build a custom workflow',
    icon: Zap,
    status: 'coming-soon'
  }
]

const DEFAULT_KNOWLEDGE_ITEMS: ActionItem[] = [
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
]

const DEFAULT_FOLDER_ITEMS: ActionItem[] = [
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
]

export default function DynamicChatInput({
  inProgress,
  onSend,
  isVisible = true,
  onStop,
  onUpload,
  quickActions = DEFAULT_QUICK_ACTIONS,
  createItems = DEFAULT_CREATE_ITEMS,
  knowledgeItems = DEFAULT_KNOWLEDGE_ITEMS,
  folderItems = DEFAULT_FOLDER_ITEMS,
  fileTypes = DEFAULT_FILE_TYPES,
  enableFileUpload = true,
  styling = {},
  text = {},
  behavior = {},
  onQuickActionSelect,
  onCreateItemSelect,
  onKnowledgeItemSelect,
  onFolderItemSelect
}: DynamicChatInputProps) {
  // Merge with defaults
  const textConfig = { ...DEFAULT_TEXT, ...text }
  const behaviorConfig = { ...DEFAULT_BEHAVIOR, ...behavior }
  
  // State management
  const [value, setValue] = useState("")
  const [showQuick, setShowQuick] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showFolders, setShowFolders] = useState(false)
  const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<string | null>(null)
  const [selectedCreateItem, setSelectedCreateItem] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  
  // Refs
  const quickRef = useRef<HTMLDivElement | null>(null)
  const knowledgeRef = useRef<HTMLDivElement | null>(null)
  const createRef = useRef<HTMLDivElement | null>(null)
  const foldersRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Event handlers
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = value.trim()
    if (!text || inProgress) return
    await onSend(text)
    setValue("")
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const newFiles = Array.from(files)
    setUploadedFiles(prev => [...prev, ...newFiles])
    onUpload?.(newFiles)
    
    if (behaviorConfig.closeOnItemSelect) {
      setShowKnowledge(false)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileExplorer = () => {
    fileInputRef.current?.click()
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const fileType = fileTypes.find(ft => 
      ft.extensions.includes(extension || '')
    )
    
    if (fileType) {
      const IconComponent = fileType.icon
      return <IconComponent className={`w-6 h-6 ${fileType.color}`} />
    }
    
    return <File className="w-6 h-6 text-slate-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
  }

  // Auto-resize effect
  useEffect(() => {
    if (behaviorConfig.autoResize && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, behaviorConfig.maxHeight) + "px"
    }
  }, [value, behaviorConfig.autoResize, behaviorConfig.maxHeight])

  // Click outside handler
  useEffect(() => {
    if (!behaviorConfig.closeOnOutsideClick) return
    
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return
      if (quickRef.current && !quickRef.current.contains(e.target)) setShowQuick(false)
      if (knowledgeRef.current && !knowledgeRef.current.contains(e.target)) setShowKnowledge(false)
      if (createRef.current && !createRef.current.contains(e.target)) setShowCreate(false)
      if (foldersRef.current && !foldersRef.current.contains(e.target)) setShowFolders(false)
    }
    
    if (showQuick || showKnowledge || showCreate || showFolders) {
      document.addEventListener("mousedown", onClick)
    }
    
    return () => document.removeEventListener("mousedown", onClick)
  }, [showQuick, showKnowledge, showCreate, showFolders, behaviorConfig.closeOnOutsideClick])

  if (!isVisible) return null

  const canSend = value.trim().length > 0 && !inProgress

  return (
    <div className={`copilot-debug-input w-full px-4 pb-4 pt-2 bg-transparent relative ${styling.containerClass || ''}`}>
      {/* Hidden file input */}
      {enableFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept={behaviorConfig.acceptedFileTypes}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      )}

      <form
        onSubmit={handleSubmit}
        className={`w-full relative bg-slate-100 rounded-2xl p-4 min-h-[120px] flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-200 ${styling.formClass || ''}`}
      >
        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`relative group bg-slate-200 rounded-lg p-3 min-w-[200px] max-w-[250px] flex-shrink-0 ${styling.fileCardClass || ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-12 h-12 rounded-lg object-cover bg-white"
                          onLoad={(e) => {
                            setTimeout(() => URL.revokeObjectURL(e.currentTarget.src), 1000)
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          {getFileIcon(file.name)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate mb-1" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 p-1 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 mb-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (behaviorConfig.autoResize) {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, behaviorConfig.maxHeight) + "px"
              }
            }}
            placeholder={inProgress ? textConfig.workingPlaceholder : textConfig.placeholder}
            disabled={inProgress}
            rows={behaviorConfig.minRows}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void handleSubmit()
              }
            }}
            className="w-full min-h-[72px] max-h-72 bg-transparent border-0 resize-none px-0 py-0 text-[15px] leading-6 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50 overflow-y-auto"
            style={{ height: `${behaviorConfig.minRows * 24}px` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Quick Actions Button */}
            {quickActions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowQuick((v) => !v)}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-white hover:bg-slate-700 transition-colors ${styling.secondaryButtonClass || ''}`}
                aria-label={textConfig.quickActionsLabel}
                title={textConfig.quickActionsLabel}
              >
                <Zap className="w-4 h-4" />
              </button>
            )}

            {/* Create Button */}
            {createItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCreate(!showCreate)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-medium ${
                    showCreate 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : selectedCreateItem
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-slate-600 text-white hover:bg-slate-700'
                  } ${styling.primaryButtonClass || ''}`}
                  aria-label={textConfig.createLabel}
                  title={selectedCreateItem ? `${textConfig.selectedLabel}: ${selectedCreateItem}` : textConfig.createLabel}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {selectedCreateItem || textConfig.createLabel}
                </button>
                
                {selectedCreateItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCreateItem(null)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                    aria-label={textConfig.clearSelectionLabel}
                    title={textConfig.clearSelectionLabel}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}

            {/* Knowledge Button */}
            {knowledgeItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowKnowledge((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-medium ${
                    showKnowledge 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : selectedKnowledgeItem
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-slate-600 text-white hover:bg-slate-700'
                  } ${styling.primaryButtonClass || ''}`}
                  aria-label={textConfig.knowledgeLabel}
                  title={selectedKnowledgeItem ? `${textConfig.selectedLabel}: ${selectedKnowledgeItem}` : textConfig.knowledgeLabel}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {selectedKnowledgeItem || textConfig.knowledgeLabel}
                </button>
                
                {selectedKnowledgeItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedKnowledgeItem(null)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                    aria-label={textConfig.clearSelectionLabel}
                    title={textConfig.clearSelectionLabel}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Send/Stop Button */}
          <button
            type="button"
            onClick={(e) => {
              if (inProgress && onStop) onStop()
              else void handleSubmit(e as unknown as React.FormEvent)
            }}
            disabled={!inProgress && !canSend}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              inProgress
                ? "bg-red-600 text-white hover:bg-red-700"
                : canSend
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-400 text-white cursor-not-allowed"
            } ${styling.primaryButtonClass || ''}`}
            aria-label={inProgress ? textConfig.stopLabel : textConfig.sendLabel}
            title={inProgress ? textConfig.stopLabel : textConfig.sendLabel}
          >
            {inProgress ? <Square className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Quick Actions Popup */}
      {showQuick && quickActions.length > 0 && (
        <div
          ref={quickRef}
          className={`absolute bottom-[80px] left-[20px] w-[280px] rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-sm p-2.5 z-[60] ${styling.popupClass || ''}`}
        >
          <div className="space-y-1">
            {quickActions.map((action, index) => (
              <button
                key={action.id}
                className={`w-full text-left hover:bg-slate-50 transition-colors group -mx-2.5 px-2.5 ${styling.popupItemClass || ''}`}
                onClick={() => {
                  setValue(action.title)
                  setShowQuick(false)
                  onQuickActionSelect?.(action)
                  action.onClick()
                }}
              >
                <div className="py-1.5">
                  <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700 mb-0.5">
                    {action.title}
                  </div>
                  {action.description && (
                    <div className="text-xs text-slate-500 group-hover:text-slate-600">
                      {action.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Popup */}
      {showCreate && createItems.length > 0 && (
        <div
          ref={createRef}
          className={`absolute bottom-[80px] left-[60px] w-[280px] rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-sm p-2.5 z-[60] ${styling.popupClass || ''}`}
        >
          <div className="space-y-0.5">
            {createItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-blue-50 rounded-md transition-all duration-200 group ${styling.popupItemClass || ''}`}
                onClick={() => {
                  setSelectedCreateItem(item.label)
                  setShowCreate(false)
                  onCreateItemSelect?.(item)
                  item.onClick?.()
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <item.icon className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-900 group-hover:text-blue-900">{item.label}</span>
                    {item.description && (
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-600">{item.description}</span>
                    )}
                  </div>
                </div>
                {item.status === 'beta' && (
                  <span className="text-[9px] text-white bg-blue-600 px-1.5 py-0.5 rounded-full">{textConfig.betaLabel}</span>
                )}
                {item.status === 'coming-soon' && (
                  <span className="text-[9px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">{textConfig.comingSoonLabel}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Popup */}
      {showKnowledge && knowledgeItems.length > 0 && (
        <div
          ref={knowledgeRef}
          className={`absolute bottom-[80px] left-[120px] w-[280px] rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-sm p-2.5 z-[60] ${styling.popupClass || ''}`}
        >
          <div className="space-y-0.5">
            {knowledgeItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-blue-50 rounded-md transition-all duration-200 group ${styling.popupItemClass || ''}`}
                onClick={() => {
                  if (item.id === 'folders') {
                    setShowFolders(!showFolders)
                  } else if (item.id === 'upload-files') {
                    setSelectedKnowledgeItem(item.label)
                    setShowKnowledge(false)
                    triggerFileExplorer()
                  } else {
                    setSelectedKnowledgeItem(item.label)
                    setShowKnowledge(false)
                    onKnowledgeItemSelect?.(item)
                    item.onClick?.()
                  }
                }}
              >
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <item.icon className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-900 group-hover:text-blue-900">{item.label}</span>
                {item.id === 'folders' && (
                  <ChevronRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 transition-colors ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Folders Popup */}
      {showFolders && folderItems.length > 0 && (
        <div
          ref={foldersRef}
          className={`absolute bottom-[80px] left-[400px] w-[280px] rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-sm p-2.5 z-[70] ${styling.popupClass || ''}`}
        >
          <div className="space-y-0.5">
            <button 
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-blue-50 rounded-md transition-all duration-200 group mb-2 ${styling.popupItemClass || ''}`}
              onClick={() => setShowFolders(false)}
            >
              <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <ChevronRight className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-600 rotate-180" />
              </div>
              <span className="text-xs font-medium text-slate-900 group-hover:text-blue-900">{textConfig.backToLabel} {textConfig.knowledgeLabel}</span>
            </button>

            <div className="space-y-0.5">
              {folderItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-blue-50 rounded-md transition-all duration-200 group ${styling.popupItemClass || ''}`}
                  onClick={() => {
                    setSelectedKnowledgeItem(item.label)
                    setShowFolders(false)
                    setShowKnowledge(false)
                    onFolderItemSelect?.(item)
                    item.onClick?.()
                  }}
                >
                  <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <item.icon className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-900 group-hover:text-blue-900">{item.label}</span>
                    {item.description && (
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-600">{item.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
