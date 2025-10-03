"""Base agent utilities for creating standardized agent endpoints"""

import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional, Callable, Awaitable
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agno.workflow.v2 import Workflow, StepOutput
from ag_ui.core import EventType, StateSnapshotEvent, StateDeltaEvent, TextMessageContentEvent

class RunAgentInput(BaseModel):
    """Standard input model for agent endpoints"""
    messages: List[Dict[str, Any]]
    tools: List[Dict[str, Any]] = []
    state: Dict[str, Any] = {}
    threadId: Optional[str] = None
    runId: Optional[str] = None

def create_agent_endpoint(app: FastAPI, route: str, workflow: Workflow, description: str = None):
    """
    Create a standardized FastAPI endpoint for an agent workflow
    
    Args:
        app: FastAPI application
        route: URL route for the endpoint
        workflow: Agent workflow to execute
        description: Optional description for the endpoint
    """
    
    @app.post(route, description=description)
    async def agent_endpoint(input_data: RunAgentInput):
        try:
            async def event_generator():
                # Set up the event queue
                queue = asyncio.Queue()
                
                # Define event emitter function
                async def emit_event(event_type: EventType, data: Dict[str, Any] = None):
                    # All events should be flattened for ag-ui protocol
                    event = {
                        "type": event_type,
                        **(data or {})  # Flatten all data fields into root
                    }
                    sse_data = f"data: {json.dumps(event)}\n\n"
                    await queue.put(sse_data)
                    print(f"🟠 BACKEND: Event queued: {event_type}")
                
                # Extract model selection from state or use default
                selected_model = input_data.state.get("selected_model", "gpt-4o-mini")
                workflow_type = input_data.state.get("workflow_type", "chat")
                
                # Use thread and run IDs from request if provided, otherwise generate new ones
                thread_id = input_data.threadId or str(uuid.uuid4())
                run_id = input_data.runId or str(uuid.uuid4())
                print(f"🟠 BACKEND: Using threadId: {thread_id}, runId: {run_id}")
                
                # Send RUN_STARTED event first (required by CopilotKit)
                print(f"🟠 BACKEND: Emitting RUN_STARTED (threadId: {thread_id[:8]}..., runId: {run_id[:8]}...)")
                await emit_event(
                    EventType.RUN_STARTED,
                    {
                        "threadId": thread_id,
                        "runId": run_id
                    }
                )
                
                # Send initial state snapshot with all fields initialized
                await emit_event(
                    EventType.STATE_SNAPSHOT,
                    {
                        "snapshot": {
                            "selected_model": selected_model,
                            "workflow_type": workflow_type,
                            "conversation_history": input_data.state.get("conversation_history", []),
                            "available_tools": input_data.state.get("available_tools", []),
                            "tool_logs": [],  # Initialize tool_logs array
                            "investment_portfolio": input_data.state.get("investment_portfolio", []),  # Initialize for stock agent
                            "available_cash": input_data.state.get("available_cash"),  # Initialize for stock agent
                        }
                    }
                )
                
                # Start the workflow as an async task
                print("="*60)
                print(f"🟠 BACKEND: Received request at {route}")
                print(f"🟠 BACKEND: Input messages count: {len(input_data.messages)}")
                print(f"🟠 BACKEND: Last message: {input_data.messages[-1] if input_data.messages else 'None'}")
                print(f"🟠 BACKEND: Input state keys: {list(input_data.state.keys())}")
                agent_task = asyncio.create_task(
                    workflow.arun(
                        additional_data={
                            "tools": input_data.tools,
                            "messages": input_data.messages,
                            "emit_event": emit_event,
                            "selected_model": selected_model,
                            "workflow_type": workflow_type,
                            "conversation_history": input_data.state.get("conversation_history", []),
                            "available_tools": input_data.state.get("available_tools", []),
                            "tool_logs": [],
                            "investment_portfolio": input_data.state.get("investment_portfolio", "[]"),
                            "available_cash": input_data.state.get("available_cash", None),
                        }
                    )
                )
                
                # Stream events from the queue until the workflow is complete
                while True:
                    # Try to get events from queue with short timeout
                    try:
                        event = await asyncio.wait_for(queue.get(), timeout=0.05)
                        print(f"🟠 BACKEND: Yielding event from queue in real-time")
                        yield event
                    except asyncio.TimeoutError:
                        # No events in queue, check if workflow is done
                        pass
                    
                    # Check if workflow is done
                    if agent_task.done():
                        # Get workflow results
                        try:
                            workflow_result = agent_task.result()
                            print(f"DEBUG base_agent: Workflow completed. Result type: {type(workflow_result)}")
                            print(f"DEBUG base_agent: Is StepOutput: {isinstance(workflow_result, StepOutput)}")
                            
                            # Extract the final state from either StepOutput or WorkflowRunResponse
                            final_state = None
                            if isinstance(workflow_result, StepOutput):
                                final_state = workflow_result.additional_data
                            elif hasattr(workflow_result, 'content'):
                                # WorkflowRunResponse has a content attribute
                                final_state = workflow_result.content
                                print(f"DEBUG base_agent: Extracted content from WorkflowRunResponse")
                            elif hasattr(workflow_result, 'additional_data'):
                                final_state = workflow_result.additional_data
                            
                            # Send final state update
                            if final_state:
                                messages = final_state.get("messages", []) if isinstance(final_state, dict) else []
                                print(f"DEBUG base_agent: Final state type: {type(final_state)}")
                                print(f"DEBUG base_agent: Final messages count: {len(messages)}")
                                
                                # TEXT_MESSAGE events are now emitted from within the workflow steps
                                # State updates are also emitted during workflow execution
                                print(f"DEBUG base_agent: Workflow emitted all events during execution")
                                
                                # Send RUN_FINISHED event (required by CopilotKit)
                                print(f"🟠 BACKEND: Emitting RUN_FINISHED")
                                print(f"🟠 BACKEND: Response complete!")
                                print("="*60)
                                await emit_event(
                                    EventType.RUN_FINISHED,
                                    {
                                        "threadId": thread_id,
                                        "runId": run_id
                                    }
                                )
                        except Exception as e:
                            # Send error event
                            await emit_event(
                                EventType.ERROR,
                                {"error": str(e)}
                            )
                        
                        # Process any remaining events in the queue
                        # Give a tiny delay to ensure all emit_event calls complete
                        await asyncio.sleep(0.01)
                        
                        while not queue.empty():
                            event = await queue.get()
                            print(f"🟠 BACKEND: Yielding queued event from final flush")
                            yield event
                        
                        print(f"🟠 BACKEND: All events flushed, ending stream")
                        # End the stream
                        break
            
            # Return the streaming response
            return StreamingResponse(event_generator(), media_type="text/event-stream")
        
        except Exception as e:
            # Log and return error
            print(f"Agent Error: {e}")
            return Response(content=json.dumps({"error": str(e)}), media_type="application/json", status_code=500)
    
    # Return the endpoint function for reference
    return agent_endpoint
