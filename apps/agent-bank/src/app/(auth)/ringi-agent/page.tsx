"use client"

import { GenerativeCanvas } from "@/design-system/organisms/generative-canvas"
import { useCoAgent, useCoAgentStateRender, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core"
import { useCopilotChatSuggestions } from "@copilotkit/react-ui"
import { useEffect, useState } from "react"

export interface RingiProposalState {
  id: string
  title: string
  content: string
  status: "draft" | "under_review" | "approved" | "rejected" | "needs_revision"
  priority: "low" | "medium" | "high"
  estimated_impact: "low" | "moderate" | "high"
  stakeholders: string[]
  timeline: string
  consensus_level: number
  key_concerns: string[]
  recommendations: string[]
  decision: "APPROVED" | "REQUIRES_REVISION" | "PENDING"
  assigned_coordinator: string
}

export interface StakeholderFeedback {
  [stakeholder: string]: {
    status: "pending" | "approved" | "rejected"
    comments: string
    concerns: string[]
  }
}

export default function RingiAgentPage() {
  const [currentProposal, setCurrentProposal] = useState<RingiProposalState>({
    id: "",
    title: "",
    content: "",
    status: "draft",
    priority: "medium",
    estimated_impact: "moderate",
    stakeholders: ["management", "department_heads", "team_leads"],
    timeline: "2-3 weeks",
    consensus_level: 0,
    key_concerns: [],
    recommendations: [],
    decision: "PENDING",
    assigned_coordinator: "TBD"
  })
  
  const [stakeholderFeedback, setStakeholderFeedback] = useState<StakeholderFeedback>({})
  const [proposalHistory, setProposalHistory] = useState<RingiProposalState[]>([])

  const { state, setState } = useCoAgent({
    name: "ringiAgent",
    initialState: {
      proposal_id: "",
      proposal_status: "draft",
      stakeholder_feedback: {} as StakeholderFeedback,
      consensus_level: 0
    }
  })

  useCopilotAction({
    name: "*",
    description: "This is a catch all action for the Ringi System agent. It will be used to render the agent's response.",
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
              respond?.("Proposal analysis completed successfully. Provide summary of the Ringi decision process")
            }}>
              Accept Decision
            </button>     
            <button onClick={() => {
              respond?.("Decision rejected. Provide alternative recommendations for the proposal")
            }}>
              Request Revision
            </button>
          </div>
        </>
      )
    }
  })

  useCoAgentStateRender({
    name: "ringiAgent",
    render: ({state}) => (
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        Ringi System logs: {JSON.stringify(state.tool_logs || [])}
      </div>
    )
  })

  useCopilotAction({
    name: "render_ringi_analysis",
    description: "This is an action to render the Ringi System analysis including proposal details, stakeholder feedback, and decision recommendations.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      useEffect(() => {
        console.log("Ringi analysis args:", args)
      }, [args])
      
      return (
        <>
          {args?.analysis && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Proposal Analysis</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Proposal ID</label>
                    <p className="text-sm text-gray-800">{args.analysis.proposal_id}</p>
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
                    <label className="text-sm font-medium text-gray-600">Timeline</label>
                    <p className="text-sm text-gray-800">{args.analysis.timeline}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Content</label>
                  <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                    {args.analysis.content}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Stakeholders</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {args.analysis.stakeholders?.map((stakeholder: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {stakeholder.replace('_', ' ')}
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
                    setCurrentProposal(prev => ({
                      ...prev,
                      id: args.analysis.proposal_id,
                      content: args.analysis.content,
                      status: args.analysis.status,
                      priority: args.analysis.priority,
                      timeline: args.analysis.timeline,
                      stakeholders: args.analysis.stakeholders
                    }))
                    respond("Proposal analysis completed successfully. Provide summary of the Ringi decision process")
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
                    respond("Analysis rejected. Please provide alternative analysis approach")
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
    name: "render_stakeholder_feedback",
    description: "This is an action to render stakeholder feedback and consensus evaluation.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.feedback && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Stakeholder Feedback</h3>
                
                {Object.entries(args.feedback).map(([stakeholder, data]: [string, any]) => (
                  <div key={stakeholder} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 capitalize">
                        {stakeholder.replace('_', ' ')}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        data.status === 'approved' ? 'bg-green-100 text-green-800' :
                        data.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {data.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{data.comments}</p>
                    {data.concerns && data.concerns.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Concerns:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {data.concerns.map((concern: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {concern.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                hidden={status == "complete"}
                className="mt-4 rounded-full px-6 py-2 bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100 transition-colors font-semibold text-sm"
                onClick={() => {
                  if (respond) {
                    setStakeholderFeedback(args.feedback)
                    respond("Stakeholder feedback gathered successfully. Proceed with consensus evaluation")
                  }
                }}
              >
                Accept Feedback
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_consensus_evaluation",
    description: "This is an action to render consensus evaluation and decision recommendations.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.consensus && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Consensus Evaluation</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Consensus Level</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${args.consensus.consensus_level}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {args.consensus.consensus_level}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approval Status</label>
                    <p className={`text-sm font-medium capitalize ${
                      args.consensus.approval_status === 'approved' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {args.consensus.approval_status}
                    </p>
                  </div>
                </div>

                {args.consensus.key_concerns && args.consensus.key_concerns.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Key Concerns</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {args.consensus.key_concerns.map((concern: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {concern.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {args.consensus.recommendations && args.consensus.recommendations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Recommendations</label>
                    <ul className="mt-1 space-y-1">
                      {args.consensus.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
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
                    setCurrentProposal(prev => ({
                      ...prev,
                      consensus_level: args.consensus.consensus_level,
                      key_concerns: args.consensus.key_concerns || [],
                      recommendations: args.consensus.recommendations || []
                    }))
                    respond("Consensus evaluation completed. Generate final decision")
                  }
                }}
              >
                Accept Evaluation
              </button>
            </>
          )}
        </>
      )
    }
  })

  useCopilotAction({
    name: "render_final_decision",
    description: "This is an action to render the final Ringi System decision and next steps.",
    renderAndWaitForResponse: ({ args, respond, status }) => {
      return (
        <>
          {args?.decision && (
            <>
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800">Final Decision</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Proposal ID</label>
                    <p className="text-sm text-gray-800">{args.decision.proposal_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Decision</label>
                    <p className={`text-sm font-bold ${
                      args.decision.decision === 'APPROVED' ? 'text-green-600' : 
                      args.decision.decision === 'REQUIRES_REVISION' ? 'text-orange-600' : 
                      'text-gray-600'
                    }`}>
                      {args.decision.decision}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Consensus Level</label>
                    <p className="text-sm text-gray-800">{args.decision.consensus_level}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timeline</label>
                    <p className="text-sm text-gray-800">{args.decision.implementation_timeline}</p>
                  </div>
                </div>

                {args.decision.next_steps && args.decision.next_steps.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Next Steps</label>
                    <ul className="mt-1 space-y-1">
                      {args.decision.next_steps.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {args.decision.key_concerns && args.decision.key_concerns.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Key Concerns to Address</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {args.decision.key_concerns.map((concern: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {concern.replace('_', ' ')}
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
                    setCurrentProposal(prev => ({
                      ...prev,
                      decision: args.decision.decision,
                      assigned_coordinator: args.decision.assigned_coordinator
                    }))
                    setProposalHistory(prev => [...prev, currentProposal])
                    respond("Final decision processed successfully. Ringi System workflow completed.")
                  }
                }}
              >
                Accept Decision
              </button>
              <button 
                hidden={status == "complete"}
                className="rounded-full px-6 py-2 bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 transition-colors font-semibold text-sm ml-2"
                onClick={() => {
                  if (respond) {
                    respond("Decision rejected. Please provide alternative recommendations")
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
    description: "This is the current state of the Ringi System proposal",
    value: JSON.stringify({
      proposal: currentProposal,
      stakeholder_feedback: stakeholderFeedback,
      history_count: proposalHistory.length
    })
  })

  useCopilotChatSuggestions({
    available: "enabled",
    instructions: "You are the Ringi System AI Agent. Help users with Japanese business decision-making processes. Suggest actions like: 'Analyze this proposal for budget approval', 'Review stakeholder feedback for the new project', 'Evaluate consensus for the marketing initiative', or 'Generate decision for the HR policy change'.",
  })

  // Create a compatible portfolio state for GenerativeCanvas
  const compatiblePortfolioState = {
    id: currentProposal.id,
    trigger: currentProposal.title || "Ringi Proposal",
    performanceData: [], // Empty for Ringi context
    allocations: [], // Empty for Ringi context
    returnsData: [], // Empty for Ringi context
    bullInsights: [], // Empty for Ringi context
    bearInsights: [], // Empty for Ringi context
    currentPortfolioValue: 0, // Not applicable for Ringi
    totalReturns: 0, // Not applicable for Ringi
    // Add Ringi-specific data
    ringiData: {
      proposal: currentProposal,
      stakeholderFeedback: stakeholderFeedback,
      proposalHistory: proposalHistory
    }
  }

  return (
    <GenerativeCanvas 
      setSelectedStock={() => {}} // Not used in Ringi context
      portfolioState={compatiblePortfolioState as any} // Type compatibility
      sandBoxPortfolio={[]} // Empty for Ringi context
      setSandBoxPortfolio={() => {}} // Not used in Ringi context
    />
  )
}
