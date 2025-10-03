"""
Stock Analysis Agent Handler
============================

Specific implementation for the stock analysis agent using the base agent system.
This handler only contains stock-specific logic while inheriting all common
infrastructure from BaseAgentHandler.
"""

from typing import Dict, Any
from shared.agent_base import BaseAgentHandler, AgentRequestContext, AgentConfig, AgentType
from agno.workflow.v2 import Workflow


class StockAnalysisAgentHandler(BaseAgentHandler):
    """Handler for stock analysis agent with specialized validation and state management"""
    
    async def validate_request(self, context: AgentRequestContext):
        """Validate stock analysis specific requirements"""
        # Check if user has provided investment parameters
        last_message = context.input_data.messages[-1]
        if not getattr(last_message, 'content', None):
            raise ValueError("No investment query provided")
        
        # Validate available cash
        available_cash = context.input_data.state.get("available_cash")
        if available_cash is not None and available_cash < 0:
            raise ValueError("Available cash cannot be negative")
    
    async def authenticate_request(self, context: AgentRequestContext):
        """Authenticate stock analysis requests"""
        # For now, no special authentication required
        # In production, you might check trading permissions, account limits, etc.
        pass
    
    def get_initial_state(self, context: AgentRequestContext, base_state: Dict[str, Any]) -> Dict[str, Any]:
        """Get initial state specific to stock analysis"""
        return {
            **base_state,
            "available_cash": context.input_data.state.get("available_cash", 100000),
            "investment_summary": context.input_data.state.get("investment_summary", {}),
            "investment_portfolio": context.input_data.state.get("investment_portfolio", []),
            "market_data": context.input_data.state.get("market_data", {}),
            "risk_preference": context.input_data.state.get("risk_preference", "moderate"),
        }
    
    def get_workflow_data(self, context: AgentRequestContext) -> Dict[str, Any]:
        """Get additional data to pass to the stock analysis workflow"""
        return {
            "available_cash": context.input_data.state.get("available_cash", 100000),
            "investment_portfolio": context.input_data.state.get("investment_portfolio", []),
            "market_conditions": context.input_data.state.get("market_conditions", {}),
            "user_preferences": {
                "risk_tolerance": context.input_data.state.get("risk_preference", "moderate"),
                "investment_horizon": context.input_data.state.get("investment_horizon", "long_term"),
            }
        }


def create_stock_agent_config(workflow: Workflow) -> AgentConfig:
    """Create configuration for the stock analysis agent"""
    return AgentConfig(
        name="Stock Analysis Agent",
        description="Comprehensive stock analysis with portfolio simulation and market insights",
        agent_type=AgentType.STOCK_ANALYSIS,
        route="/stock-reference",
        workflow=workflow,
        requires_auth=False,  # Set to True in production
        timeout_seconds=300,
        default_state={
            "available_cash": 100000,
            "investment_summary": {},
            "investment_portfolio": [],
            "risk_preference": "moderate",
        }
    )
