# Generic Agent Prompts
# This module contains prompts and tools used by the generic agent

# System prompt for generic agent
GENERIC_SYSTEM_PROMPT = """You are a versatile AI assistant capable of handling a wide range of tasks.

Your capabilities include:
- Analyzing text and providing insights
- Generating comprehensive responses to user queries
- Solving problems using structured reasoning
- Creating various types of content
- Researching topics and providing information

Adapt your responses based on:
- The user's specific needs and questions
- The selected AI model's capabilities
- The appropriate level of detail for the context

Always strive to be helpful, accurate, and clear in your communications.
"""

# Generic tools that can be used with any model
generic_tools = [
    {
        "type": "function",
        "function": {
            "name": "analyze_text",
            "description": "Analyze any text content and provide insights",
            "parameters": {
                "type": "object",
                "properties": {
                    "text_content": {
                        "type": "string",
                        "description": "The text content to analyze"
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["sentiment", "summary", "key_points", "detailed_analysis", "creative_writing"],
                        "description": "Type of analysis to perform"
                    },
                    "focus_area": {
                        "type": "string",
                        "description": "Specific area to focus on (optional)"
                    }
                },
                "required": ["text_content", "analysis_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_response",
            "description": "Generate a comprehensive response to user queries",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's query or question"
                    },
                    "response_style": {
                        "type": "string",
                        "enum": ["professional", "casual", "technical", "creative", "analytical"],
                        "description": "Style of response to generate"
                    },
                    "format": {
                        "type": "string",
                        "enum": ["paragraph", "bullet_points", "structured", "detailed"],
                        "description": "Format for the response"
                    },
                    "include_examples": {
                        "type": "boolean",
                        "description": "Whether to include examples in the response"
                    }
                },
                "required": ["query", "response_style"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "solve_problem",
            "description": "Solve problems using structured reasoning",
            "parameters": {
                "type": "object",
                "properties": {
                    "problem_description": {
                        "type": "string",
                        "description": "Detailed description of the problem"
                    },
                    "problem_type": {
                        "type": "string",
                        "enum": ["mathematical", "logical", "business", "technical", "creative"],
                        "description": "Type of problem to solve"
                    },
                    "solution_approach": {
                        "type": "string",
                        "enum": ["step_by_step", "analytical", "creative", "systematic"],
                        "description": "Approach to use for solving"
                    },
                    "constraints": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Any constraints or limitations"
                    }
                },
                "required": ["problem_description", "problem_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_content",
            "description": "Create various types of content based on specifications",
            "parameters": {
                "type": "object",
                "properties": {
                    "content_type": {
                        "type": "string",
                        "enum": ["article", "email", "social_media", "presentation", "report"],
                        "description": "Type of content to create"
                    },
                    "topic": {
                        "type": "string",
                        "description": "The topic or subject matter"
                    },
                    "tone": {
                        "type": "string",
                        "enum": ["formal", "casual", "technical", "persuasive", "informative"],
                        "description": "Tone of the content"
                    },
                    "length": {
                        "type": "string",
                        "enum": ["short", "medium", "long"],
                        "description": "Desired length of the content"
                    }
                },
                "required": ["content_type", "topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "research_topic",
            "description": "Research a topic and provide comprehensive information",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic to research"
                    },
                    "research_depth": {
                        "type": "string",
                        "enum": ["brief", "comprehensive", "in_depth"],
                        "description": "Depth of research required"
                    },
                    "focus_areas": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific areas to focus on"
                    }
                },
                "required": ["topic"]
            }
        }
    }
]
