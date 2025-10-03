"""
Generic Agent Handler
=====================

Generic implementation for multi-purpose agents using the base agent system.
Handles various types of requests with model selection and tool execution.
"""

from typing import Dict, Any
from shared.agent_base import BaseAgentHandler, AgentRequestContext, AgentConfig, AgentType, get_agent_route
from shared.rate_limiter import RateLimitConfig
from agno.workflow.v2 import Workflow


class GenericAgentHandler(BaseAgentHandler):
    """Handler for generic agent with model selection and tool execution"""
    
    async def validate_request(self, context: AgentRequestContext):
        """Validate generic agent requirements"""
        # Check if user has provided a message
        last_message = context.input_data.messages[-1]
        if not getattr(last_message, 'content', None):
            raise ValueError("No message provided")
        
        # Validate selected model if provided
        selected_model = context.input_data.state.get("selected_model")
        if selected_model and selected_model not in ["gpt-4o-mini", "gpt-4o", "claude-3-sonnet"]:
            raise ValueError(f"Unsupported model: {selected_model}")
    
    async def authenticate_request(self, context: AgentRequestContext):
        """Authenticate generic agent requests"""
        # Generic agents typically don't require special authentication
        # But you can add model access controls here
        selected_model = context.input_data.state.get("selected_model", "gpt-4o-mini")
        
        # Example: Premium models require authentication
        if selected_model in ["gpt-4o", "claude-3-sonnet"] and not context.user_id:
            raise ValueError("Authentication required for premium models")
    
    def get_initial_state(self, context: AgentRequestContext, base_state: Dict[str, Any]) -> Dict[str, Any]:
        """Get initial state specific to generic agent"""
        return {
            **base_state,
            "selected_model": context.input_data.state.get("selected_model", "gpt-4o-mini"),
            "workflow_type": context.input_data.state.get("workflow_type", "chat"),
            "conversation_history": context.input_data.state.get("conversation_history", []),
            "available_tools": context.input_data.state.get("available_tools", []),
            "model_settings": {
                "temperature": context.input_data.state.get("temperature", 0.7),
                "max_tokens": context.input_data.state.get("max_tokens", 2000),
            }
        }
    
    def get_workflow_data(self, context: AgentRequestContext) -> Dict[str, Any]:
        """Get additional data to pass to the generic workflow"""
        return {
            "model_config": {
                "model": context.input_data.state.get("selected_model", "gpt-4o-mini"),
                "temperature": context.input_data.state.get("temperature", 0.7),
                "max_tokens": context.input_data.state.get("max_tokens", 2000),
            },
            "workflow_config": {
                "type": context.input_data.state.get("workflow_type", "chat"),
                "tools_enabled": bool(context.input_data.state.get("available_tools")),
            },
            "context": {
                "user_preferences": context.input_data.state.get("user_preferences", {}),
                "session_context": context.input_data.state.get("session_context", {}),
            }
        }


def create_generic_agent_config(workflow: Workflow) -> AgentConfig:
    """Create configuration for the generic agent"""
    return AgentConfig(
        name="Generic Agent",
        description="Multi-purpose agent with model selection and tool execution capabilities",
        agent_type=AgentType.GENERIC_CHAT,
        route=get_agent_route("generic-agent"),
        workflow=workflow,
        requires_auth=False,
        timeout_seconds=120,
        version="2.1.0",
        capabilities=[
            "multi-model-support",
            "file-processing",
            "workspace-management",
            "tool-execution",
            "conversation-management",
            "context-awareness"
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
                "name": "file_processor",
                "description": "Process and analyze uploaded files",
                "type": "function",
                "parameters": {
                    "file_path": {"type": "string", "description": "Path to file"},
                    "operation": {"type": "string", "description": "Processing operation"}
                }
            },
            {
                "name": "model_selector",
                "description": "Select and switch between different AI models",
                "type": "function",
                "parameters": {
                    "model_name": {"type": "string", "description": "Model to use"},
                    "parameters": {"type": "object", "description": "Model parameters"}
                }
            },
            {
                "name": "workspace_manager",
                "description": "Manage workspace and context",
                "type": "function",
                "parameters": {
                    "action": {"type": "string", "description": "Workspace action"},
                    "data": {"type": "object", "description": "Workspace data"}
                }
            }
        ],
        models=[
            {"name": "gpt-4o", "provider": "openai", "type": "chat", "purpose": "general"},
            {"name": "gpt-4o-mini", "provider": "openai", "type": "chat", "purpose": "fast"},
            {"name": "claude-3-sonnet", "provider": "anthropic", "type": "chat", "purpose": "analysis"},
            {"name": "claude-3-haiku", "provider": "anthropic", "type": "chat", "purpose": "quick"}
        ],
        tags=["general", "multi-model", "flexible", "conversation", "tools"],
        rate_limit_config=RateLimitConfig(
            requests_per_minute=60,  # Standard limit
            requests_per_hour=1000,
            requests_per_day=10000,
            burst_limit=10,
            enabled=True
        ),
        default_state={
            "selected_model": "gpt-4o-mini",
            "workflow_type": "chat",
            "conversation_history": [],
            "available_tools": [],
            "temperature": 0.7,
            "max_tokens": 2000,
        }
    )
