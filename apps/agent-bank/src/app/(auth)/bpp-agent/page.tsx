"use client"

import { GenerativeCanvas } from "@/design-system/organisms/generative-canvas"
import { useCoAgent, useCoAgentStateRender, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core"
import { useCopilotChatSuggestions } from "@copilotkit/react-ui"
import { useEffect, useState } from "react"

export interface ContentGenerationState {
  id: string
  title: string
  description: string
  status: "planning" | "drafting" | "review" | "editing" | "completed"
  priority: "low" | "medium" | "high"
  complexity: "simple" | "moderate" | "complex"
  content_type: "article" | "blog" | "documentation" | "social_media" | "email" | "presentation"
  target_audience: string[]
  timeline: string
  word_count: number
  tone: "professional" | "casual" | "technical" | "creative"
  keywords: string[]
  content_sections: string[]
  decision: "APPROVED" | "REQUIRES_REVISION" | "PENDING"
  assigned_writer: string
}

export interface ContentRequirements {
  [requirement: string]: {
    priority: "must_have" | "should_have" | "nice_to_have"
    description: string
    impact: "low" | "medium" | "high"
  }
}

export default function ContentGenerationPage() {
  const [currentContent, setCurrentContent] = useState<ContentGenerationState>({
    id: "",
    title: "",
    description: "",
    status: "planning",
    priority: "medium",
    complexity: "moderate",
    content_type: "article",
    target_audience: ["general_audience", "professionals"],
    timeline: "2-3 days",
    word_count: 0,
    tone: "professional",
    keywords: [],
    content_sections: [],
    decision: "PENDING",
    assigned_writer: "TBD"
  })
  
  const [contentRequirements, setContentRequirements] = useState<ContentRequirements>({})
  const [contentHistory, setContentHistory] = useState<ContentGenerationState[]>([])

  const { state, setState } = useCoAgent({
    name: "contentGenerationAgent",
    initialState: {
      content_id: "",
      content_status: "planning",
      content_requirements: {} as ContentRequirements,
      content_workflow: {},
      review_status: "pending",
      content_plan: {}
    }
  })

  useCopilotAction({
    name: "*",
    description: "This is a catch all action for the Content Generation AI Assistant agent. It will be used to render the agent's response.",
    render: (args: any) => {
      function respond(arg0: string) {
        throw new Error("Function not implemented.")
      }

      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
              {JSON.stringify(args)}
            </div>
            <button onClick={() => {
              respond?.("Content generation completed successfully. Provide summary of the content recommendations")
            }}>
              Accept Content
            </button>     
            <button onClick={() => {
              respond?.("Content rejected. Provide alternative content approach")
            }}>
              Request Alternative
            </button>
          </div>
        </>
      )
    }
  })

  useCoAgentStateRender({
    name: "contentGenerationAgent",
    render: ({state}) => (
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        Content Generation AI Assistant logs: {JSON.stringify(state.tool_logs || [])}
      </div>
    )
  })

  useCopilotAction({
    name: "render_content_generation_analysis",
    description: "This is an action to render the content generation analysis including content details, requirements, and generation opportunities.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      useEffect(() => {
        console.log("Content generation analysis args:", args)
      }, [args])
      
      return (
        <>
          {args?.analysis && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Content Generation Analysis</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Content ID</label>
                    <p className="text-sm text-gray-800">{args.analysis.content_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-sm text-gray-800 capitalize">{args.analysis.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p className="text-sm text-gray-800 capitalize">{args.analysis.priority}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Content Type</label>
                    <p className="text-sm text-gray-800 capitalize">{args.analysis.content_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timeline</label>
                    <p className="text-sm text-gray-800">{args.analysis.timeline}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Word Count</label>
                    <p className="text-sm text-gray-800">{args.analysis.word_count}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                    {args.analysis.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Target Audience</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {args.analysis.target_audience?.map((audience: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {audience.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Tone</label>
                  <p className="text-sm text-gray-800 capitalize">{args.analysis.tone}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {args.analysis.keywords?.map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setCurrentContent(prev => ({
                      ...prev,
                      id: args.analysis.content_id,
                      description: args.analysis.description,
                      status: args.analysis.status,
                      priority: args.analysis.priority,
                      timeline: args.analysis.timeline,
                      content_type: args.analysis.content_type,
                      target_audience: args.analysis.target_audience,
                      word_count: args.analysis.word_count,
                      tone: args.analysis.tone,
                      keywords: args.analysis.keywords
                    }))
                    respond("Content analysis completed successfully. Proceed with content generation workflow")
                  }
                }}
              >
                Accept Analysis
              </button>
              <button 
                hidden={status == "complete"}
                className="rounded-full px-6 py-2 bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 transition-colors font-semibold text-sm ml-2"
                onClick={() => {
                  if (respond) {
                    respond("Analysis rejected. Please provide alternative content approach")
                  }
                }}
              >
                Reject Analysis
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_content_workflow",
    description: "This is an action to render content generation workflow design and implementation recommendations.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.workflow && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Content Generation Workflow</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Generation Progress</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${args.workflow.generation_progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {args.workflow.generation_progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Complexity</label>
                    <p className={`text-sm font-medium capitalize ${
                      args.workflow.complexity === 'simple' ? 'text-green-600' : 
                      args.workflow.complexity === 'moderate' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {args.workflow.complexity}
                    </p>
                  </div>
                </div>

                {args.workflow.content_sections && args.workflow.content_sections.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Content Sections</label>
                    <ul className="mt-1 space-y-1">
                      {args.workflow.content_sections.map((section: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {section}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {args.workflow.generation_steps && args.workflow.generation_steps.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Generation Steps</label>
                    <ul className="mt-1 space-y-1">
                      {args.workflow.generation_steps.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button 
                hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setCurrentContent(prev => ({
                      ...prev,
                      generation_progress: args.workflow.generation_progress || 0,
                      complexity: args.workflow.complexity,
                      content_sections: args.workflow.content_sections || [],
                      generation_steps: args.workflow.generation_steps || []
                    }))
                    respond("Content workflow accepted. Proceed with content generation")
                  }
                }}
              >
                Accept Workflow
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_compliance_assessment",
    description: "This is an action to render compliance assessment and regulatory requirements.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.compliance && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Compliance Assessment</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Compliance Status</label>
                    <p className={`text-sm font-medium capitalize ${
                      args.compliance.status === 'compliant' ? 'text-green-600' : 
                      args.compliance.status === 'partial' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {args.compliance.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Risk Level</label>
                    <p className={`text-sm font-medium capitalize ${
                      args.compliance.risk_level === 'low' ? 'text-green-600' : 
                      args.compliance.risk_level === 'medium' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {args.compliance.risk_level}
                    </p>
                  </div>
                </div>

                {args.compliance.requirements && args.compliance.requirements.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Compliance Requirements</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {args.compliance.requirements.map((req: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {req.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setCurrentContent(prev => ({
                      ...prev,
                      compliance_requirements: args.compliance.requirements || []
                    }))
                    respond("Compliance assessment completed. Generate implementation plan")
                  }
                }}
              >
                Accept Assessment
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_implementation_plan",
    description: "This is an action to render the final implementation plan and next steps.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.plan && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Implementation Plan</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Process ID</label>
                    <p className="text-sm text-gray-800">{args.plan.process_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Decision</label>
                    <p className={`text-sm font-bold ${
                      args.plan.decision === 'APPROVED' ? 'text-green-600' : 
                      args.plan.decision === 'REQUIRES_REVISION' ? 'text-orange-600' : 
                      'text-gray-600'
                    }`}>
                      {args.plan.decision}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Automation Level</label>
                    <p className="text-sm text-gray-800">{args.plan.automation_level}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timeline</label>
                    <p className="text-sm text-gray-800">{args.plan.implementation_timeline}</p>
                  </div>
                </div>

                {args.plan.next_steps && args.plan.next_steps.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Next Steps</label>
                    <ul className="mt-1 space-y-1">
                      {args.plan.next_steps.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button 
                hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setCurrentContent(prev => ({
                      ...prev,
                      decision: args.plan.decision,
                      assigned_team: args.plan.assigned_team
                    }))
                    setContentHistory(prev => [...prev, currentContent])
                    respond("Implementation plan processed successfully. BPP AI Assistant workflow completed.")
                  }
                }}
              >
                Accept Plan
              </button>
              <button 
                hidden={status == "complete"}
                className="rounded-full px-6 py-2 bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 transition-colors font-semibold text-sm ml-2"
                onClick={() => {
                  if (respond) {
                    respond("Plan rejected. Please provide alternative implementation approach")
                  }
                }}
              >
                Request Revision
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotReadable({
    description: "This is the current state of the Content Generation AI Assistant",
    value: JSON.stringify({
      content: currentContent,
      content_requirements: contentRequirements,
      history_count: contentHistory.length
    })
  })

  useCopilotChatSuggestions({
    available: "enabled",
    instructions: "You are the Content Generation AI Assistant. Help users with content creation and strategy. Suggest actions like: 'Generate blog post about AI trends', 'Create social media content for product launch', 'Write email newsletter for customer engagement', or 'Develop content calendar for Q1 marketing'.",
  })

  // Create a compatible portfolio state for GenerativeCanvas
  const compatiblePortfolioState = {
    id: currentContent.id,
    trigger: currentContent.title || "Content Generation",
    performanceData: [], // Empty for content context
    allocations: [], // Empty for content context
    returnsData: [], // Empty for content context
    bullInsights: [], // Empty for content context
    bearInsights: [], // Empty for content context
    currentPortfolioValue: 0, // Not applicable for content
    totalReturns: 0, // Not applicable for content
    // Add content-specific data
        contentData: {
          content: currentContent,
          contentRequirements: contentRequirements,
          contentHistory: contentHistory
        }
  }

  return (
    <GenerativeCanvas 
      contentData={compatiblePortfolioState.contentData}
    />
  )
}
