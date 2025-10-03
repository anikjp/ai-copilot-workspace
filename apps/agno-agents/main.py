"""
Working version of main_v2.py
"""

import os
import logging
from typing import List

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the base agent system
from shared.agent_base import agent_registry, AgentConfig, AgentType

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
        route="/bpp-assistant",
        workflow=bpp_assistant_workflow,
        requires_auth=False,
        timeout_seconds=180,
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
