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

logger = logging.getLogger(__name__)


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
    
    async def handle_request(self, request: Request, input_data: RunAgentInput) -> StreamingResponse:
        """
        Main entry point for handling agent requests
        Handles all common concerns: auth, validation, tracing, streaming
        """
        context = AgentRequestContext(request, input_data, self.config)
        
        try:
            # Start tracing
            self.tracer.start_trace(context)
            
            # Validate request
            await self._validate_request(context)
            
            # Check authentication if required
            if self.config.requires_auth:
                await self._authenticate_request(context)
            
            # Create streaming response
            return await self._create_streaming_response(context)
            
        except Exception as e:
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
        if not context.user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Agent-specific authentication
        await self.authenticate_request(context)
    
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
                # End tracing
                duration = time.time() - context.start_time
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
        additional_data = {
            "tools": context.input_data.tools,
            "messages": context.input_data.messages,
            "emit_event": emit_event,
            "context": context,
            "request_id": context.request_id,
            "tool_logs": [],  # Initialize tool_logs array
        }
        
        # Merge with agent-specific data
        agent_data = self.get_workflow_data(context)
        additional_data.update(agent_data)
        
        return await self.config.workflow.arun(additional_data=additional_data)
    
    
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
