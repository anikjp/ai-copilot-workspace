# BPP Agent
# This module provides a workflow for business process planning and optimization

from agno.workflow.v2 import Step, Workflow, StepOutput
from ag_ui.core import EventType, StateDeltaEvent
from ag_ui.core import AssistantMessage, ToolMessage
from typing import Dict, Any, List
import json
import uuid
import asyncio
from openai import OpenAI
from dotenv import load_dotenv
import os
from .prompts import system_prompt, bpp_tools

# Load environment variables from .env file (contains API keys, etc.)
load_dotenv()

# WORKFLOW STEP 1: Process user query and analyze business process
async def process_query(step_input):
    try:
        # Initialize tool logging for UI feedback
        tool_log_id = str(uuid.uuid4())
        step_input.additional_data['tool_logs'].append({
            "message": "Analyzing business process query",
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
                            "message": "Analyzing business process query",
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
            tools=bpp_tools
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
            print(f"🔶 BPP AGENT: OpenAI returned {len(tool_calls)} tool call(s)")
            for tc in response.choices[0].message.tool_calls:
                print(f"🔶 BPP AGENT: Emitting TOOL_CALL events for {tc.function.name}")
                
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
            
            # Extract tool call data for state
            tool_call_data = json.loads(tool_calls[0]["function"]["arguments"])
            step_input.additional_data["emit_event"](
                StateDeltaEvent(
                    type=EventType.STATE_DELTA,
                    delta=[
                        {
                            "op": "add",
                            "path": "/bpp_data",
                            "value": {
                                "tool": tool_calls[0]["function"]["name"],
                                "data": tool_call_data
                            },
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
        print(f"Error in process_query: {e}")
        # Add empty assistant message to maintain conversation flow
        a_message = AssistantMessage(id=str(uuid.uuid4()), content="", role="assistant")
        step_input.additional_data["messages"].append(a_message)
        return step_input.additional_data


# WORKFLOW STEP 2: Process tool call and generate appropriate response
async def handle_tool_execution(step_input):
    # Check if previous step generated tool calls
    if not step_input.additional_data["messages"][-1].tool_calls:
        return step_input.additional_data
    
    # Initialize tool logging for execution
    tool_log_id = str(uuid.uuid4())
    step_input.additional_data["tool_logs"].append(
        {
            "id": tool_log_id,
            "message": "Processing business process data",
            "status": "processing",
        }
    )
    
    # Emit UI update event for processing status
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": {
                        "message": "Processing business process data",
                        "status": "processing",
                        "id": tool_log_id,
                    },
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    # Get tool call information
    tool_call = step_input.additional_data["messages"][-1].tool_calls[0]
    tool_name = tool_call["function"]["name"]
    tool_args = json.loads(tool_call["function"]["arguments"])
    
    # Create response based on tool type
    response_content = ""
    
    if tool_name == "analyze_business_process":
        response_content = await execute_analyze_business_process(tool_args)
    elif tool_name == "create_workflow_automation":
        response_content = await execute_create_workflow_automation(tool_args)
    elif tool_name == "generate_process_documentation":
        response_content = await execute_generate_documentation(tool_args)
    elif tool_name == "assess_compliance_requirements":
        response_content = await execute_assess_compliance(tool_args)
    elif tool_name == "optimize_resource_allocation":
        response_content = await execute_optimize_resources(tool_args)
    else:
        response_content = "Tool execution not implemented for this function."
    
    # Add tool message with execution results
    step_input.additional_data["messages"].append(
        ToolMessage(
            role="tool",
            id=str(uuid.uuid4()),
            content=response_content,
            tool_call_id=tool_call["id"],
        )
    )
    
    # Mark tool execution as completed
    index = len(step_input.additional_data["tool_logs"]) - 1
    step_input.additional_data["emit_event"](
        StateDeltaState(
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


# WORKFLOW STEP 3: Generate final response and recommendations
async def generate_recommendations(step_input):
    # Check if we have tool execution results
    if len(step_input.additional_data["messages"]) < 3 or step_input.additional_data["messages"][-1].role != "tool":
        return StepOutput(content=step_input.additional_data)
    
    # Initialize tool logging for recommendation generation
    tool_log_id = str(uuid.uuid4())
    step_input.additional_data["tool_logs"].append(
        {
            "id": tool_log_id,
            "message": "Generating recommendations",
            "status": "processing",
        }
    )
    
    # Emit UI update for recommendation generation status
    step_input.additional_data["emit_event"](
        StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[
                {
                    "op": "add",
                    "path": "/tool_logs/-",
                    "value": {
                        "message": "Generating recommendations",
                        "status": "processing",
                        "id": tool_log_id,
                    },
                }
            ],
        )
    )
    await asyncio.sleep(0)
    
    # Get tool execution results
    tool_result = step_input.additional_data["messages"][-1].content
    
    # Make API call to OpenAI for final recommendations
    try:
        model = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = model.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": step_input.additional_data["messages"][-3].content},
                {"role": "assistant", "content": "I'll analyze this for you."},
                {"role": "tool", "content": tool_result},
                {"role": "user", "content": "Please provide your final recommendations based on this analysis."}
            ]
        )
        
        # Add final recommendations
        step_input.additional_data["messages"].append(
            AssistantMessage(
                id=response.id,
                content=response.choices[0].message.content,
                role="assistant",
            )
        )
    
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        # Add error message
        step_input.additional_data["messages"].append(
            AssistantMessage(
                id=str(uuid.uuid4()),
                content="I encountered an error while generating recommendations. Please try again.",
                role="assistant",
            )
        )
    
    # Mark recommendation generation as completed
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


# TOOL EXECUTION FUNCTIONS

async def execute_analyze_business_process(args):
    """Execute the analyze_business_process tool"""
    process_name = args.get("process_name", "Unnamed Process")
    process_description = args.get("process_description", "")
    department = args.get("department", "Not specified")
    
    # Simulate analysis with structured response
    response = f"""## Business Process Analysis: {process_name}

### Process Overview
Department: {department}
Description: {process_description}

### Efficiency Analysis
- **Current State**: The process involves multiple manual steps and approval chains.
- **Bottlenecks**: Manual data entry, approval delays, and lack of visibility.
- **Redundancies**: Multiple verification steps that could be consolidated.

### Optimization Opportunities
1. **Automation Potential**: High - 70% of steps could be automated.
2. **Integration Needs**: Connecting with existing CRM and ERP systems.
3. **Decision Points**: Reduce approval layers from 4 to 2.

### Estimated Impact
- **Time Savings**: 65% reduction in process completion time.
- **Cost Reduction**: 40% decrease in operational costs.
- **Error Reduction**: 80% fewer processing errors.

### Next Steps
1. Map detailed process flow with stakeholders
2. Identify specific automation technologies
3. Develop implementation roadmap with timelines
"""
    
    await asyncio.sleep(1)  # Simulate processing time
    return response


async def execute_create_workflow_automation(args):
    """Execute the create_workflow_automation tool"""
    workflow_name = args.get("workflow_name", "Unnamed Workflow")
    trigger_conditions = args.get("trigger_conditions", [])
    steps = args.get("steps", [])
    
    # Format trigger conditions
    triggers_formatted = "\n".join([f"- {trigger}" for trigger in trigger_conditions]) if trigger_conditions else "- Manual trigger required"
    
    # Format workflow steps
    steps_formatted = "\n".join([f"{i+1}. {step}" for i, step in enumerate(steps)])
    
    # Simulate workflow creation with structured response
    response = f"""## Workflow Automation: {workflow_name}

### Trigger Conditions
{triggers_formatted}

### Workflow Steps
{steps_formatted}

### Technical Implementation
- **Integration Points**: Email system, CRM, document management system
- **Authentication**: OAuth 2.0 for secure service connections
- **Data Handling**: Encrypted transfer with field-level validation
- **Error Handling**: Automatic retry with escalation after 3 failures

### Monitoring & Metrics
- Process completion time
- Success/failure rate
- User intervention frequency
- Resource utilization

### Deployment Plan
1. Development environment setup
2. Integration testing with mock data
3. User acceptance testing
4. Phased rollout with monitoring

The workflow has been designed with scalability in mind and can handle up to 500 concurrent processes.
"""
    
    await asyncio.sleep(1)  # Simulate processing time
    return response


async def execute_generate_documentation(args):
    """Execute the generate_process_documentation tool"""
    process_id = args.get("process_id", "Unknown")
    doc_type = args.get("documentation_type", "standard_operating_procedure")
    audience = args.get("audience", "General users")
    
    # Generate different documentation based on type
    if doc_type == "standard_operating_procedure":
        response = f"""## Standard Operating Procedure: Process {process_id}
### Target Audience: {audience}

### Purpose
This SOP establishes the standard procedures for executing and maintaining the business process.

### Scope
This procedure applies to all staff involved in the process execution.

### Responsibilities
- **Process Owner**: Overall accountability
- **Process Operators**: Day-to-day execution
- **Quality Control**: Compliance verification

### Procedure
1. **Initiation Phase**
   - Verify prerequisites
   - Gather required inputs
   - Validate data completeness

2. **Execution Phase**
   - Process data according to business rules
   - Document exceptions
   - Apply approval workflows

3. **Completion Phase**
   - Verify outputs
   - Distribute to stakeholders
   - Archive process instance

### Quality Control
- Regular audits
- Performance metrics review
- Continuous improvement feedback

### References
- Related policies
- System documentation
- Training materials
"""
    elif doc_type == "workflow_diagram":
        response = f"""## Workflow Diagram: Process {process_id}
### Target Audience: {audience}

```
flowchart TD
    A["Start Process"] --> B{"Input Validation"}
    B -->|Valid| C["Process Data"]
    B -->|Invalid| D["Return to Submitter"]
    C --> E{"Approval Required?"}
    E -->|Yes| F["Route for Approval"]
    E -->|No| G["Complete Processing"]
    F --> H{"Approved?"}
    H -->|Yes| G
    H -->|No| I["Request Revisions"]
    I --> B
    G --> J["Notify Stakeholders"]
    J --> K["Archive Process"]
    K --> L["End Process"]
```

### Diagram Legend
- Diamond shapes: Decision points
- Rectangular shapes: Process steps
- Arrows: Process flow direction

### Key Decision Points
1. Input validation
2. Approval routing
3. Final disposition

### Process Metrics
- Average completion time: 2.5 days
- Approval rate: 85%
- Revision frequency: 15%
"""
    else:
        response = f"""## {doc_type.replace('_', ' ').title()}: Process {process_id}
### Target Audience: {audience}

This documentation has been generated for the specified process.
The document includes all relevant information for the {audience}.

Key sections include:
1. Process overview
2. Detailed procedures
3. Technical specifications
4. Reference materials
5. Support information

Please refer to the full documentation for complete details.
"""
    
    await asyncio.sleep(1)  # Simulate processing time
    return response


async def execute_assess_compliance(args):
    """Execute the assess_compliance_requirements tool"""
    industry = args.get("industry", "General")
    region = args.get("region", "Global")
    process_type = args.get("process_type", "General business process")
    
    # Simulate compliance assessment with structured response
    response = f"""## Compliance Assessment: {process_type}
### Industry: {industry}
### Region: {region}

### Applicable Regulations
1. **Data Protection**
   - GDPR (European Union)
   - CCPA (California, USA)
   - LGPD (Brazil)

2. **Industry-Specific**
   - {industry}-related regulations
   - International standards (ISO 27001, ISO 9001)

3. **Regional Requirements**
   - {region} local regulations
   - Cross-border data transfer requirements

### Compliance Gap Analysis
| Requirement | Current Status | Gap | Remediation |
|-------------|---------------|-----|-------------|
| Data Storage | Partially Compliant | Retention policies undefined | Implement data lifecycle management |
| User Consent | Non-Compliant | No consent tracking | Add consent management system |
| Audit Trails | Compliant | None | Continue monitoring |
| Access Controls | Partially Compliant | Role definitions unclear | Implement RBAC system |

### Risk Assessment
- **High Risk Areas**: Personal data processing, cross-border transfers
- **Medium Risk Areas**: Documentation, audit procedures
- **Low Risk Areas**: Physical security, staff training

### Compliance Roadmap
1. Address high-risk gaps (30 days)
2. Implement policy updates (60 days)
3. Conduct staff training (90 days)
4. Perform compliance audit (120 days)

Regular monitoring and updates will be required as regulations evolve.
"""
    
    await asyncio.sleep(1)  # Simulate processing time
    return response


async def execute_optimize_resources(args):
    """Execute the optimize_resource_allocation tool"""
    process_id = args.get("process_id", "Unknown")
    resource_types = args.get("resource_types", [])
    constraints = args.get("constraints", [])
    
    # Format resource types
    resources_formatted = "\n".join([f"- {resource}" for resource in resource_types]) if resource_types else "- No specific resources defined"
    
    # Format constraints
    constraints_formatted = "\n".join([f"- {constraint}" for constraint in constraints]) if constraints else "- No constraints specified"
    
    # Simulate resource optimization with structured response
    response = f"""## Resource Optimization: Process {process_id}

### Resources Analyzed
{resources_formatted}

### Constraints Considered
{constraints_formatted}

### Current Allocation Analysis
- **Utilization Rate**: 65% average across resources
- **Bottleneck Resources**: Data processing, approval steps
- **Underutilized Resources**: Verification, documentation

### Optimization Recommendations
1. **Rebalance Workload**
   - Shift 30% of verification tasks to underutilized staff
   - Implement parallel processing where possible

2. **Technology Enhancements**
   - Automate data validation (est. 40% time savings)
   - Implement approval workflows (est. 60% time savings)

3. **Process Restructuring**
   - Combine redundant verification steps
   - Implement batch processing for similar items

### Expected Outcomes
- **Resource Utilization**: Increase to 85% (balanced)
- **Process Throughput**: Increase by 40%
- **Cost Efficiency**: 25% reduction in resource costs
- **Quality Impact**: Neutral or positive with proper controls

### Implementation Timeline
- Quick wins: Implementable within 2 weeks
- Medium-term: 1-2 months for technology changes
- Long-term: 3-6 months for full process restructuring
"""
    
    await asyncio.sleep(1)  # Simulate processing time
    return response


# WORKFLOW DEFINITION: Complete BPP workflow
bpp_assistant_workflow = Workflow(
    name="Business Process Planning Assistant",
    steps=[process_query, handle_tool_execution, generate_recommendations],
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
