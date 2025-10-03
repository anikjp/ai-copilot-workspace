"""
Insights Step: Generate market insights and analysis
"""

import json
import os
from openai import OpenAI
from agno.workflow.v2 import StepOutput
from ..config import OPENAI_MODEL, TOOL_LOG_MESSAGES
from ..utils import emit_tool_log_start, emit_tool_log_complete
from ..tools import generate_insights
from ..prompts import insights_prompt


async def insights_step(step_input):
    """
    WORKFLOW STEP 4: Generate market insights and analysis
    This function creates bull/bear insights for the analyzed stocks
    """
    # Step 1: Check if we have tool calls to process from previous steps
    if step_input.additional_data["messages"][-1].tool_calls is None:
        return StepOutput(
            content=step_input.additional_data
        )
    
    # Step 2: Initialize tool logging for insights generation
    await emit_tool_log_start(
        step_input,
        TOOL_LOG_MESSAGES["extracting_insights"]
    )
    
    # Step 3: Extract ticker symbols for insight generation
    tickers = step_input.additional_data["be_arguments"]['ticker_symbols']
    
    # Step 4: Initialize OpenAI client for insights generation
    model = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Step 5: Request insights generation from AI
    # Use specialized insights prompt and generate_insights tool
    response = model.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": insights_prompt},  # Insights generation prompt
            {"role": "user", "content": json.dumps(tickers)},  # Ticker symbols as input
        ],
        tools=[generate_insights],  # Tool for generating bull/bear insights
    )
    
    # Step 6: Process insights response and merge with existing data
    if response.choices[0].finish_reason == "tool_calls":
        # Extract existing arguments from previous tool call
        args_dict = json.loads(step_input.additional_data["messages"][-1].tool_calls[0].function.arguments)

        # Add the insights key to existing arguments
        args_dict["insights"] = json.loads(
            response.choices[0].message.tool_calls[0].function.arguments
        )

        # Update the tool call with merged data (charts + insights)
        step_input.additional_data["messages"][-1].tool_calls[0].function.arguments = json.dumps(args_dict)
    else:
        # Handle case where insights generation failed
        step_input.additional_data["insights"] = {}  # Empty insights
    
    # Step 7: Mark insights extraction as completed
    await emit_tool_log_complete(step_input)
    
    # Return final workflow output
    return StepOutput(
        content=step_input.additional_data
    )
