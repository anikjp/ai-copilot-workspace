"""
Utility functions for the Stock Analysis Agent
"""

import uuid
import asyncio
from ag_ui.core import EventType, StateDeltaEvent
from ag_ui.core import AssistantMessage


def convert_tool_call(tc):
    """Convert OpenAI tool call format to our internal format"""
    return {
        "id": tc.id,  # Unique identifier for the tool call
        "type": "function",  # Type of tool call (always "function")
        "function": {
            "name": tc.function.name,  # Function name to call
            "arguments": tc.function.arguments,  # JSON string of arguments
        },
    }


async def emit_tool_log_start(step_input, message, status="processing"):
    """Helper function to start a tool log entry"""
    tool_log_id = str(uuid.uuid4())
    
    # Add to tool logs
    step_input.additional_data['tool_logs'].append({
        "message": message,
        "status": status,
        "id": tool_log_id,
    })
    
    # Emit state change event
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": {
                        "message": message,
                        "status": status,
                        "id": tool_log_id,
                    },
                }
            ],
        )
    )
    await asyncio.sleep(0)  # Yield control to event loop
    
    return tool_log_id


async def emit_tool_log_complete(step_input, log_index=None):
    """Helper function to mark a tool log as completed"""
    if log_index is None:
        log_index = len(step_input.additional_data['tool_logs']) - 1
    
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "replace",
                    "path": f"/tool_logs/{log_index}/status",
                    "value": "completed",
                }
            ],
        )
    )
    await asyncio.sleep(0)  # Yield control to event loop


async def emit_state_update(step_input, path, value, operation="replace"):
    """Helper function to emit state updates"""
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": operation,
                    "path": path,
                    "value": value,
                }
            ],
        )
    )
    await asyncio.sleep(0)  # Yield control to event loop


def create_assistant_message_with_tool_calls(response):
    """Create an AssistantMessage with tool calls from OpenAI response"""
    tool_calls = [
        convert_tool_call(tc)
        for tc in response.choices[0].message.tool_calls
    ]
    return AssistantMessage(
        role="assistant", 
        tool_calls=tool_calls, 
        id=response.id
    )


def create_assistant_message_with_content(response):
    """Create an AssistantMessage with content from OpenAI response"""
    return AssistantMessage(
        id=response.id,
        content=response.choices[0].message.content,
        role="assistant",
    )


def add_tool_log(additional_data, message, status="processing"):
    """Add a tool log entry and emit state update"""
    tool_log_id = str(uuid.uuid4())
    log_entry = {
        "message": message,
        "status": status,
        "id": tool_log_id,
    }
    additional_data['tool_logs'].append(log_entry)
    additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": log_entry,
                }
            ],
        )
    )
    return tool_log_id


def update_tool_log_status(additional_data, tool_log_id, status):
    """Update the status of a tool log entry"""
    for i, log in enumerate(additional_data['tool_logs']):
        if log['id'] == tool_log_id:
            additional_data["emit_event"](
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[
                        {
                            "op": "replace",
                            "path": f"/tool_logs/{i}/status",
                            "value": status,
                        }
                    ],
                )
            )
            log['status'] = status
            break


# Export all utilities for easy importing
__all__ = [
    'convert_tool_call',
    'emit_tool_log_start',
    'emit_tool_log_complete', 
    'emit_state_update',
    'create_assistant_message_with_tool_calls',
    'create_assistant_message_with_content',
    'add_tool_log',
    'update_tool_log_status'
]
