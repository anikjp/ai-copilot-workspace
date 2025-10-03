"""
Stock Analysis Agent Handler
============================

Specific implementation for the stock analysis agent using the base agent system.
This handler only contains stock-specific logic while inheriting all common
infrastructure from BaseAgentHandler.
"""

from typing import Dict, Any
import logging
from shared.agent_base import BaseAgentHandler, AgentRequestContext, AgentConfig, AgentType, get_agent_route
from shared.rate_limiter import RateLimitConfig
from agno.workflow.v2 import Workflow

logger = logging.getLogger(__name__)


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
        logger.info(f"🔐 Stock Agent authentication - User: {context.user_id}, Client: {context.client_id}")
        logger.info(f"🔐 Stock Agent authentication - Scope: {context.scope}")
        
        # For now, no special authentication required
        # In production, you might check trading permissions, account limits, etc.
        logger.info("🔐 Stock Agent authentication completed successfully")
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
        route=get_agent_route("stock-reference"),
        workflow=workflow,
        requires_auth=True,  # Authentication re-enabled
        timeout_seconds=300,
        version="2.1.0",
        capabilities=[
            "financial-analysis",
            "portfolio-simulation", 
            "market-data-access",
            "chart-generation",
            "risk-assessment",
            "investment-optimization"
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
                "name": "get_stock_data",
                "description": "Fetch real-time stock market data",
                "type": "function",
                "parameters": {
                    "symbol": {"type": "string", "description": "Stock symbol"},
                    "period": {"type": "string", "description": "Time period"}
                }
            },
            {
                "name": "calculate_portfolio_metrics",
                "description": "Calculate portfolio performance metrics",
                "type": "function",
                "parameters": {
                    "portfolio": {"type": "array", "description": "Portfolio holdings"}
                }
            },
            {
                "name": "generate_chart",
                "description": "Generate financial charts and visualizations",
                "type": "function",
                "parameters": {
                    "data": {"type": "object", "description": "Chart data"},
                    "chart_type": {"type": "string", "description": "Type of chart"}
                }
            }
        ],
        models=[
            {"name": "gpt-4o", "provider": "openai", "type": "chat", "purpose": "analysis"},
            {"name": "gpt-4o-mini", "provider": "openai", "type": "chat", "purpose": "quick_queries"}
        ],
        tags=["finance", "stocks", "portfolio", "analysis", "trading"],
        rate_limit_config=RateLimitConfig(
            requests_per_minute=30,  # Lower limit for financial data
            requests_per_hour=500,
            requests_per_day=5000,
            burst_limit=5,
            enabled=True
        ),
        default_state={
            "available_cash": 100000,
            "investment_summary": {},
            "investment_portfolio": [],
            "risk_preference": "moderate",
        }
    )
