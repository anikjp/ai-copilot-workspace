# BPP Agent Prompts
# This module contains prompts and tools used by the business process planning agent

# System prompt for BPP assistant
system_prompt = """You are a Business Process Planning Assistant. You help organizations optimize their business processes, 
create workflow automations, and improve operational efficiency.

Your expertise includes:
- Business process analysis and optimization
- Workflow automation design
- Process documentation creation
- Compliance assessment
- Resource allocation optimization

When helping users, follow these guidelines:
1. Understand the specific business process or challenge they're facing
2. Analyze current state and identify inefficiencies
3. Recommend practical improvements with clear implementation steps
4. Consider compliance requirements and organizational constraints
5. Provide measurable outcomes and success metrics

Always maintain a professional tone and focus on actionable recommendations.
"""

# Tool definitions for BPP Assistant
bpp_tools = [
    {
        "type": "function",
        "function": {
            "name": "analyze_business_process",
            "description": "Analyze existing business processes and identify optimization opportunities",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_name": {
                        "type": "string",
                        "description": "Name of the business process to analyze"
                    },
                    "process_description": {
                        "type": "string",
                        "description": "Detailed description of the current process"
                    },
                    "department": {
                        "type": "string",
                        "description": "Department or team responsible for the process"
                    }
                },
                "required": ["process_name", "process_description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_workflow_automation",
            "description": "Design automated workflows for business processes",
            "parameters": {
                "type": "object",
                "properties": {
                    "workflow_name": {
                        "type": "string",
                        "description": "Name of the workflow to create"
                    },
                    "trigger_conditions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Conditions that trigger the workflow"
                    },
                    "steps": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Sequential steps in the workflow"
                    }
                },
                "required": ["workflow_name", "steps"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_process_documentation",
            "description": "Generate comprehensive documentation for business processes",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {
                        "type": "string",
                        "description": "Unique identifier for the process"
                    },
                    "documentation_type": {
                        "type": "string",
                        "enum": ["standard_operating_procedure", "workflow_diagram", "user_guide", "technical_specification"],
                        "description": "Type of documentation to generate"
                    },
                    "audience": {
                        "type": "string",
                        "description": "Target audience for the documentation"
                    }
                },
                "required": ["process_id", "documentation_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "assess_compliance_requirements",
            "description": "Assess compliance requirements for business processes",
            "parameters": {
                "type": "object",
                "properties": {
                    "industry": {
                        "type": "string",
                        "description": "Industry sector (e.g., healthcare, finance)"
                    },
                    "region": {
                        "type": "string",
                        "description": "Geographic region for compliance assessment"
                    },
                    "process_type": {
                        "type": "string",
                        "description": "Type of process being assessed"
                    }
                },
                "required": ["industry", "process_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "optimize_resource_allocation",
            "description": "Optimize resource allocation for business processes",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {
                        "type": "string",
                        "description": "Identifier for the process to optimize"
                    },
                    "resource_types": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Types of resources to optimize (e.g., staff, equipment)"
                    },
                    "constraints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Constraints to consider during optimization"
                    }
                },
                "required": ["process_id"]
            }
        }
    }
]
