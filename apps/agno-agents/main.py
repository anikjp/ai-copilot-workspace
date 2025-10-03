"""
Agno Agents Backend Server
==========================

FastAPI server for running AI agents with real-time streaming capabilities.
Following TheGreatBonnie's exact implementation pattern.

Author: AI Assistant
Version: 1.0.0
"""

import asyncio
import json
import logging
import os
import uuid
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# AG-UI Core imports
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

# Agent workflows
from agents.stock_agent.agent import stock_analysis_workflow
from agents.ringi_agent import ringi_workflow
from agents.bpp_agent import bpp_assistant_workflow
from agents.generic_agent import generic_agent_workflow
from agno.workflow.v2 import StepOutput

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("agno_agents.log"),
    ],
)
logger = logging.getLogger(__name__)

# Configuration
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
    DEFAULT_CASH: int = int(os.getenv("DEFAULT_CASH", "1000000"))

config = Config()

# Initialize FastAPI application
app = FastAPI(
    title="Agno Agents API",
    description="AI Agents with real-time streaming capabilities",
    version="1.0.0",
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


# Stock Reference Agent - Following TheGreatBonnie Pattern
@app.post("/stock-reference")
async def stock_reference_agent(input_data: RunAgentInput):
    """
    Stock Analysis Agent Reference Implementation
    Following TheGreatBonnie's exact pattern
    """
    try:
        # ASYNC GENERATOR: Streams events to client in real-time
        async def event_generator():
            # Step 1: Initialize event streaming infrastructure
            encoder = EventEncoder()  # Encodes events for transmission
            event_queue = asyncio.Queue()  # Queue for handling events from workflow

            # Step 2: Define event emission callback function
            def emit_event(event):
                event_queue.put_nowait(event)  # Add event to queue without blocking

            # Step 3: Generate unique message identifier for this conversation
            message_id = str(uuid.uuid4())

            # Step 4: Send initial "run started" event to client
            yield encoder.encode(
                RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )

            # Step 5: Send current state snapshot to client
            yield encoder.encode(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot={
                        "available_cash": input_data.state.get("available_cash", config.DEFAULT_CASH),
                        "investment_summary": input_data.state.get("investment_summary", {}),
                        "investment_portfolio": input_data.state.get("investment_portfolio", []),
                        "tool_logs": [],
                    },
                )
            )
            
            # Step 6: Start the stock analysis workflow as an async task
            # Following TheGreatBonnie's exact pattern
            agent_task = asyncio.create_task(
                stock_analysis_workflow.arun(  # Execute workflow asynchronously
                    additional_data={
                        "tools": input_data.tools,  # Available tools/functions
                        "messages": input_data.messages,  # Conversation history
                        "emit_event": emit_event,  # Callback for sending UI updates
                        "available_cash": input_data.state.get("available_cash", config.DEFAULT_CASH),  # Cash balance
                        "investment_portfolio": input_data.state.get("investment_portfolio", []),  # Holdings
                        "tool_logs": [],  # Initialize logs array
                    }
                )
            )

            # Step 7: Stream events from workflow while it's running
            while True:
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=0.1)
                    yield encoder.encode(event)
                except asyncio.TimeoutError:
                    if agent_task.done():
                        break

            # Step 8: Clear tool logs after workflow completion
            yield encoder.encode(
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[{"op": "replace", "path": "/tool_logs", "value": []}],
                )
            )
            
            # Step 9: Process final workflow results and stream appropriate response
            try:
                result = agent_task.result()
                if (result and 
                    hasattr(result, 'step_responses') and 
                    result.step_responses and 
                    len(result.step_responses) > 0 and
                    hasattr(result.step_responses[-1], 'content') and
                    result.step_responses[-1].content and
                    'messages' in result.step_responses[-1].content and
                    result.step_responses[-1].content['messages'] and
                    len(result.step_responses[-1].content['messages']) > 0):
                    
                    last_message = result.step_responses[-1].content['messages'][-1]
                    if hasattr(last_message, 'role') and last_message.role == "assistant":
                        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                            # Handle tool call responses (charts, analysis, etc.)
                            yield encoder.encode(
                                ToolCallStartEvent(
                                    type=EventType.TOOL_CALL_START,
                                    tool_call_id=last_message.tool_calls[0].id,
                                    toolCallName=last_message.tool_calls[0].function.name,
                                )
                            )

                            yield encoder.encode(
                                ToolCallArgsEvent(
                                    type=EventType.TOOL_CALL_ARGS,
                                    tool_call_id=last_message.tool_calls[0].id,
                                    delta=last_message.tool_calls[0].function.arguments,
                                )
                            )

                            yield encoder.encode(
                                ToolCallEndEvent(
                                    type=EventType.TOOL_CALL_END,
                                    tool_call_id=last_message.tool_calls[0].id,
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

                            content = getattr(last_message, 'content', '') or ''
                            if content:
                                # Split message into chunks for streaming effect
                                n_parts = 100
                                part_length = max(1, len(content) // n_parts)
                                parts = [content[i : i + part_length] for i in range(0, len(content), part_length)]
                                
                                if len(parts) > n_parts:
                                    parts = parts[: n_parts - 1] + ["".join(parts[n_parts - 1 :])]
                                
                                for part in parts:
                                    yield encoder.encode(
                                        TextMessageContentEvent(
                                            type=EventType.TEXT_MESSAGE_CONTENT,
                                            message_id=message_id,
                                            delta=part,
                                        )
                                    )
                                    await asyncio.sleep(0.05)
                            else:
                                yield encoder.encode(
                                    TextMessageContentEvent(
                                        type=EventType.TEXT_MESSAGE_CONTENT,
                                        message_id=message_id,
                                        delta="Something went wrong! Please try again.",
                                    )
                                )

                            yield encoder.encode(
                                TextMessageEndEvent(
                                    type=EventType.TEXT_MESSAGE_END,
                                    message_id=message_id,
                                )
                            )
            except Exception as e:
                logger.error(f"Error processing workflow results: {e}")
                # Send error message
                yield encoder.encode(
                    TextMessageStartEvent(
                        type=EventType.TEXT_MESSAGE_START,
                        message_id=message_id,
                        role="assistant",
                    )
                )
                yield encoder.encode(
                    TextMessageContentEvent(
                        type=EventType.TEXT_MESSAGE_CONTENT,
                        message_id=message_id,
                        delta="I encountered an error while processing your request. Please try again.",
                    )
                )
                yield encoder.encode(
                    TextMessageEndEvent(
                        type=EventType.TEXT_MESSAGE_END,
                        message_id=message_id,
                    )
                )

            # Step 10: Send final "run finished" event
            yield encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )

    except Exception as e:
        logger.error(f"Stock Reference Agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent processing failed: {str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Stock Analysis Agent V2 - Modular Implementation
@app.post("/stock-agent-v2")
async def stock_agent_v2(input_data: RunAgentInput):
    """
    Stock Analysis Agent V2 - Modular Implementation
    Clean, maintainable version using the new modular structure
    """
    try:
        # ASYNC GENERATOR: Streams events to client in real-time
        async def event_generator():
            # Step 1: Initialize event streaming infrastructure
            encoder = EventEncoder()  # Encodes events for transmission
            event_queue = asyncio.Queue()  # Queue for handling events from workflow

            # Step 2: Define event emission callback function
            def emit_event(event):
                event_queue.put_nowait(event)  # Add event to queue without blocking

            # Step 3: Generate unique message identifier for this conversation
            message_id = str(uuid.uuid4())

            # Step 4: Send initial "run started" event to client
            yield encoder.encode(
                RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )

            # Step 5: Send current state snapshot to client
            yield encoder.encode(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot={
                        "available_cash": input_data.state.get("available_cash", 100000),
                        "investment_summary": input_data.state.get("investment_summary", {}),
                        "investment_portfolio": input_data.state.get("investment_portfolio", []),
                        "tool_logs": [],
                    },
                )
            )
            
            # Step 6: Start the stock analysis workflow as an async task
            # Using the modular workflow
            agent_task = asyncio.create_task(
                stock_analysis_workflow.arun(  # Execute modular workflow asynchronously
                    additional_data={
                        "tools": input_data.tools,  # Available tools/functions
                        "messages": input_data.messages,  # Conversation history
                        "emit_event": emit_event,  # Callback for sending UI updates
                        "available_cash": input_data.state.get("available_cash", 100000),  # Cash balance
                        "investment_portfolio": input_data.state.get("investment_portfolio", []),  # Holdings
                        "tool_logs": [],  # Initialize logs array
                    }
                )
            )

            # Step 7: Stream events from workflow while it's running
            while True:
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=0.1)
                    yield encoder.encode(event)
                except asyncio.TimeoutError:
                    if agent_task.done():
                        break

            # Step 8: Clear tool logs after workflow completion
            yield encoder.encode(
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[{"op": "replace", "path": "/tool_logs", "value": []}],
                )
            )
            
            # Step 9: Process final workflow results and stream appropriate response
            try:
                result = agent_task.result()
                if (result and 
                    hasattr(result, 'step_responses') and 
                    result.step_responses and 
                    len(result.step_responses) > 0 and
                    hasattr(result.step_responses[-1], 'content') and
                    result.step_responses[-1].content and
                    'messages' in result.step_responses[-1].content and
                    result.step_responses[-1].content['messages'] and
                    len(result.step_responses[-1].content['messages']) > 0):
                    
                    last_message = result.step_responses[-1].content['messages'][-1]
                    if hasattr(last_message, 'role') and last_message.role == "assistant":
                        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                            # Handle tool call responses (charts, analysis, etc.)
                            yield encoder.encode(
                                ToolCallStartEvent(
                                    type=EventType.TOOL_CALL_START,
                                    tool_call_id=last_message.tool_calls[0].id,
                                    toolCallName=last_message.tool_calls[0].function.name,
                                )
                            )

                            yield encoder.encode(
                                ToolCallArgsEvent(
                                    type=EventType.TOOL_CALL_ARGS,
                                    tool_call_id=last_message.tool_calls[0].id,
                                    delta=last_message.tool_calls[0].function.arguments,
                                )
                            )

                            yield encoder.encode(
                                ToolCallEndEvent(
                                    type=EventType.TOOL_CALL_END,
                                    tool_call_id=last_message.tool_calls[0].id,
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

                            content = getattr(last_message, 'content', '') or ''
                            if content:
                                # Split message into chunks for streaming effect
                                n_parts = 100
                                part_length = max(1, len(content) // n_parts)
                                parts = [content[i : i + part_length] for i in range(0, len(content), part_length)]
                                
                                if len(parts) > n_parts:
                                    parts = parts[: n_parts - 1] + ["".join(parts[n_parts - 1 :])]
                                
                                for part in parts:
                                    yield encoder.encode(
                                        TextMessageContentEvent(
                                            type=EventType.TEXT_MESSAGE_CONTENT,
                                            message_id=message_id,
                                            delta=part,
                                        )
                                    )
                                    await asyncio.sleep(0.05)
                            else:
                                yield encoder.encode(
                                    TextMessageContentEvent(
                                        type=EventType.TEXT_MESSAGE_CONTENT,
                                        message_id=message_id,
                                        delta="Something went wrong! Please try again.",
                                    )
                                )

                            yield encoder.encode(
                                TextMessageEndEvent(
                                    type=EventType.TEXT_MESSAGE_END,
                                    message_id=message_id,
                                )
                            )
            except Exception as e:
                logger.error(f"Error processing workflow results: {e}")
                # Send error message
                yield encoder.encode(
                    TextMessageStartEvent(
                        type=EventType.TEXT_MESSAGE_START,
                        message_id=message_id,
                        role="assistant",
                    )
                )
                yield encoder.encode(
                    TextMessageContentEvent(
                        type=EventType.TEXT_MESSAGE_CONTENT,
                        message_id=message_id,
                        delta="I encountered an error while processing your request. Please try again.",
                    )
                )
                yield encoder.encode(
                    TextMessageEndEvent(
                        type=EventType.TEXT_MESSAGE_END,
                        message_id=message_id,
                    )
                )

            # Step 10: Send final "run finished" event
            yield encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )

    except Exception as e:
        logger.error(f"Stock Agent V2 error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent processing failed: {str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Other agent endpoints using standard pattern
from shared.base_agent import create_agent_endpoint

create_agent_endpoint(
    app=app,
    route="/stock-agent",
    workflow=stock_analysis_workflow,
    description="Stock analysis agent for investment recommendations"
)

create_agent_endpoint(
    app=app,
    route="/ringi-agent",
    workflow=ringi_workflow,
    description="Ringi System agent for collaborative decision-making"
)

create_agent_endpoint(
    app=app,
    route="/bpp-agent",
    workflow=bpp_assistant_workflow,
    description="Business Process Platform (BPP) AI Assistant"
)

create_agent_endpoint(
    app=app,
    route="/generic-agent",
    workflow=generic_agent_workflow,
    description="Generic agent with model selection capabilities"
)


def main():
    """Run the uvicorn server"""
    logger.info(f"Starting server on {config.HOST}:{config.PORT}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info" if config.DEBUG else "warning",
    )


if __name__ == "__main__":
    main()