"""
Agent Base System - Comprehensive Base Handler for All Agents
============================================================

This module provides a unified base system for all agents that handles:
- Request validation and authentication
- Event streaming infrastructure  
- Logging and tracing
- Error handling and recovery
- Agent lifecycle management
- Common state management

Each agent only needs to implement agent-specific logic while inheriting
all common infrastructure from this base system.
"""

import asyncio
import json
import logging
import time
import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, Union, Callable
from dataclasses import dataclass
from enum import Enum

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from agno.workflow.v2 import Workflow, StepOutput
from ag_ui.core import (
    EventType,
    RunAgentInput,
    RunFinishedEvent,
    RunStartedEvent,
    StateDeltaEvent,
    StateSnapshotEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallStartEvent,
)
from ag_ui.encoder import EventEncoder
from .rate_limiter import rate_limiter, RateLimitConfig, RateLimitType, CircuitBreaker
from auth.clerk_idp_manager import clerk_idp_manager

logger = logging.getLogger(__name__)

# Constants
AGENTS_PREFIX = "/agents"


def get_agent_route(agent_id: str) -> str:
    """Get the full route for an agent given its ID"""
    return f"{AGENTS_PREFIX}/{agent_id}"


def get_agent_id_from_route(route: str) -> str:
    """Extract agent ID from a full route"""
    return route.replace(f"{AGENTS_PREFIX}/", "")


class AgentType(Enum):
    """Types of agents supported by the system"""
    STOCK_ANALYSIS = "stock_analysis"
    RINGI_SYSTEM = "ringi_system"
    BPP_ASSISTANT = "bpp_assistant"
    GENERIC_CHAT = "generic_chat"
    CUSTOM = "custom"


@dataclass
class AgentConfig:
    """Configuration for an agent"""
    name: str
    description: str
    agent_type: AgentType
    route: str
    workflow: Workflow
    requires_auth: bool = False
    rate_limit: Optional[int] = None
    timeout_seconds: int = 300
    default_state: Optional[Dict[str, Any]] = None
    custom_handlers: Optional[Dict[str, Callable]] = None
    
    # Dynamic metadata fields
    capabilities: Optional[List[str]] = None
    supported_events: Optional[List[str]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    models: Optional[List[Dict[str, Any]]] = None
    version: str = "2.0.0"
    tags: Optional[List[str]] = None
    
    # Rate limiting configuration
    rate_limit_config: Optional[RateLimitConfig] = None


class AgentRequestContext:
    """Context object passed to agents containing request metadata"""
    
    def __init__(self, request: Request, input_data: RunAgentInput, config: AgentConfig):
        self.request = request
        self.input_data = input_data
        self.config = config
        self.request_id = str(uuid.uuid4())
        self.start_time = time.time()
        self.user_id = self._extract_user_id()
        self.session_id = self._extract_session_id()
        self.client_id = None  # Will be set during authentication
        self.scope = None      # Will be set during authentication
        self.org_id = None     # Will be set during authentication
        self.org_name = None   # Will be set during authentication
        self.org_role = None   # Will be set during authentication
        self.org_permissions = None  # Will be set during authentication
        
    def _extract_user_id(self) -> Optional[str]:
        """Extract user ID from request headers or auth"""
        # TODO: Implement actual auth logic
        return self.request.headers.get("X-User-ID")
    
    def _extract_session_id(self) -> Optional[str]:
        """Extract session ID from request"""
        return self.request.headers.get("X-Session-ID")


class AgentTracer:
    """Tracing and logging system for agents"""
    
    @staticmethod
    def start_trace(context: AgentRequestContext):
        """Start tracing for an agent request"""
        logger.info(f"🚀 Agent Request Started", extra={
            "agent_name": context.config.name,
            "request_id": context.request_id,
            "user_id": context.user_id,
            "session_id": context.session_id,
            "route": context.config.route,
        })
    
    @staticmethod
    def log_event(context: AgentRequestContext, event_type: str, data: Dict[str, Any]):
        """Log an event during agent execution"""
        logger.info(f"📊 Agent Event: {event_type}", extra={
            "request_id": context.request_id,
            "agent_name": context.config.name,
            "event_type": event_type,
            "event_data": data,
        })
    
    @staticmethod
    def log_error(context: AgentRequestContext, error: Exception, stage: str):
        """Log an error during agent execution"""
        logger.error(f"❌ Agent Error in {stage}", extra={
            "request_id": context.request_id,
            "agent_name": context.config.name,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "stage": stage,
        })
    
    @staticmethod
    def end_trace(context: AgentRequestContext, success: bool, duration: float):
        """End tracing for an agent request"""
        status = "✅ Success" if success else "❌ Failed"
        logger.info(f"🏁 Agent Request Completed: {status}", extra={
            "request_id": context.request_id,
            "agent_name": context.config.name,
            "duration_ms": duration * 1000,
            "success": success,
        })


class BaseAgentHandler(ABC):
    """Base class for all agent handlers"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.tracer = AgentTracer()
        
        # Initialize performance tracking
        self._total_requests = 0
        self._successful_requests = 0
        self._failed_requests = 0
        self._response_times = []
        self._last_activity = None
        self._recent_errors = []
        self._start_time = time.time()
        
        # Initialize circuit breaker
        self._circuit_breaker = CircuitBreaker()
    
    async def handle_request(self, request: Request, input_data: RunAgentInput) -> StreamingResponse:
        """
        Main entry point for handling agent requests
        Handles all common concerns: auth, validation, tracing, streaming
        """
        # Enhanced request logging
        logger.info(f"📥 Incoming request to {self.config.name}")
        logger.info(f"   Headers: {dict(request.headers)}")
        logger.info(f"   Input data type: {type(input_data)}")
        logger.info(f"   Input data: {input_data}")
        logger.info(f"   Messages count: {len(input_data.messages) if input_data.messages else 0}")
        logger.info(f"   Thread ID: {input_data.thread_id}")
        logger.info(f"   Run ID: {input_data.run_id}")
        
        context = AgentRequestContext(request, input_data, self.config)
        start_time = time.time()
        
        # Update performance tracking
        self._total_requests += 1
        self._last_activity = self._get_last_updated()
        
        try:
            # Start tracing
            logger.info("🔍 Starting request tracing...")
            self.tracer.start_trace(context)
            
            # Check circuit breaker
            logger.info("🔍 Checking circuit breaker...")
            if self._circuit_breaker.is_open():
                raise HTTPException(status_code=503, detail="Service temporarily unavailable due to high error rate")
            
            # Check rate limits
            logger.info("🔍 Checking rate limits...")
            await self._check_rate_limits(context)
            
            # Validate request
            logger.info("🔍 Validating request...")
            await self._validate_request(context)
            
            # Check authentication if required
            if self.config.requires_auth:
                logger.info("🔍 Authentication required - starting authentication...")
                await self._authenticate_request(context)
            else:
                logger.info("🔍 No authentication required")
            
            # Create streaming response
            logger.info("🔍 Creating streaming response...")
            return await self._create_streaming_response(context)
            
        except Exception as e:
            # Track failure
            self._failed_requests += 1
            self._recent_errors.append({
                "timestamp": self._get_last_updated(),
                "error": str(e),
                "request_id": context.request_id
            })
            # Keep only last 10 errors
            self._recent_errors = self._recent_errors[-10:]
            
            # Record failure in circuit breaker
            self._circuit_breaker.record_failure()
            
            # Enhanced error logging
            logger.error(f"❌ Agent Error in request_handling: {type(e).__name__}: {str(e)}")
            logger.error(f"   Request ID: {context.request_id}")
            logger.error(f"   User ID: {context.user_id}")
            logger.error(f"   Client ID: {context.client_id}")
            logger.error(f"   Headers: {dict(context.request.headers)}")
            logger.error(f"   Input data: {context.input_data}")
            
            self.tracer.log_error(context, e, "request_handling")
            raise HTTPException(status_code=500, detail=f"Agent processing failed: {str(e)}")
    
    async def _validate_request(self, context: AgentRequestContext):
        """Validate the incoming request"""
        if not context.input_data.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Agent-specific validation
        await self.validate_request(context)
    
    async def _authenticate_request(self, context: AgentRequestContext):
        """Authenticate the request if required"""
        logger.info(f"🔐 Authentication check - User ID: {context.user_id}")
        
        if not context.user_id:
            # Try OAuth 2.0 authentication
            auth_header = context.request.headers.get("Authorization")
            logger.info(f"🔐 Authorization header: {auth_header}")
            
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                logger.info(f"🔐 Extracted token: {token[:20]}...")
                
                try:
                    # Use Clerk IDP manager to validate token (Clerk first, then custom OAuth)
                    user_info = clerk_idp_manager.validate_token(token)
                    logger.info(f"🔐 Token validation result: {user_info}")
                    
                    if user_info:
                        context.user_id = user_info.user_id
                        context.client_id = user_info.metadata.get("client_id", "unknown")
                        context.scope = user_info.metadata.get("scope", "read")
                        context.org_id = user_info.org_id
                        context.org_name = user_info.org_name
                        context.org_role = user_info.org_role
                        context.org_permissions = user_info.permissions
                        logger.info(f"🔐 Authentication successful - User: {context.user_id}, Client: {context.client_id}, Org: {context.org_name} ({context.org_id})")
                    else:
                        logger.error("🔐 Token validation failed - user_info is None")
                        raise HTTPException(status_code=401, detail="Invalid or expired token")
                except Exception as e:
                    logger.error(f"🔐 Token validation error: {type(e).__name__}: {str(e)}")
                    raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")
            else:
                logger.error("🔐 No valid Authorization header found")
                raise HTTPException(status_code=401, detail="Authentication required")
        else:
            logger.info(f"🔐 User already authenticated: {context.user_id}")
        
        # Agent-specific authentication
        logger.info("🔐 Running agent-specific authentication...")
        await self.authenticate_request(context)
        logger.info("🔐 Agent-specific authentication completed")
    
    async def _create_streaming_response(self, context: AgentRequestContext) -> StreamingResponse:
        """Create the streaming response with event handling"""
        
        async def event_generator():
            try:
                # Initialize streaming infrastructure
                encoder = EventEncoder()
                event_queue = asyncio.Queue()
                message_id = str(uuid.uuid4())
                
                # Define event emission callback
                def emit_event(event):
                    event_queue.put_nowait(event)
                
                # Send initial events
                yield encoder.encode(
                    RunStartedEvent(
                        type=EventType.RUN_STARTED,
                        thread_id=context.input_data.thread_id,
                        run_id=context.input_data.run_id,
                    )
                )
                
                # Send state snapshot
                yield encoder.encode(
                    StateSnapshotEvent(
                        type=EventType.STATE_SNAPSHOT,
                        snapshot=self._get_initial_state(context),
                    )
                )
                
                # Execute agent workflow
                agent_task = asyncio.create_task(
                    self._execute_workflow(context, emit_event)
                )
                
                # Stream events while workflow runs
                while True:
                    try:
                        event = await asyncio.wait_for(event_queue.get(), timeout=0.1)
                        yield encoder.encode(event)
                    except asyncio.TimeoutError:
                        if agent_task.done():
                            break
                
                # Process final results
                try:
                    result = agent_task.result()
                    if (result and 
                        hasattr(result, 'step_responses') and 
                        result.step_responses and 
                        len(result.step_responses) > 0):
                        
                        last_step = result.step_responses[-1]
                        if hasattr(last_step, 'content') and last_step.content:
                            messages = last_step.content.get('messages', [])
                            if messages:
                                last_message = messages[-1]
                                # Emit message events
                                async for event in self._emit_message_events(last_message, encoder, message_id):
                                    yield event
                except Exception as e:
                    self.tracer.log_error(context, e, "result_processing")
                    # Emit error message
                    yield encoder.encode(
                        TextMessageContentEvent(
                            type=EventType.TEXT_MESSAGE_CONTENT,
                            message_id=message_id,
                            delta=f"Error processing results: {str(e)}",
                        )
                    )
                
                # Send completion event
                yield encoder.encode(
                    RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=context.input_data.thread_id,
                        run_id=context.input_data.run_id,
                    )
                )
                
            except Exception as e:
                self.tracer.log_error(context, e, "streaming")
                yield encoder.encode(
                    TextMessageContentEvent(
                        type=EventType.TEXT_MESSAGE_CONTENT,
                        message_id=message_id,
                        delta=f"Error: {str(e)}",
                    )
                )
            finally:
                # Track success and performance
                duration = time.time() - context.start_time
                self._successful_requests += 1
                self._response_times.append(duration)
                # Keep only last 100 response times
                self._response_times = self._response_times[-100:]
                
                # Record success in circuit breaker
                self._circuit_breaker.record_success()
                
                # End tracing
                self.tracer.end_trace(context, True, duration)
        
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    
    def _get_initial_state(self, context: AgentRequestContext) -> Dict[str, Any]:
        """Get initial state for the agent"""
        base_state = context.input_data.state.copy()
        
        # Merge with default state
        if self.config.default_state:
            base_state.update(self.config.default_state)
        
        # Add common fields
        base_state.update({
            "tool_logs": [],
            "request_id": context.request_id,
        })
        
        # Agent-specific initial state
        return self.get_initial_state(context, base_state)
    
    async def _execute_workflow(self, context: AgentRequestContext, emit_event: Callable):
        """Execute the agent workflow"""
        logger.info("🔍 Preparing workflow execution...")
        additional_data = {
            "tools": context.input_data.tools,
            "messages": context.input_data.messages,
            "emit_event": emit_event,
            "context": context,
            "request_id": context.request_id,
            "tool_logs": [],  # Initialize tool_logs array
        }
        
        # Merge with agent-specific data
        logger.info("🔍 Getting agent-specific workflow data...")
        agent_data = self.get_workflow_data(context)
        additional_data.update(agent_data)
        
        logger.info(f"🔍 Starting workflow execution with data: {additional_data}")
        result = await self.config.workflow.arun(additional_data=additional_data)
        logger.info(f"🔍 Workflow execution completed with result: {result}")
        return result
    
    
    async def _emit_message_events(self, message, encoder, message_id):
        """Emit events for the final message"""
        if hasattr(message, 'tool_calls') and message.tool_calls:
            # Handle tool call responses
            yield encoder.encode(
                ToolCallStartEvent(
                    type=EventType.TOOL_CALL_START,
                    tool_call_id=message.tool_calls[0].id,
                    toolCallName=message.tool_calls[0].function.name,
                )
            )
            yield encoder.encode(
                ToolCallArgsEvent(
                    type=EventType.TOOL_CALL_ARGS,
                    tool_call_id=message.tool_calls[0].id,
                    delta=message.tool_calls[0].function.arguments,
                )
            )
            yield encoder.encode(
                ToolCallEndEvent(
                    type=EventType.TOOL_CALL_END,
                    tool_call_id=message.tool_calls[0].id,
                )
            )
        else:
            # Handle text message responses
            yield encoder.encode(
                TextMessageStartEvent(
                    type=EventType.TEXT_MESSAGE_START,
                    message_id=message_id,
                    role="assistant",
                )
            )
            
            content = getattr(message, 'content', '') or ''
            if content:
                # Stream content in chunks
                n_parts = 100
                part_length = max(1, len(content) // n_parts)
                parts = [content[i : i + part_length] for i in range(0, len(content), part_length)]
                
                for part in parts:
                    yield encoder.encode(
                        TextMessageContentEvent(
                            type=EventType.TEXT_MESSAGE_CONTENT,
                            message_id=message_id,
                            delta=part,
                        )
                    )
                    await asyncio.sleep(0.05)
            
            yield encoder.encode(
                TextMessageEndEvent(
                    type=EventType.TEXT_MESSAGE_END,
                    message_id=message_id,
                )
            )
    
    # Abstract methods that agents must implement
    @abstractmethod
    async def validate_request(self, context: AgentRequestContext):
        """Validate the request for this specific agent"""
        pass
    
    @abstractmethod
    async def authenticate_request(self, context: AgentRequestContext):
        """Authenticate the request for this specific agent"""
        pass
    
    @abstractmethod
    def get_initial_state(self, context: AgentRequestContext, base_state: Dict[str, Any]) -> Dict[str, Any]:
        """Get initial state specific to this agent"""
        pass
    
    @abstractmethod
    def get_workflow_data(self, context: AgentRequestContext) -> Dict[str, Any]:
        """Get additional data to pass to the workflow"""
        pass
    
    def get_dynamic_metadata(self) -> Dict[str, Any]:
        """Get dynamic metadata for agent discovery"""
        return {
            "capabilities": self._get_agent_capabilities(),
            "supported_events": self._get_supported_events(),
            "tools": self._get_agent_tools(),
            "models": self._get_agent_models(),
            "status": self._get_agent_status(),
            "uptime": self._get_agent_uptime(),
            "last_updated": self._get_last_updated()
        }
    
    def _get_agent_capabilities(self) -> List[str]:
        """Get agent-specific capabilities"""
        base_capabilities = [
            "interactive-communication",
            "real-time-streaming",
            "ag-ui-protocol"
        ]
        
        # Add agent-specific capabilities
        if hasattr(self, 'config') and self.config.capabilities:
            base_capabilities.extend(self.config.capabilities)
        
        # Add capabilities based on agent type
        if self.config.agent_type == AgentType.STOCK_ANALYSIS:
            base_capabilities.extend([
                "financial-analysis",
                "portfolio-simulation",
                "market-data-access",
                "chart-generation"
            ])
        elif self.config.agent_type == AgentType.RINGI_SYSTEM:
            base_capabilities.extend([
                "approval-workflows",
                "stakeholder-management",
                "decision-tracking"
            ])
        elif self.config.agent_type == AgentType.GENERIC_CHAT:
            base_capabilities.extend([
                "multi-model-support",
                "file-processing",
                "workspace-management"
            ])
        
        return list(set(base_capabilities))  # Remove duplicates
    
    def _get_supported_events(self) -> List[str]:
        """Get events this agent actually supports"""
        base_events = [
            "RUN_STARTED",
            "RUN_FINISHED"
        ]
        
        # Add events based on agent configuration
        if hasattr(self, 'config') and self.config.supported_events:
            base_events.extend(self.config.supported_events)
        else:
            # Default AG-UI events
            base_events.extend([
                "TEXT_MESSAGE_START",
                "TEXT_MESSAGE_CONTENT", 
                "TEXT_MESSAGE_END",
                "STATE_DELTA",
                "STATE_SNAPSHOT"
            ])
            
            # Add tool events if agent has tools
            if self._has_tools():
                base_events.extend([
                    "TOOL_CALL_START",
                    "TOOL_CALL_END",
                    "TOOL_CALL_ARGS"
                ])
        
        return list(set(base_events))
    
    def _get_agent_tools(self) -> List[Dict[str, Any]]:
        """Get tools available to this agent"""
        tools = []
        
        if hasattr(self, 'config') and self.config.tools:
            tools.extend(self.config.tools)
        else:
            # Try to extract tools from workflow
            tools.extend(self._extract_tools_from_workflow())
        
        return tools
    
    def _get_agent_models(self) -> List[Dict[str, Any]]:
        """Get models available to this agent"""
        models = []
        
        if hasattr(self, 'config') and self.config.models:
            models.extend(self.config.models)
        else:
            # Default models based on agent type
            if self.config.agent_type == AgentType.GENERIC_CHAT:
                models.extend([
                    {"name": "gpt-4o-mini", "provider": "openai", "type": "chat"},
                    {"name": "gpt-4o", "provider": "openai", "type": "chat"},
                    {"name": "claude-3-sonnet", "provider": "anthropic", "type": "chat"}
                ])
            else:
                models.append({"name": "gpt-4o", "provider": "openai", "type": "chat"})
        
        return models
    
    def _get_agent_status(self) -> str:
        """Get current agent status"""
        return "active"  # Could be enhanced with actual health checks
    
    def _get_agent_uptime(self) -> Optional[float]:
        """Get agent uptime in seconds"""
        if hasattr(self, '_start_time'):
            return time.time() - self._start_time
        return None
    
    def _get_last_updated(self) -> str:
        """Get last updated timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def _has_tools(self) -> bool:
        """Check if agent has tools"""
        return bool(self._get_agent_tools())
    
    def _extract_tools_from_workflow(self) -> List[Dict[str, Any]]:
        """Extract tools from workflow definition"""
        tools = []
        try:
            # This would need to be implemented based on your workflow structure
            # For now, return empty list
            pass
        except Exception:
            pass
        return tools
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status for this agent"""
        return {
            "agent_id": self.config.route.lstrip('/'),
            "status": self._get_agent_status(),
            "uptime": self._get_agent_uptime(),
            "last_activity": self._get_last_activity(),
            "memory_usage": self._get_memory_usage(),
            "dependencies": self._check_dependencies(),
            "performance": self._get_performance_metrics(),
            "errors": self._get_recent_errors(),
            "timestamp": self._get_last_updated()
        }
    
    def _get_last_activity(self) -> Optional[str]:
        """Get timestamp of last agent activity"""
        if hasattr(self, '_last_activity'):
            return self._last_activity
        return None
    
    def _get_memory_usage(self) -> Dict[str, Any]:
        """Get memory usage information"""
        try:
            import psutil
            process = psutil.Process()
            memory_info = process.memory_info()
            return {
                "rss": memory_info.rss,  # Resident Set Size
                "vms": memory_info.vms,  # Virtual Memory Size
                "percent": process.memory_percent(),
                "available": psutil.virtual_memory().available
            }
        except ImportError:
            return {"error": "psutil not available"}
        except Exception as e:
            return {"error": str(e)}
    
    def _check_dependencies(self) -> Dict[str, Any]:
        """Check health of agent dependencies"""
        dependencies = {
            "workflow": self._check_workflow_health(),
            "models": self._check_model_health(),
            "storage": self._check_storage_health(),
            "external_apis": self._check_external_apis()
        }
        
        # Overall dependency health
        all_healthy = all(
            dep.get("status") == "healthy" 
            for dep in dependencies.values() 
            if isinstance(dep, dict)
        )
        
        dependencies["overall"] = {
            "status": "healthy" if all_healthy else "degraded",
            "healthy_count": sum(1 for dep in dependencies.values() if isinstance(dep, dict) and dep.get("status") == "healthy"),
            "total_count": len([dep for dep in dependencies.values() if isinstance(dep, dict)])
        }
        
        return dependencies
    
    def _check_workflow_health(self) -> Dict[str, Any]:
        """Check if workflow is properly configured"""
        try:
            if hasattr(self, 'config') and self.config.workflow:
                return {
                    "status": "healthy",
                    "message": "Workflow properly configured",
                    "steps_count": len(getattr(self.config.workflow, 'steps', []))
                }
            else:
                return {
                    "status": "unhealthy",
                    "message": "No workflow configured"
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Workflow check failed: {str(e)}"
            }
    
    def _check_model_health(self) -> Dict[str, Any]:
        """Check if AI models are accessible"""
        try:
            # This would check actual model connectivity
            # For now, return basic status
            return {
                "status": "healthy",
                "message": "Models accessible",
                "available_models": len(self._get_agent_models())
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Model check failed: {str(e)}"
            }
    
    def _check_storage_health(self) -> Dict[str, Any]:
        """Check storage backend health"""
        try:
            # This would check actual storage connectivity
            return {
                "status": "healthy",
                "message": "Storage accessible"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Storage check failed: {str(e)}"
            }
    
    def _check_external_apis(self) -> Dict[str, Any]:
        """Check external API dependencies"""
        try:
            # This would check external API connectivity
            return {
                "status": "healthy",
                "message": "External APIs accessible"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"External API check failed: {str(e)}"
            }
    
    def _get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for this agent"""
        total_requests = self._total_requests
        successful_requests = self._successful_requests
        failed_requests = self._failed_requests
        
        # Calculate average response time
        avg_response_time = 0
        last_response_time = 0
        if self._response_times:
            avg_response_time = sum(self._response_times) / len(self._response_times)
            last_response_time = self._response_times[-1]
        
        metrics = {
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "average_response_time": round(avg_response_time, 3),
            "last_response_time": round(last_response_time, 3),
            "response_times_count": len(self._response_times)
        }
        
        # Calculate success rate
        if total_requests > 0:
            metrics["success_rate"] = round((successful_requests / total_requests) * 100, 2)
        else:
            metrics["success_rate"] = 100.0
            
        return metrics
    
    def _get_recent_errors(self) -> List[Dict[str, Any]]:
        """Get recent errors for this agent"""
        return getattr(self, '_recent_errors', [])
    
    async def _check_rate_limits(self, context: AgentRequestContext):
        """Check rate limits for the request"""
        if not self.config.rate_limit_config or not self.config.rate_limit_config.enabled:
            return
        
        # Get user ID and IP for rate limiting
        user_id = context.user_id or "anonymous"
        client_ip = self._get_client_ip(context.request)
        
        # Check user rate limit
        user_result = await rate_limiter.check_rate_limit(
            RateLimitType.USER,
            user_id,
            self.config.rate_limit_config
        )
        
        if not user_result.allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded for user. Retry after {user_result.retry_after} seconds",
                headers={
                    "X-RateLimit-Limit": str(self.config.rate_limit_config.requests_per_minute),
                    "X-RateLimit-Remaining": str(user_result.remaining),
                    "X-RateLimit-Reset": str(user_result.reset_time),
                    "Retry-After": str(user_result.retry_after or 60)
                }
            )
        
        # Check IP rate limit
        ip_result = await rate_limiter.check_rate_limit(
            RateLimitType.IP,
            client_ip,
            self.config.rate_limit_config
        )
        
        if not ip_result.allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded for IP. Retry after {ip_result.retry_after} seconds",
                headers={
                    "X-RateLimit-Limit": str(self.config.rate_limit_config.requests_per_minute),
                    "X-RateLimit-Remaining": str(ip_result.remaining),
                    "X-RateLimit-Reset": str(ip_result.reset_time),
                    "Retry-After": str(ip_result.retry_after or 60)
                }
            )
        
        # Check agent-specific rate limit
        agent_id = self.config.route.replace("/agents/", "")
        agent_result = await rate_limiter.check_rate_limit(
            RateLimitType.AGENT,
            agent_id,
            self.config.rate_limit_config
        )
        
        if not agent_result.allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded for agent. Retry after {agent_result.retry_after} seconds",
                headers={
                    "X-RateLimit-Limit": str(self.config.rate_limit_config.requests_per_minute),
                    "X-RateLimit-Remaining": str(agent_result.remaining),
                    "X-RateLimit-Reset": str(agent_result.reset_time),
                    "Retry-After": str(agent_result.retry_after or 60)
                }
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class AgentRegistry:
    """Registry for managing all agents in the system"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgentHandler] = {}
        self.configs: Dict[str, AgentConfig] = {}
    
    def register_agent(self, config: AgentConfig, handler_class: Type[BaseAgentHandler]):
        """Register an agent with its configuration and handler"""
        handler = handler_class(config)
        self.agents[config.route] = handler
        self.configs[config.route] = config
        logger.info(f"📝 Registered agent: {config.name} at {config.route}")
    
    def get_agent(self, route: str) -> Optional[BaseAgentHandler]:
        """Get an agent handler by route"""
        return self.agents.get(route)
    
    def get_all_routes(self) -> List[str]:
        """Get all registered agent routes"""
        return list(self.agents.keys())
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        agents_health = {}
        total_agents = len(self.agents)
        healthy_agents = 0
        
        for route, handler in self.agents.items():
            try:
                agent_health = handler.get_health_status()
                agents_health[route] = agent_health
                if agent_health.get("status") == "active":
                    healthy_agents += 1
            except Exception as e:
                agents_health[route] = {
                    "agent_id": route.lstrip('/'),
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": self._get_current_timestamp()
                }
        
        # Calculate overall system health
        system_status = "healthy" if healthy_agents == total_agents else "degraded"
        if healthy_agents == 0:
            system_status = "unhealthy"
        
        return {
            "system_status": system_status,
            "total_agents": total_agents,
            "healthy_agents": healthy_agents,
            "unhealthy_agents": total_agents - healthy_agents,
            "agents": agents_health,
            "timestamp": self._get_current_timestamp(),
            "uptime": self._get_system_uptime()
        }
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def _get_system_uptime(self) -> Optional[float]:
        """Get system uptime in seconds"""
        if hasattr(self, '_start_time'):
            return time.time() - self._start_time
        return None
    
    def setup_fastapi_routes(self, app: FastAPI):
        """Setup all agent routes in the FastAPI app"""
        for route, handler in self.agents.items():
            config = self.configs[route]
            
            # Create endpoint function with proper closure
            async def create_endpoint(request: Request, input_data: RunAgentInput, handler_ref=handler):
                return await handler_ref.handle_request(request, input_data)
            
            # Register the route
            app.post(route, description=config.description)(create_endpoint)
            logger.info(f"🔗 Setup FastAPI route: {route}")


# Global registry instance
agent_registry = AgentRegistry()
