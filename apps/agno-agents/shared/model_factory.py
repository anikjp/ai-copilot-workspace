# Model Factory for All Agents
# This module provides a unified interface for different AI models (OpenAI, GROQ, Gemini)

from openai import OpenAI
from groq import Groq as GroqClient
import google.generativeai as genai
from typing import Dict, Any, List, Optional, Union
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

class ModelFactory:
    """Factory class for creating different AI model instances"""
    
    SUPPORTED_MODELS = {
        # OpenAI Models
        "gpt-4": {
            "provider": "openai",
            "model_name": "gpt-4",
            "description": "Most capable GPT-4 model for complex reasoning"
        },
        "gpt-4-turbo": {
            "provider": "openai", 
            "model_name": "gpt-4-turbo",
            "description": "Faster GPT-4 variant with improved efficiency"
        },
        "gpt-4o": {
            "provider": "openai",
            "model_name": "gpt-4o",
            "description": "GPT-4 Optimized model"
        },
        "gpt-4o-mini": {
            "provider": "openai",
            "model_name": "gpt-4o-mini",
            "description": "Compact GPT-4o model for faster responses"
        },
        "gpt-4.1": {
            "provider": "openai",
            "model_name": "gpt-4.1",
            "description": "Latest GPT-4.1 model"
        },
        "gpt-4.1-mini": {
            "provider": "openai",
            "model_name": "gpt-4.1-mini", 
            "description": "Compact GPT-4.1 model for faster responses"
        },
        "gpt-3.5-turbo": {
            "provider": "openai",
            "model_name": "gpt-3.5-turbo",
            "description": "Fast and efficient model for most tasks"
        },
        # GROQ Models
        "llama-3.1-8b-instant": {
            "provider": "groq",
            "model_name": "llama-3.1-8b-instant",
            "description": "Fast Llama 3.1 8B model on GROQ"
        },
        "llama-3.3-70b-versatile": {
            "provider": "groq",
            "model_name": "llama-3.3-70b-versatile",
            "description": "Llama 3.3 70B versatile model on GROQ"
        },
        # Google Gemini Models
        "gemini-pro": {
            "provider": "gemini",
            "model_name": "gemini-pro",
            "description": "Google's Gemini Pro model for text generation"
        },
        "gemini-pro-vision": {
            "provider": "gemini",
            "model_name": "gemini-pro-vision",
            "description": "Google's Gemini Pro Vision model for multimodal tasks"
        },
        "gemini-ultra": {
            "provider": "gemini",
            "model_name": "gemini-ultra",
            "description": "Google's most powerful Gemini model"
        }
    }
    
    @classmethod
    def get_supported_models(cls) -> Dict[str, Dict[str, str]]:
        """Get list of all supported models with their descriptions"""
        return cls.SUPPORTED_MODELS
    
    @classmethod
    def create_model_client(cls, model_id: str) -> Union[OpenAI, GroqClient, Any]:
        """Create a model client instance for the specified model"""
        if model_id not in cls.SUPPORTED_MODELS:
            raise ValueError(f"Unsupported model: {model_id}. Supported models: {list(cls.SUPPORTED_MODELS.keys())}")
        
        model_config = cls.SUPPORTED_MODELS[model_id]
        
        if model_config["provider"] == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI models")
            return OpenAI(api_key=api_key)
        
        elif model_config["provider"] == "groq":
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable is required for GROQ models")
            return GroqClient(api_key=api_key)
        
        elif model_config["provider"] == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required for Gemini models")
            genai.configure(api_key=api_key)
            return genai
        
        raise ValueError(f"Unsupported provider: {model_config['provider']}")
    
    @classmethod
    def get_model_name(cls, model_id: str) -> str:
        """Get the actual model name for API calls"""
        if model_id not in cls.SUPPORTED_MODELS:
            raise ValueError(f"Unsupported model: {model_id}")
        return cls.SUPPORTED_MODELS[model_id]["model_name"]
    
    @classmethod
    def validate_model_id(cls, model_id: str) -> bool:
        """Validate if the model ID is supported"""
        return model_id in cls.SUPPORTED_MODELS

class ModelManager:
    """Manager class for handling model operations in workflows"""
    
    def __init__(self, model_id: str):
        """Initialize ModelManager with a specific model"""
        if not ModelFactory.validate_model_id(model_id):
            raise ValueError(f"Invalid model ID: {model_id}")
        
        self.model_id = model_id
        self.client = ModelFactory.create_model_client(model_id)
        self.model_name = ModelFactory.get_model_name(model_id)
        self.provider = ModelFactory.SUPPORTED_MODELS[model_id]["provider"]
    
    def chat_completion(self, messages: List[Dict[str, Any]], tools: Optional[List[Dict[str, Any]]] = None, **kwargs) -> Any:
        """Create a chat completion using the configured model"""
        if self.provider == "openai" or self.provider == "groq":
            completion_params = {
                "model": self.model_name,
                "messages": messages,
                **kwargs
            }
            
            if tools:
                completion_params["tools"] = tools
            
            return self.client.chat.completions.create(**completion_params)
        
        elif self.provider == "gemini":
            # Convert messages to Gemini format
            gemini_messages = self._convert_to_gemini_format(messages)
            model = self.client.GenerativeModel(self.model_name)
            
            # Handle tools for Gemini if provided
            if tools:
                # Convert tools to Gemini format if needed
                gemini_tools = self._convert_tools_to_gemini_format(tools)
                return model.generate_content(gemini_messages, tools=gemini_tools, **kwargs)
            else:
                return model.generate_content(gemini_messages, **kwargs)
        
        raise ValueError(f"Unsupported provider for chat completion: {self.provider}")
    
    def _convert_to_gemini_format(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert OpenAI message format to Gemini format"""
        gemini_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                # Gemini doesn't have system messages, prepend to user
                system_content = msg["content"]
                # Find the first user message to prepend the system content
                for i, next_msg in enumerate(messages):
                    if next_msg["role"] == "user":
                        messages[i]["content"] = f"System: {system_content}\n\nUser: {next_msg['content']}"
                        break
            elif msg["role"] == "user":
                gemini_messages.append({"role": "user", "parts": [{"text": msg["content"]}]})
            elif msg["role"] == "assistant":
                gemini_messages.append({"role": "model", "parts": [{"text": msg["content"]}]})
        
        return gemini_messages
    
    def _convert_tools_to_gemini_format(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert OpenAI tools format to Gemini format"""
        # Gemini has a different tool calling format
        # This is a simplified conversion - may need enhancement based on specific tool requirements
        gemini_tools = []
        
        for tool in tools:
            gemini_tool = {
                "function_declarations": [{
                    "name": tool["function"]["name"],
                    "description": tool["function"].get("description", ""),
                    "parameters": tool["function"].get("parameters", {})
                }]
            }
            gemini_tools.append(gemini_tool)
        
        return gemini_tools
    
    def get_model_info(self) -> Dict[str, str]:
        """Get information about the current model"""
        return {
            "model_id": self.model_id,
            "model_name": self.model_name,
            "description": ModelFactory.SUPPORTED_MODELS[self.model_id]["description"],
            "provider": ModelFactory.SUPPORTED_MODELS[self.model_id]["provider"]
        }
