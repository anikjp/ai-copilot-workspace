"""
Ringi System Agent Handler
==========================

Specific implementation for the Ringi system agent using the base agent system.
Handles collaborative decision-making workflows.
"""

from typing import Dict, Any
from shared.agent_base import BaseAgentHandler, AgentRequestContext, AgentConfig, AgentType, get_agent_route
from shared.rate_limiter import RateLimitConfig
from agno.workflow.v2 import Workflow


class RingiAgentHandler(BaseAgentHandler):
    """Handler for Ringi system agent with approval workflow management"""
    
    async def validate_request(self, context: AgentRequestContext):
        """Validate Ringi system specific requirements"""
        # Check if user has provided a decision request
        last_message = context.input_data.messages[-1]
        if not getattr(last_message, 'content', None):
            raise ValueError("No decision request provided")
        
        # Validate required fields for Ringi workflow
        required_fields = ["decision_type", "amount", "department"]
        for field in required_fields:
            if field not in context.input_data.state:
                raise ValueError(f"Missing required field: {field}")
    
    async def authenticate_request(self, context: AgentRequestContext):
        """Authenticate Ringi system requests"""
        # Check if user has approval permissions
        user_role = context.input_data.state.get("user_role")
        if not user_role:
            raise ValueError("User role required for Ringi system access")
        
        # Validate department permissions
        user_department = context.input_data.state.get("user_department")
        requested_department = context.input_data.state.get("department")
        
        if user_department != requested_department and user_role not in ["manager", "admin"]:
            raise ValueError("Insufficient permissions for cross-department requests")
    
    def get_initial_state(self, context: AgentRequestContext, base_state: Dict[str, Any]) -> Dict[str, Any]:
        """Get initial state specific to Ringi system"""
        return {
            **base_state,
            "decision_type": context.input_data.state.get("decision_type"),
            "amount": context.input_data.state.get("amount"),
            "department": context.input_data.state.get("department"),
            "user_role": context.input_data.state.get("user_role"),
            "approval_chain": context.input_data.state.get("approval_chain", []),
            "current_step": context.input_data.state.get("current_step", "initiation"),
        }
    
    def get_workflow_data(self, context: AgentRequestContext) -> Dict[str, Any]:
        """Get additional data to pass to the Ringi workflow"""
        return {
            "decision_context": {
                "type": context.input_data.state.get("decision_type"),
                "amount": context.input_data.state.get("amount"),
                "department": context.input_data.state.get("department"),
                "requester": context.user_id,
            },
            "approval_workflow": {
                "current_step": context.input_data.state.get("current_step", "initiation"),
                "chain": context.input_data.state.get("approval_chain", []),
                "user_role": context.input_data.state.get("user_role"),
            },
            "business_rules": {
                "approval_thresholds": context.input_data.state.get("approval_thresholds", {}),
                "department_policies": context.input_data.state.get("department_policies", {}),
            }
        }


def create_ringi_agent_config(workflow: Workflow) -> AgentConfig:
    """Create configuration for the Ringi system agent"""
    return AgentConfig(
        name="Ringi System Agent",
        description="Collaborative decision-making and approval workflow system",
        agent_type=AgentType.RINGI_SYSTEM,
        route=get_agent_route("ringi-system"),
        workflow=workflow,
        requires_auth=True,
        timeout_seconds=600,  # Longer timeout for complex approval workflows
        version="2.1.0",
        capabilities=[
            "approval-workflows",
            "stakeholder-management",
            "decision-tracking",
            "collaborative-decision-making",
            "workflow-automation",
            "audit-trail"
        ],
        supported_events=[
            "RUN_STARTED",
            "TEXT_MESSAGE_START",
            "TEXT_MESSAGE_CONTENT",
            "TEXT_MESSAGE_END",
            "TOOL_CALL_START",
            "TOOL_CALL_END",
            "STATE_DELTA",
            "STATE_SNAPSHOT",
            "RUN_FINISHED"
        ],
        tools=[
            {
                "name": "create_approval_request",
                "description": "Create a new approval request",
                "type": "function",
                "parameters": {
                    "request_type": {"type": "string", "description": "Type of approval request"},
                    "amount": {"type": "number", "description": "Requested amount"},
                    "department": {"type": "string", "description": "Requesting department"}
                }
            },
            {
                "name": "manage_stakeholders",
                "description": "Manage approval stakeholders and roles",
                "type": "function",
                "parameters": {
                    "action": {"type": "string", "description": "Stakeholder action"},
                    "stakeholder": {"type": "object", "description": "Stakeholder information"}
                }
            },
            {
                "name": "track_approval_status",
                "description": "Track and update approval status",
                "type": "function",
                "parameters": {
                    "request_id": {"type": "string", "description": "Approval request ID"},
                    "status": {"type": "string", "description": "New status"}
                }
            }
        ],
        models=[
            {"name": "gpt-4o", "provider": "openai", "type": "chat", "purpose": "workflow_management"},
            {"name": "claude-3-sonnet", "provider": "anthropic", "type": "chat", "purpose": "decision_analysis"}
        ],
        tags=["approval", "workflow", "collaboration", "decision-making", "enterprise"],
        rate_limit_config=RateLimitConfig(
            requests_per_minute=20,  # Lower limit for approval workflows
            requests_per_hour=300,
            requests_per_day=2000,
            burst_limit=3,
            enabled=True
        ),
        default_state={
            "decision_type": "expense",
            "amount": 0,
            "department": "",
            "user_role": "",
            "approval_chain": [],
            "current_step": "initiation",
        }
    )
