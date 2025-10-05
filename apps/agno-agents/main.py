"""
Working version of main_v2.py with Discovery Endpoints

Features:
- AG-UI Protocol compliant agent system
- Discovery endpoints for agent metadata
- Centralized agent registry
- Real-time streaming with event-driven architecture
- Comprehensive logging and tracing
"""

import os
import logging
from typing import List

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

# Import the base agent system
from shared.agent_base import agent_registry, AgentConfig, AgentType, get_agent_route, get_agent_id_from_route
from shared.rate_limiter import rate_limiter, RateLimitConfig, RateLimitType
# OAuth functionality removed - using Clerk authentication only

# Note: Organization management moved to auth-service
# This service now focuses only on AI agent implementations

# Import agent workflows
from agents.stock_agent.agent import stock_analysis_workflow
from agents.ringi_agent import ringi_workflow
from agents.bpp_agent import bpp_assistant_workflow
from agents.generic_agent import generic_agent_workflow

# Import agent handlers
from agents.stock_agent.handler import StockAnalysisAgentHandler, create_stock_agent_config
from agents.ringi_agent.handler import RingiAgentHandler, create_ringi_agent_config
from agents.generic_agent.handler import GenericAgentHandler, create_generic_agent_config

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("agno_agents_v2.log"),
    ],
)
logger = logging.getLogger(__name__)


class Config:
    """Application configuration"""
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

config = Config()

# Initialize FastAPI application
app = FastAPI(
    title="Agno Agents API V2",
    description="AI Agents with unified base system - Simplified and Scalable",
    version="2.0.0",
    docs_url="/docs" if config.DEBUG else None,
    redoc_url="/redoc" if config.DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Note: Organization management router removed - now handled by auth-service


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/health")
async def system_health():
    """
    Get overall system health status.
    
    Returns comprehensive health information including all agents,
    dependencies, and system metrics.
    """
    try:
        health_data = agent_registry.get_system_health()
        
        # Add system-level information
        health_data.update({
            "service": "Agno Agents API",
            "version": "2.1.0",
            "environment": "development" if config.DEBUG else "production",
            "protocol": "AG-UI",
            "endpoints": {
                "discovery": "/.well-known/agents",
                "agent_metadata": "/.well-known/{agentId}/agent.json",
                "health": "/health",
                "agent_health": "/agents/{agentId}/health"
            }
        })
        
        # Determine HTTP status code based on system health
        status_code = 200
        if health_data["system_status"] == "degraded":
            status_code = 207  # Multi-Status
        elif health_data["system_status"] == "unhealthy":
            status_code = 503  # Service Unavailable
        
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "system_status": "unhealthy",
            "error": str(e),
            "timestamp": agent_registry._get_current_timestamp(),
            "service": "Agno Agents API",
            "version": "2.1.0"
        }

@app.get("/agents/{agent_id}/health")
async def agent_health(agent_id: str):
    """
    Get health status for a specific agent.
    
    Returns detailed health information for the specified agent including
    performance metrics, dependencies, and recent errors.
    """
    try:
        # Get agent from registry
        agent_route = get_agent_route(agent_id)
        agent = agent_registry.get_agent(agent_route)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        health_data = agent.get_health_status()
        
        # Add agent-specific endpoints
        health_data["endpoints"] = {
            "run": agent_route,
            "stream": f"{agent_route}/stream",
            "health": f"/agents/{agent_id}/health",
            "metadata": f"/.well-known/{agent_id}/agent.json"
        }
        
        # Determine HTTP status code based on agent health
        status_code = 200
        if health_data["status"] == "unhealthy":
            status_code = 503  # Service Unavailable
        elif health_data.get("dependencies", {}).get("overall", {}).get("status") == "degraded":
            status_code = 207  # Multi-Status
        
        return health_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent health check failed for {agent_id}: {e}")
        return {
            "agent_id": agent_id,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": agent_registry._get_current_timestamp()
        }

@app.get("/health/ready")
async def readiness_check():
    """
    Kubernetes readiness probe endpoint.
    
    Returns 200 if the system is ready to accept traffic,
    503 if not ready.
    """
    try:
        health_data = agent_registry.get_system_health()
        
        # System is ready if at least one agent is healthy
        is_ready = health_data["healthy_agents"] > 0
        
        if is_ready:
            return {
                "status": "ready",
                "healthy_agents": health_data["healthy_agents"],
                "total_agents": health_data["total_agents"],
                "timestamp": health_data["timestamp"]
            }
        else:
            return {
                "status": "not_ready",
                "reason": "No healthy agents available",
                "timestamp": health_data["timestamp"]
            }
            
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "status": "not_ready",
            "reason": str(e),
            "timestamp": agent_registry._get_current_timestamp()
        }

@app.get("/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe endpoint.
    
    Returns 200 if the system is alive and running,
    503 if the system should be restarted.
    """
    try:
        # Basic liveness check - system is alive if it can respond
        return {
            "status": "alive",
            "timestamp": agent_registry._get_current_timestamp(),
            "uptime": agent_registry._get_system_uptime()
        }
        
    except Exception as e:
        logger.error(f"Liveness check failed: {e}")
        return {
            "status": "dead",
            "reason": str(e),
            "timestamp": agent_registry._get_current_timestamp()
        }

# ============================================================================
# RATE LIMITING ENDPOINTS
# ============================================================================

@app.get("/rate-limits/{agent_id}")
async def get_agent_rate_limits(agent_id: str):
    """
    Get current rate limit status for a specific agent.
    
    Returns current rate limit usage and remaining capacity.
    """
    try:
        # Get agent from registry
        agent_route = get_agent_route(agent_id)
        agent = agent_registry.get_agent(agent_route)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        if not agent.config.rate_limit_config:
            return {
                "agent_id": agent_id,
                "rate_limiting": "disabled",
                "message": "Rate limiting not configured for this agent"
            }
        
        # Get rate limit status for different limit types
        status = {
            "agent_id": agent_id,
            "rate_limiting": "enabled",
            "config": {
                "requests_per_minute": agent.config.rate_limit_config.requests_per_minute,
                "requests_per_hour": agent.config.rate_limit_config.requests_per_hour,
                "requests_per_day": agent.config.rate_limit_config.requests_per_day,
                "burst_limit": agent.config.rate_limit_config.burst_limit
            },
            "limits": {}
        }
        
        # Get status for different limit types
        for limit_type in [RateLimitType.USER, RateLimitType.IP, RateLimitType.AGENT]:
            try:
                limit_status = await rate_limiter.get_rate_limit_status(
                    limit_type,
                    agent_id if limit_type == RateLimitType.AGENT else "example",
                    agent.config.rate_limit_config
                )
                status["limits"][limit_type.value] = limit_status
            except Exception as e:
                status["limits"][limit_type.value] = {"error": str(e)}
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate limit status check failed for {agent_id}: {e}")
        return {
            "agent_id": agent_id,
            "error": str(e),
            "timestamp": agent_registry._get_current_timestamp()
        }

@app.get("/rate-limits")
async def get_all_rate_limits():
    """
    Get rate limit status for all agents.
    
    Returns comprehensive rate limit information for all configured agents.
    """
    try:
        agents_status = {}
        
        for route, config in agent_registry.configs.items():
            agent_id = get_agent_id_from_route(route)
            
            if not config.rate_limit_config:
                agents_status[agent_id] = {
                    "rate_limiting": "disabled",
                    "message": "Rate limiting not configured"
                }
                continue
            
            try:
                # Get agent-specific rate limit status
                agent_status = await rate_limiter.get_rate_limit_status(
                    RateLimitType.AGENT,
                    agent_id,
                    config.rate_limit_config
                )
                
                agents_status[agent_id] = {
                    "rate_limiting": "enabled",
                    "config": {
                        "requests_per_minute": config.rate_limit_config.requests_per_minute,
                        "requests_per_hour": config.rate_limit_config.requests_per_hour,
                        "requests_per_day": config.rate_limit_config.requests_per_day,
                        "burst_limit": config.rate_limit_config.burst_limit
                    },
                    "current_usage": agent_status
                }
            except Exception as e:
                agents_status[agent_id] = {
                    "rate_limiting": "error",
                    "error": str(e)
                }
        
        return {
            "agents": agents_status,
            "total_agents": len(agents_status),
            "timestamp": agent_registry._get_current_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Rate limits status check failed: {e}")
        return {
            "error": str(e),
            "timestamp": agent_registry._get_current_timestamp()
        }

# ============================================================================
# DISCOVERY ENDPOINTS (AG-UI Protocol Compliance)
# ============================================================================

@app.get("/.well-known/{agent_id}/agent.json")
async def get_agent_metadata(agent_id: str):
    """
    Provide agent metadata for discovery following AG-UI standards.
    
    This endpoint allows clients to discover agent capabilities, endpoints,
    and supported events dynamically.
    """
    
    # Get agent from registry
    agent_route = get_agent_route(agent_id)
    agent = agent_registry.get_agent(agent_route)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    config = agent_registry.configs.get(agent_route)
    
    # Get dynamic metadata from the agent
    dynamic_metadata = agent.get_dynamic_metadata()
    
    # Build base metadata
    metadata = {
        "agentId": agent_id,
        "name": config.name,
        "description": config.description,
        "version": config.version,
        "agentType": config.agent_type.value,
        "protocol": "AG-UI",
        "protocolVersion": "1.0.0",
        "lastUpdated": dynamic_metadata["last_updated"],
        "status": dynamic_metadata["status"]
    }
    
    # Add dynamic capabilities
    metadata["capabilities"] = dynamic_metadata["capabilities"]
    
    # Add supported events
    metadata["supportedEvents"] = dynamic_metadata["supported_events"]
    
    # Add tools if available
    if dynamic_metadata["tools"]:
        metadata["tools"] = dynamic_metadata["tools"]
    
    # Add models if available
    if dynamic_metadata["models"]:
        metadata["models"] = dynamic_metadata["models"]
    
    # Add endpoints
    metadata["endpoints"] = {
        "run": config.route,
        "stream": f"{config.route}/stream",
        "health": f"/agents/{agent_id}/health",
        "metadata": f"/.well-known/{agent_id}/agent.json"
    }
    
    # Add authentication info
    metadata["authentication"] = {
        "methods": ["header"] + (["oauth2"] if config.requires_auth else []),
        "required": config.requires_auth,
        "headers": ["X-User-ID", "X-Session-ID"] if config.requires_auth else []
    }
    
    # Add configuration
    metadata["configuration"] = {
        "timeout": config.timeout_seconds,
        "rateLimit": config.rate_limit,
        "defaultState": config.default_state is not None
    }
    
    # Add uptime if available
    if dynamic_metadata["uptime"]:
        metadata["uptime"] = dynamic_metadata["uptime"]
    
    # Add tags if available
    if config.tags:
        metadata["tags"] = config.tags
    
    return metadata

@app.get("/.well-known/agents")
async def list_all_agents():
    """
    List all available agents for discovery.
    
    This endpoint provides a registry of all available agents
    for dynamic discovery and integration.
    """
    
    agents = []
    for route, config in agent_registry.configs.items():
        agent_id = get_agent_id_from_route(route)
        agents.append({
            "agentId": agent_id,
            "name": config.name,
            "description": config.description,
            "route": route,
            "agentType": config.agent_type.value,
            "requiresAuth": config.requires_auth
        })
    
    return {
        "agents": agents,
        "total": len(agents),
        "protocol": "AG-UI",
        "version": "2.0.0"
    }


# ============================================================================
# AGENT SETUP
# ============================================================================

def setup_agents():
    """Setup all agents using the base agent system"""
    
    # Stock Analysis Agent
    stock_config = create_stock_agent_config(stock_analysis_workflow)
    agent_registry.register_agent(stock_config, StockAnalysisAgentHandler)
    
    # Ringi System Agent
    ringi_config = create_ringi_agent_config(ringi_workflow)
    agent_registry.register_agent(ringi_config, RingiAgentHandler)
    
    # Generic Agent
    generic_config = create_generic_agent_config(generic_agent_workflow)
    agent_registry.register_agent(generic_config, GenericAgentHandler)
    
    # BPP Agent (using generic handler for now)
    bpp_config = AgentConfig(
        name="BPP Assistant Agent",
        description="Business Process Platform AI Assistant",
        agent_type=AgentType.CUSTOM,
        route=get_agent_route("bpp-assistant"),
        workflow=bpp_assistant_workflow,
        requires_auth=False,
        timeout_seconds=180,
        version="2.1.0",
        capabilities=[
            "business-process-automation",
            "workflow-management",
            "data-integration",
            "process-optimization",
            "compliance-tracking",
            "reporting"
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
                "name": "process_analyzer",
                "description": "Analyze business processes and workflows",
                "type": "function",
                "parameters": {
                    "process_id": {"type": "string", "description": "Process identifier"},
                    "analysis_type": {"type": "string", "description": "Type of analysis"}
                }
            },
            {
                "name": "workflow_optimizer",
                "description": "Optimize business workflows",
                "type": "function",
                "parameters": {
                    "workflow_data": {"type": "object", "description": "Workflow data"},
                    "optimization_goals": {"type": "array", "description": "Optimization objectives"}
                }
            }
        ],
        models=[
            {"name": "gpt-4o", "provider": "openai", "type": "chat", "purpose": "business_analysis"},
            {"name": "claude-3-sonnet", "provider": "anthropic", "type": "chat", "purpose": "process_optimization"}
        ],
        tags=["bpp", "business-process", "automation", "workflow", "enterprise"],
        rate_limit_config=RateLimitConfig(
            requests_per_minute=40,  # Medium limit for business processes
            requests_per_hour=600,
            requests_per_day=5000,
            burst_limit=8,
            enabled=True
        )
    )
    agent_registry.register_agent(bpp_config, GenericAgentHandler)
    
    logger.info(f"🚀 Setup complete! Registered {len(agent_registry.get_all_routes())} agents")


def main():
    """Run the uvicorn server"""
    # Setup all agents
    setup_agents()
    
    # Setup FastAPI routes for all agents
    agent_registry.setup_fastapi_routes(app)
    
    # Log all available routes
    routes = agent_registry.get_all_routes()
    logger.info(f"📡 Available agent routes: {routes}")
    
    # Check what routes were actually created
    app_routes = [route.path for route in app.routes if hasattr(route, 'path')]
    logger.info(f"🔗 FastAPI routes created: {app_routes}")
    
    # Check OpenAPI schema
    openapi = app.openapi()
    paths = list(openapi.get('paths', {}).keys())
    logger.info(f"📋 OpenAPI paths: {paths}")
    
    if not paths:
        logger.error("❌ No routes found in OpenAPI schema! Server may not work properly.")
    
    logger.info(f"🚀 Starting server on {config.HOST}:{config.PORT}")
    
    uvicorn.run(
        app,  # Pass app directly instead of string
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info" if config.DEBUG else "warning",
    )


if __name__ == "__main__":
    main()
