# Generic Agno-ai Agent with Model Selection
# This module provides a flexible agent that can use different AI models

from agno.workflow.v2 import Step, Workflow, StepOutput
from ag_ui.core import EventType, StateDeltaEvent
from ag_ui.core import AssistantMessage, ToolMessage
import uuid
import asyncio
import json
from typing import Dict, Any, List
from dotenv import load_dotenv

from shared.model_factory import ModelManager, ModelFactory
from .prompts import GENERIC_SYSTEM_PROMPT, generic_tools

load_dotenv()

async def initialize_model_and_context(step_input):
    """Step 1: Initialize the selected model and set up context"""
    try:
        messages = step_input.additional_data.get("messages", [])
        emit_event = step_input.additional_data.get("emit_event")
        
        # Get the selected model from the request
        selected_model = step_input.additional_data.get("selected_model", "gpt-4.1-mini")
        
        # Initialize model manager
        model_manager = ModelManager(selected_model)
        step_input.additional_data["model_manager"] = model_manager
        
        # Emit event to update UI with selected model
        if emit_event:
            await emit_event(
                EventType.STATE_DELTA,
                {
                    "state_delta": {
                        "selected_model": selected_model,
                        "model_info": model_manager.get_model_info()
                    }
                }
            )
        
        # Add system message if not present
        if not messages or messages[0].get("role") != "system":
            messages.insert(0, {"role": "system", "content": GENERIC_SYSTEM_PROMPT})
        
        step_input.additional_data["messages"] = messages
        return step_input.additional_data
        
    except Exception as e:
        print(f"Error in initialize_model_and_context: {e}")
        if emit_event:
            await emit_event(
                EventType.STATE_DELTA,
                {
                    "state_delta": {
                        "error": str(e)
                    }
                }
            )
        return step_input.additional_data

async def process_user_query(step_input):
    """Step 2: Process the user query with the selected model"""
    try:
        messages = step_input.additional_data.get("messages", [])
        emit_event = step_input.additional_data.get("emit_event")
        model_manager = step_input.additional_data.get("model_manager")
        
        if not model_manager:
            raise ValueError("Model manager not initialized")
        
        # Emit event to show processing
        if emit_event:
            await emit_event(
                EventType.STATE_DELTA,
                {
                    "state_delta": {
                        "processing": True
                    }
                }
            )
        
        # Make API call to the selected model
        response = model_manager.chat_completion(
            messages=[msg.__dict__ if hasattr(msg, '__dict__') else msg for msg in messages],
            tools=generic_tools
        )
        
        # Process response based on model type
        if hasattr(response, 'choices') and len(response.choices) > 0:
            # OpenAI/GROQ style response
            choice = response.choices[0]
            if hasattr(choice, 'message'):
                assistant_message = choice.message
                
                # Check for tool calls
                if hasattr(assistant_message, 'tool_calls') and assistant_message.tool_calls:
                    # Save tool calls for next step
                    step_input.additional_data["tool_calls"] = assistant_message.tool_calls
                    messages.append({"role": "assistant", "content": None, "tool_calls": [
                        {"id": tc.id, "type": tc.type, "function": {"name": tc.function.name, "arguments": tc.function.arguments}} 
                        for tc in assistant_message.tool_calls
                    ]})
                else:
                    # Regular text response
                    content = assistant_message.content
                    messages.append({"role": "assistant", "content": content})
                    
                    # Emit response to UI
                    if emit_event:
                        await emit_event(
                            EventType.STATE_DELTA,
                            {
                                "state_delta": {
                                    "processing": False,
                                    "last_response": content
                                }
                            }
                        )
        
        step_input.additional_data["messages"] = messages
        return step_input.additional_data
        
    except Exception as e:
        print(f"Error in process_user_query: {e}")
        if emit_event:
            await emit_event(
                EventType.STATE_DELTA,
                {
                    "state_delta": {
                        "processing": False,
                        "error": str(e)
                    }
                }
            )
        return step_input.additional_data

async def handle_tool_execution(step_input):
    """Step 3: Handle any tool calls from the model"""
    try:
        messages = step_input.additional_data.get("messages", [])
        emit_event = step_input.additional_data.get("emit_event")
        tool_calls = step_input.additional_data.get("tool_calls", [])
        
        # If no tool calls, skip this step
        if not tool_calls:
            return step_input.additional_data
        
        # Process each tool call
        for tool_call in tool_calls:
            if hasattr(tool_call, 'function'):
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except:
                    function_args = {}
                
                # Execute the tool
                tool_result = await execute_generic_tool(function_name, function_args)
                
                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": str(tool_result)
                })
                
                # Emit tool execution event
                if emit_event:
                    await emit_event(
                        EventType.STATE_DELTA,
                        {
                            "state_delta": {
                                "tool_executions": step_input.additional_data.get("tool_executions", []) + [
                                    {
                                        "name": function_name,
                                        "args": function_args,
                                        "result": str(tool_result)
                                    }
                                ]
                            }
                        }
                    )
        
        # Clear tool calls
        step_input.additional_data["tool_calls"] = []
        step_input.additional_data["messages"] = messages
        
        # Process the tool results with the model
        return await process_user_query(step_input)
        
    except Exception as e:
        print(f"Error in handle_tool_execution: {e}")
        if emit_event:
            await emit_event(
                EventType.STATE_DELTA,
                {
                    "state_delta": {
                        "error": str(e)
                    }
                }
            )
        return step_input.additional_data

async def execute_generic_tool(tool_name, args):
    """Execute a generic tool based on the name and arguments"""
    if tool_name == "analyze_text":
        text = args.get("text", "")
        analysis_type = args.get("analysis_type", "general")
        return f"Analysis of text ({analysis_type}): {len(text.split())} words analyzed. The text appears to be about {text.split()[:3]}..."
    
    elif tool_name == "search_knowledge_base":
        query = args.get("query", "")
        return f"Knowledge base search for '{query}' returned 3 results. Most relevant: 'Document about {query}'"
    
    elif tool_name == "generate_content":
        content_type = args.get("content_type", "text")
        topic = args.get("topic", "")
        return f"Generated {content_type} content about '{topic}'. Content length: medium."
    
    elif tool_name == "solve_problem":
        problem = args.get("problem", "")
        approach = args.get("approach", "step-by-step")
        return f"Problem '{problem}' solved using {approach} approach. Solution involves 3 key steps."
    
    else:
        return f"Tool '{tool_name}' not implemented or recognized."

# Create the Generic Agent workflow
generic_agent_workflow = Workflow(
    name="Generic Agent with Model Selection",
    steps=[initialize_model_and_context, process_user_query, handle_tool_execution],
)

# Export the workflow for use in main.py
__all__ = ['generic_agent_workflow', 'ModelFactory']