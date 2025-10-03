"""
Chat Step: Initial chat processing and parameter extraction
"""

import json
import os
from openai import OpenAI
from ag_ui.core import AssistantMessage
from ..config import OPENAI_MODEL, TOOL_LOG_MESSAGES
from ..utils import emit_tool_log_start, emit_tool_log_complete, create_assistant_message_with_tool_calls, create_assistant_message_with_content
from ..tools import extract_relevant_data_from_user_prompt
from ..prompts import system_prompt


async def chat_step(step_input):
    """
    WORKFLOW STEP 1: Initial chat processing and parameter extraction
    This function handles the first interaction with the user query
    """
    try:
        # Step 1: Initialize tool logging for UI feedback
        await emit_tool_log_start(
            step_input, 
            TOOL_LOG_MESSAGES["analyzing_query"]
        )
        
        # Step 2: Prepare system prompt with portfolio data
        # Replace placeholder in system prompt with actual portfolio information
        step_input.additional_data['messages'][0].content = system_prompt.replace(
            "{PORTFOLIO_DATA_PLACEHOLDER}", 
            json.dumps(step_input.additional_data["investment_portfolio"])
        )
        
        # Step 3: Make API call to OpenAI
        # Initialize OpenAI client with API key from environment
        model = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Step 4: Request completion with tool calling capability
        # The model can call the extract_relevant_data_from_user_prompt tool
        response = model.chat.completions.create(
            model=OPENAI_MODEL,
            messages=step_input.additional_data['messages'],  # Chat history
            tools=[extract_relevant_data_from_user_prompt]  # Available tools
        )
        
        # Step 5: Update tool log status to completed
        await emit_tool_log_complete(step_input)
        
        # Step 6: Process the AI response
        # Check if the AI decided to call a tool (function)
        if response.choices[0].finish_reason == "tool_calls":
            # Create assistant message with tool calls
            a_message = create_assistant_message_with_tool_calls(response)
            step_input.additional_data["messages"].append(a_message)
        else:
            # If no tool calls, just add the text response
            a_message = create_assistant_message_with_content(response)
            step_input.additional_data["messages"].append(a_message)
        
        # Step 7: Return updated data for next workflow step
        return step_input.additional_data
            
    except Exception as e:
        # Handle errors gracefully
        print(f"Error in chat step: {e}")
        # Add empty assistant message to maintain conversation flow
        a_message = AssistantMessage(id="error", content="", role="assistant")
        step_input.additional_data["messages"].append(a_message)
        return "end"  # Signal workflow termination
