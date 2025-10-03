"""
Example Agent Implementation
===========================

This is an example showing how to implement a new agent using the base agent system.
This agent demonstrates best practices and shows how to leverage common functionality
while implementing agent-specific logic.

Use this as a template for creating new agents.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from openai import OpenAI
from dotenv import load_dotenv
import os

from shared.base_agent_v2 import BaseAgent, AgentConfig, AgentType
from agno.workflow.v2 import StepOutput
from ag_ui.core import AssistantMessage, ToolMessage

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class ExampleAgent(BaseAgent):
    """
    Example agent that demonstrates the base agent system
    
    This agent processes user queries and provides helpful responses
    while showing how to use the base agent functionality.
    """
    
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def process_user_input(self, step_input: StepOutput) -> StepOutput:
        """
        Process user input - extract information and prepare for analysis
        
        This is where you would:
        - Parse user messages
        - Extract relevant information
        - Validate input
        - Prepare data for processing
        """
        try:
            # Emit processing log
            tool_log_id = await self.emit_tool_log(
                step_input, 
                "Processing user input",
                "processing"
            )
            
            # Get messages from input
            messages = step_input.additional_data.get("messages", [])
            if not messages:
                raise ValueError("No messages provided")
            
            # Extract the last user message
            user_message = None
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    user_message = msg.get("content", "")
                    break
            
            if not user_message:
                raise ValueError("No user message found")
            
            # Store processed input for next step
            step_input.additional_data["processed_input"] = {
                "user_message": user_message,
                "message_count": len(messages),
                "processing_timestamp": asyncio.get_event_loop().time()
            }
            
            # Mark log as completed
            await self.update_tool_log_status(step_input, tool_log_id, "completed")
            
            logger.info(f"Processed user input: {user_message[:100]}...")
            return step_input
            
        except Exception as e:
            return await self.handle_error(step_input, e, "process_user_input")
    
    async def execute_agent_logic(self, step_input: StepOutput) -> StepOutput:
        """
        Execute agent-specific logic - the core business logic of your agent
        
        This is where you would:
        - Call external APIs
        - Process data
        - Generate insights
        - Perform calculations
        """
        try:
            # Emit processing log
            tool_log_id = await self.emit_tool_log(
                step_input,
                "Executing agent logic",
                "processing"
            )
            
            # Get processed input from previous step
            processed_input = step_input.additional_data.get("processed_input", {})
            user_message = processed_input.get("user_message", "")
            
            # Example: Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.config.model,
                messages=step_input.additional_data.get("messages", []),
                tools=self.config.tools,
                temperature=0.7
            )
            
            # Process the response
            assistant_message = response.choices[0].message
            
            # Create standardized assistant message
            if assistant_message.tool_calls:
                # Handle tool calls
                tool_calls = [
                    await self.convert_openai_tool_call(tc)
                    for tc in assistant_message.tool_calls
                ]
                assistant_msg = await self.create_assistant_message(
                    tool_calls=tool_calls,
                    message_id=response.id
                )
            else:
                # Handle text response
                assistant_msg = await self.create_assistant_message(
                    content=assistant_message.content or "",
                    message_id=response.id
                )
            
            # Add to messages
            step_input.additional_data["messages"].append(assistant_msg)
            
            # Store results for next step
            step_input.additional_data["agent_results"] = {
                "response_id": response.id,
                "has_tool_calls": bool(assistant_message.tool_calls),
                "response_content": assistant_message.content,
                "processing_time": asyncio.get_event_loop().time() - processed_input.get("processing_timestamp", 0)
            }
            
            # Mark log as completed
            await self.update_tool_log_status(step_input, tool_log_id, "completed")
            
            logger.info(f"Executed agent logic, response ID: {response.id}")
            return step_input
            
        except Exception as e:
            return await self.handle_error(step_input, e, "execute_agent_logic")
    
    async def handle_tool_calls(self, step_input: StepOutput) -> StepOutput:
        """
        Handle tool calls specific to this agent
        
        This is where you would:
        - Execute specific tools
        - Process tool results
        - Return results to the conversation
        """
        try:
            # Check if there are tool calls to handle
            agent_results = step_input.additional_data.get("agent_results", {})
            if not agent_results.get("has_tool_calls"):
                logger.info("No tool calls to handle")
                return step_input
            
            # Emit processing log
            tool_log_id = await self.emit_tool_log(
                step_input,
                "Handling tool calls",
                "processing"
            )
            
            # Get the last assistant message with tool calls
            messages = step_input.additional_data.get("messages", [])
            last_message = messages[-1] if messages else None
            
            if not last_message or not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
                await self.update_tool_log_status(step_input, tool_log_id, "completed")
                return step_input
            
            # Process each tool call
            for tool_call in last_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                # Execute the tool (this is where you'd implement specific tool logic)
                tool_result = await self._execute_tool(tool_name, tool_args)
                
                # Create tool message
                tool_message = await self.create_tool_message(
                    content=tool_result,
                    tool_call_id=tool_call.id
                )
                
                # Add to messages
                step_input.additional_data["messages"].append(tool_message)
                
                logger.info(f"Executed tool: {tool_name}")
            
            # Mark log as completed
            await self.update_tool_log_status(step_input, tool_log_id, "completed")
            
            return step_input
            
        except Exception as e:
            return await self.handle_error(step_input, e, "handle_tool_calls")
    
    async def _execute_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> str:
        """
        Execute a specific tool - implement your tool logic here
        
        This is where you would implement the actual functionality
        for each tool your agent supports.
        """
        try:
            if tool_name == "get_weather":
                # Example tool implementation
                location = tool_args.get("location", "Unknown")
                return f"The weather in {location} is sunny and 72°F"
            
            elif tool_name == "calculate":
                # Another example tool
                expression = tool_args.get("expression", "0")
                try:
                    result = eval(expression)  # Note: In production, use a safe math parser
                    return f"Result: {result}"
                except Exception as e:
                    return f"Error calculating expression: {str(e)}"
            
            else:
                return f"Unknown tool: {tool_name}"
                
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return f"Error executing tool: {str(e)}"


# ============================================================================
# AGENT CONFIGURATION AND REGISTRATION
# ============================================================================

# Define the agent configuration
EXAMPLE_AGENT_CONFIG = AgentConfig(
    name="example_agent",
    agent_type=AgentType.CUSTOM,
    system_prompt="""
    You are a helpful example agent that demonstrates the base agent system.
    You can help users with various tasks and provide useful responses.
    
    You have access to the following tools:
    - get_weather: Get weather information for a location
    - calculate: Perform mathematical calculations
    
    Always be helpful and provide clear, accurate responses.
    """,
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather information for a specific location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The location to get weather for"
                        }
                    },
                    "required": ["location"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "calculate",
                "description": "Perform mathematical calculations",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "Mathematical expression to calculate"
                        }
                    },
                    "required": ["expression"]
                }
            }
        }
    ],
    model="gpt-4o-mini",
    max_retries=3,
    timeout_seconds=30,
    enable_tool_logs=True,
    enable_state_updates=True
)

# Register the agent with the factory
from shared.base_agent_v2 import BaseAgentFactory
BaseAgentFactory.register_agent(AgentType.CUSTOM, ExampleAgent)

# Export the workflow for use in main.py
def create_example_workflow():
    """Create and return the example agent workflow"""
    agent = ExampleAgent(EXAMPLE_AGENT_CONFIG)
    return agent.create_workflow()

example_agent_workflow = create_example_workflow()
