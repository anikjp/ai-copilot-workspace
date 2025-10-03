# Ringi Agent
# This module provides a workflow for Japanese-style consensus decision making

from agno.workflow.v2 import Step, Workflow, StepOutput
from ag_ui.core import EventType, StateDeltaEvent
from ag_ui.core import AssistantMessage, ToolMessage
import uuid
import asyncio
import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from .prompts import system_prompt

# Load environment variables from .env file (contains API keys, etc.)
load_dotenv()

# Tool function definition: Extract proposal details
extract_proposal = {
    "type": "function",
    "function": {
        "name": "extract_proposal",
        "description": "Extract key details from a ringi proposal",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The title of the proposal"
                },
                "department": {
                    "type": "string",
                    "description": "The department submitting the proposal"
                },
                "proposer": {
                    "type": "string",
                    "description": "The name of the person proposing"
                },
                "background": {
                    "type": "string",
                    "description": "Background information and context for the proposal"
                },
                "proposal": {
                    "type": "string",
                    "description": "The actual proposal being made"
                },
                "benefits": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of benefits or positive impacts of the proposal"
                },
                "risks": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of potential risks or negative impacts"
                },
                "cost": {
                    "type": "string",
                    "description": "The estimated cost of the proposal"
                },
                "timeline": {
                    "type": "string",
                    "description": "The proposed implementation timeline"
                },
                "approvers": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of people who need to approve this proposal"
                }
            },
            "required": ["title", "department", "proposer", "proposal"]
        }
    }
}

# Tool function definition: Provide feedback on proposal
provide_feedback = {
    "type": "function",
    "function": {
        "name": "provide_feedback",
        "description": "Provide structured feedback on a ringi proposal",
        "parameters": {
            "type": "object",
            "properties": {
                "strengths": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "point": {
                                "type": "string",
                                "description": "A strength of the proposal"
                            },
                            "explanation": {
                                "type": "string",
                                "description": "Explanation of why this is a strength"
                            }
                        },
                        "required": ["point", "explanation"]
                    },
                    "description": "List of strengths in the proposal"
                },
                "weaknesses": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "point": {
                                "type": "string",
                                "description": "A weakness or area for improvement"
                            },
                            "explanation": {
                                "type": "string",
                                "description": "Explanation of the weakness"
                            },
                            "suggestion": {
                                "type": "string",
                                "description": "Suggested improvement"
                            }
                        },
                        "required": ["point", "explanation", "suggestion"]
                    },
                    "description": "List of weaknesses in the proposal"
                },
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "Questions that need clarification"
                },
                "recommendation": {
                    "type": "string",
                    "enum": ["approve", "approve_with_changes", "revise", "reject"],
                    "description": "Overall recommendation"
                },
                "summary": {
                    "type": "string",
                    "description": "Summary of the feedback"
                }
            },
            "required": ["strengths", "weaknesses", "recommendation", "summary"]
        }
    }
}

# WORKFLOW STEP 1: Process initial proposal and extract details
async def process_proposal(step_input):
    try:
        # Initialize tool logging for UI feedback
        tool_log_id = str(uuid.uuid4())
        step_input.additional_data['tool_logs'].append({
            "message": "Analyzing proposal",
            "status": "processing",
            "id": tool_log_id,
        })
        
        # Emit state change event to update UI
        step_input.additional_data["emit_event"](
            StateDeltaEvent(
                type=EventType.STATE_DELTA,
                delta=[
                    {
                        "op": "add",
                        "path": "/tool_logs/-",
                        "value": {
                            "message": "Analyzing proposal",
                            "status": "processing",
                            "id": tool_log_id,
                        },
                    }
                ],
            )
        )
        await asyncio.sleep(0)
        
        # Set system prompt
        messages = step_input.additional_data.get("messages", [])
        if messages and messages[0].role == "system":
            messages[0].content = system_prompt
        else:
            messages.insert(0, {"role": "system", "content": system_prompt})
        
        # Make API call to OpenAI
        model = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = model.chat.completions.create(
            model="gpt-4o",
            messages=[msg.__dict__ if hasattr(msg, '__dict__') else msg for msg in messages],
            tools=[extract_proposal]
        )
        
        # Update tool log status to completed
        index = len(step_input.additional_data['tool_logs']) - 1
        step_input.additional_data["emit_event"](
            StateDeltaEvent(
                type=EventType.STATE_DELTA,
                delta=[
                    {
                        "op": "replace",
                        "path": f"/tool_logs/{index}/status",
                        "value": "completed",
                    }
                ],
            )
        )
        await asyncio.sleep(0)
        
        # Process the AI response
        if response.choices[0].finish_reason == "tool_calls":
            # Convert tool calls to our internal format
            tool_calls = [
                convert_tool_call(tc)
                for tc in response.choices[0].message.tool_calls
            ]
            
            # Emit TOOL_CALL events for each tool call from OpenAI
            print(f"🔶 RINGI AGENT: OpenAI returned {len(tool_calls)} tool call(s)")
            for tc in response.choices[0].message.tool_calls:
                print(f"🔶 RINGI AGENT: Emitting TOOL_CALL events for {tc.function.name}")
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_START,
                    {
                        "toolCallId": tc.id,
                        "toolCallName": tc.function.name
                    }
                )
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_ARGS,
                    {
                        "toolCallId": tc.id,
                        "delta": tc.function.arguments
                    }
                )
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_END,
                    {
                        "toolCallId": tc.id
                    }
                )
            
            # Create assistant message with tool calls
            a_message = AssistantMessage(
                role="assistant", tool_calls=tool_calls, id=response.id
            )
            step_input.additional_data["messages"].append(a_message)
            
            # Extract proposal details for state
            proposal_data = json.loads(tool_calls[0]["function"]["arguments"])
            step_input.additional_data["emit_event"](
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[
                        {
                            "op": "add",
                            "path": "/proposal_data",
                            "value": proposal_data,
                        }
                    ],
                )
            )
        else:
            # If no tool calls, just add the text response
            a_message = AssistantMessage(
                id=response.id,
                content=response.choices[0].message.content,
                role="assistant",
            )
            step_input.additional_data["messages"].append(a_message)
        
        return step_input.additional_data
            
    except Exception as e:
        print(f"Error in process_proposal: {e}")
        # Add empty assistant message to maintain conversation flow
        a_message = AssistantMessage(id=str(uuid.uuid4()), content="", role="assistant")
        step_input.additional_data["messages"].append(a_message)
        return step_input.additional_data


# WORKFLOW STEP 2: Provide structured feedback on the proposal
async def generate_feedback(step_input):
    # Check if previous step generated tool calls
    if not step_input.additional_data["messages"][-1].tool_calls:
        return step_input.additional_data
    
    # Initialize tool logging for feedback generation
    tool_log_id = str(uuid.uuid4())
    step_input.additional_data["tool_logs"].append(
        {
            "id": tool_log_id,
            "message": "Generating feedback",
            "status": "processing",
        }
    )
    
    # Emit UI update event for feedback generation status
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": {
                        "message": "Generating feedback",
                        "status": "processing",
                        "id": tool_log_id,
                    },
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    # Add tool message to confirm extraction
    step_input.additional_data["messages"].append(
        ToolMessage(
            role="tool",
            id=str(uuid.uuid4()),
            content="Proposal details extracted successfully",
            tool_call_id=step_input.additional_data["messages"][-1].tool_calls[0]["id"],
        )
    )
    
    # Get extracted proposal data
    proposal_data = json.loads(step_input.additional_data["messages"][-2].tool_calls[0]["function"]["arguments"])
    
    # Create prompt for feedback generation
    feedback_prompt = f"""
    Please review the following ringi proposal and provide structured feedback:
    
    Title: {proposal_data.get('title', 'Not specified')}
    Department: {proposal_data.get('department', 'Not specified')}
    Proposer: {proposal_data.get('proposer', 'Not specified')}
    
    Background:
    {proposal_data.get('background', 'Not provided')}
    
    Proposal:
    {proposal_data.get('proposal', 'Not provided')}
    
    Benefits:
    {', '.join(proposal_data.get('benefits', ['Not specified']))}
    
    Risks:
    {', '.join(proposal_data.get('risks', ['Not specified']))}
    
    Cost: {proposal_data.get('cost', 'Not specified')}
    Timeline: {proposal_data.get('timeline', 'Not specified')}
    
    Please analyze this proposal thoroughly and provide balanced feedback.
    """
    
    # Make API call to OpenAI for feedback
    try:
        model = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = model.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": feedback_prompt}
            ],
            tools=[provide_feedback]
        )
        
        # Process feedback response
        if response.choices[0].finish_reason == "tool_calls":
            tool_calls = [
                convert_tool_call(tc)
                for tc in response.choices[0].message.tool_calls
            ]
            
            # Emit TOOL_CALL events for each tool call from OpenAI
            print(f"🔶 RINGI AGENT: OpenAI returned {len(tool_calls)} tool call(s) for feedback")
            for tc in response.choices[0].message.tool_calls:
                print(f"🔶 RINGI AGENT: Emitting TOOL_CALL events for {tc.function.name}")
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_START,
                    {
                        "toolCallId": tc.id,
                        "toolCallName": tc.function.name
                    }
                )
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_ARGS,
                    {
                        "toolCallId": tc.id,
                        "delta": tc.function.arguments
                    }
                )
                
                await step_input.additional_data["emit_event"](
                    EventType.TOOL_CALL_END,
                    {
                        "toolCallId": tc.id
                    }
                )
            
            # Add assistant message with feedback
            a_message = AssistantMessage(
                role="assistant", tool_calls=tool_calls, id=response.id
            )
            step_input.additional_data["messages"].append(a_message)
            
            # Extract feedback data for state
            feedback_data = json.loads(tool_calls[0]["function"]["arguments"])
            step_input.additional_data["emit_event"](
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[
                        {
                            "op": "add",
                            "path": "/feedback_data",
                            "value": feedback_data,
                        }
                    ],
                )
            )
        else:
            # Handle text response if no tool calls
            a_message = AssistantMessage(
                id=response.id,
                content=response.choices[0].message.content,
                role="assistant",
            )
            step_input.additional_data["messages"].append(a_message)
    
    except Exception as e:
        print(f"Error generating feedback: {e}")
        # Add error message
        a_message = AssistantMessage(
            id=str(uuid.uuid4()),
            content="I encountered an error while generating feedback. Please try again.",
            role="assistant",
        )
        step_input.additional_data["messages"].append(a_message)
    
    # Mark feedback generation as completed
    index = len(step_input.additional_data["tool_logs"]) - 1
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "replace",
                    "path": f"/tool_logs/{index}/status",
                    "value": "completed",
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    return step_input.additional_data


# WORKFLOW STEP 3: Format and present the final report
async def format_report(step_input):
    # Check if we have feedback to format
    if len(step_input.additional_data["messages"]) < 4 or not step_input.additional_data["messages"][-2].tool_calls:
        return StepOutput(content=step_input.additional_data)
    
    # Initialize tool logging for report formatting
    tool_log_id = str(uuid.uuid4())
    step_input.additional_data["tool_logs"].append(
        {
            "id": tool_log_id,
            "message": "Formatting final report",
            "status": "processing",
        }
    )
    
    # Emit UI update for report formatting status
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": {
                        "message": "Formatting final report",
                        "status": "processing",
                        "id": tool_log_id,
                    },
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    # Add tool message to confirm feedback generation
    step_input.additional_data["messages"].append(
        ToolMessage(
            role="tool",
            id=str(uuid.uuid4()),
            content="Feedback generated successfully",
            tool_call_id=step_input.additional_data["messages"][-2].tool_calls[0]["id"],
        )
    )
    
    # Get proposal and feedback data
    proposal_data = json.loads(step_input.additional_data["messages"][-4].tool_calls[0]["function"]["arguments"])
    feedback_data = json.loads(step_input.additional_data["messages"][-2].tool_calls[0]["function"]["arguments"])
    
    # Format recommendation status
    recommendation = feedback_data.get("recommendation", "").replace("_", " ").title()
    
    # Create formatted report
    report = f"""# Ringi Proposal Review: {proposal_data.get('title', 'Untitled')}

## Proposal Summary
- **Department:** {proposal_data.get('department', 'Not specified')}
- **Proposer:** {proposal_data.get('proposer', 'Not specified')}
- **Cost:** {proposal_data.get('cost', 'Not specified')}
- **Timeline:** {proposal_data.get('timeline', 'Not specified')}

### Background
{proposal_data.get('background', 'Not provided')}

### Proposal
{proposal_data.get('proposal', 'Not provided')}

## Review Feedback

### Recommendation: {recommendation}

### Summary
{feedback_data.get('summary', 'No summary provided')}

### Strengths
"""
    
    # Add strengths
    for strength in feedback_data.get("strengths", []):
        report += f"- **{strength.get('point', '')}**: {strength.get('explanation', '')}\n"
    
    report += "\n### Areas for Improvement\n"
    
    # Add weaknesses
    for weakness in feedback_data.get("weaknesses", []):
        report += f"- **{weakness.get('point', '')}**: {weakness.get('explanation', '')}\n"
        report += f"  *Suggestion:* {weakness.get('suggestion', '')}\n"
    
    # Add questions if any
    if feedback_data.get("questions", []):
        report += "\n### Questions for Clarification\n"
        for question in feedback_data.get("questions", []):
            report += f"- {question}\n"
    
    # Add next steps based on recommendation
    report += "\n## Next Steps\n"
    
    if feedback_data.get("recommendation") == "approve":
        report += "This proposal is approved and ready for implementation as presented."
    elif feedback_data.get("recommendation") == "approve_with_changes":
        report += "This proposal is conditionally approved. Please make the suggested changes before implementation."
    elif feedback_data.get("recommendation") == "revise":
        report += "Please revise this proposal addressing the feedback provided and resubmit for review."
    elif feedback_data.get("recommendation") == "reject":
        report += "This proposal is not approved in its current form. Consider a substantial revision or alternative approaches."
    
    # Add final assistant message with formatted report
    step_input.additional_data["messages"].append(
        AssistantMessage(
            id=str(uuid.uuid4()),
            content=report,
            role="assistant",
        )
    )
    
    # Mark report formatting as completed
    index = len(step_input.additional_data["tool_logs"]) - 1
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "replace",
                    "path": f"/tool_logs/{index}/status",
                    "value": "completed",
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    return StepOutput(content=step_input.additional_data)


# WORKFLOW DEFINITION: Complete ringi system workflow
ringi_workflow = Workflow(
    name="Ringi Decision Making System",
    steps=[process_proposal, generate_feedback, format_report],
)


# UTILITY FUNCTION: Convert OpenAI tool call format
def convert_tool_call(tc):
    return {
        "id": tc.id,
        "type": "function",
        "function": {
            "name": tc.function.name,
            "arguments": tc.function.arguments,
        },
    }
