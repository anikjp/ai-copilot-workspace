import litellm
from litellm import completion, acompletion
from typing import Dict, Any, AsyncGenerator, List, Optional
import os
from datetime import datetime
import uuid
import json

from models.chat import ChatMessage, MessageRole, ModelInfo

class LiteLLMService:
    def __init__(self):
        # Set up LiteLLM configuration
        self._setup_litellm()
        
        # Available models configuration with LiteLLM model names
        self.models: Dict[str, ModelInfo] = {
            # OpenAI Models
            'gpt-4o': ModelInfo(
                id='gpt-4o',
                name='GPT-4o',
                provider='OpenAI',
                description='Most capable GPT-4 model with vision capabilities',
                max_tokens=4096,
                supports_streaming=True
            ),
            'gpt-4o-mini': ModelInfo(
                id='gpt-4o-mini',
                name='GPT-4o Mini',
                provider='OpenAI',
                description='Faster and cheaper GPT-4 model',
                max_tokens=4096,
                supports_streaming=True
            ),
            'gpt-3.5-turbo': ModelInfo(
                id='gpt-3.5-turbo',
                name='GPT-3.5 Turbo',
                provider='OpenAI',
                description='Fast and efficient model for most tasks',
                max_tokens=4096,
                supports_streaming=True
            ),
            # Anthropic Models
            'claude-3-opus-20240229': ModelInfo(
                id='claude-3-opus-20240229',
                name='Claude 3 Opus',
                provider='Anthropic',
                description='Most powerful Claude model',
                max_tokens=4096,
                supports_streaming=True
            ),
            'claude-3-sonnet-20240229': ModelInfo(
                id='claude-3-sonnet-20240229',
                name='Claude 3 Sonnet',
                provider='Anthropic',
                description='Balanced performance and speed',
                max_tokens=4096,
                supports_streaming=True
            ),
            'claude-3-haiku-20240307': ModelInfo(
                id='claude-3-haiku-20240307',
                name='Claude 3 Haiku',
                provider='Anthropic',
                description='Fastest Claude model',
                max_tokens=4096,
                supports_streaming=True
            ),
            # Google Models
            'gemini-pro': ModelInfo(
                id='gemini-pro',
                name='Gemini Pro',
                provider='Google',
                description='Google\'s most capable model',
                max_tokens=4096,
                supports_streaming=True
            ),
            'gemini-pro-vision': ModelInfo(
                id='gemini-pro-vision',
                name='Gemini Pro Vision',
                provider='Google',
                description='Google\'s model with vision capabilities',
                max_tokens=4096,
                supports_streaming=True
            ),
            # Cohere Models
            'command': ModelInfo(
                id='command',
                name='Command',
                provider='Cohere',
                description='Cohere\'s most capable model',
                max_tokens=4096,
                supports_streaming=True
            ),
            'command-light': ModelInfo(
                id='command-light',
                name='Command Light',
                provider='Cohere',
                description='Faster Cohere model',
                max_tokens=4096,
                supports_streaming=True
            ),
            # Groq Models
            'llama2-70b-4096': ModelInfo(
                id='llama2-70b-4096',
                name='Llama 2 70B',
                provider='Groq',
                description='Meta\'s Llama 2 70B via Groq',
                max_tokens=4096,
                supports_streaming=True
            ),
            'mixtral-8x7b-32768': ModelInfo(
                id='mixtral-8x7b-32768',
                name='Mixtral 8x7B',
                provider='Groq',
                description='Mixtral 8x7B via Groq',
                max_tokens=4096,
                supports_streaming=True
            ),
        }

    def _setup_litellm(self):
        """Set up LiteLLM with environment variables"""
        # Set API keys for different providers
        if os.getenv('OPENAI_API_KEY'):
            litellm.openai_key = os.getenv('OPENAI_API_KEY')
        
        if os.getenv('ANTHROPIC_API_KEY'):
            litellm.anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        
        if os.getenv('GOOGLE_API_KEY'):
            litellm.google_key = os.getenv('GOOGLE_API_KEY')
        
        if os.getenv('COHERE_API_KEY'):
            litellm.cohere_key = os.getenv('COHERE_API_KEY')
        
        if os.getenv('GROQ_API_KEY'):
            litellm.groq_key = os.getenv('GROQ_API_KEY')
        
        # Set up logging
        litellm.set_verbose = True
        
        # Set up success/failure callbacks for monitoring
        litellm.success_callback = ["langfuse"]
        litellm.failure_callback = ["langfuse"]

    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available models"""
        return list(self.models.values())

    def get_model_info(self, model_id: str) -> ModelInfo:
        """Get information about a specific model"""
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        return self.models[model_id]

    async def generate_response(
        self, 
        model_id: str, 
        messages: List[ChatMessage], 
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Generate AI response using LiteLLM"""
        
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        model_info = self.models[model_id]
        
        # Convert messages to LiteLLM format
        litellm_messages = []
        for msg in messages:
            # Handle attachments for vision models
            if msg.attachments and any(att.get('type') == 'image' for att in msg.attachments):
                # For vision models, include images in the message content
                message_content = [{"type": "text", "text": msg.content}]
                for attachment in msg.attachments:
                    if attachment.get('type') == 'image' and attachment.get('url'):
                        message_content.append({
                            "type": "image_url",
                            "image_url": {"url": attachment['url']}
                        })
                litellm_messages.append({
                    'role': msg.role.value,
                    'content': message_content
                })
            else:
                litellm_messages.append({
                    'role': msg.role.value,
                    'content': msg.content
                })
        
        # Set max_tokens if not provided
        if max_tokens is None:
            max_tokens = model_info.max_tokens
        
        try:
            if stream:
                # Use streaming completion
                response = await acompletion(
                    model=model_id,
                    messages=litellm_messages,
                    stream=True,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                async for chunk in response:
                    if hasattr(chunk, 'choices') and chunk.choices:
                        choice = chunk.choices[0]
                        if hasattr(choice, 'delta') and hasattr(choice.delta, 'content'):
                            if choice.delta.content:
                                yield choice.delta.content
            else:
                # Use non-streaming completion
                response = await acompletion(
                    model=model_id,
                    messages=litellm_messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                if hasattr(response, 'choices') and response.choices:
                    choice = response.choices[0]
                    if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
                        yield choice.message.content
                        
        except Exception as e:
            yield f"Error: {str(e)}"

    def create_message(self, role: MessageRole, content: str, model: str = None, attachments: Optional[List[Dict[str, Any]]] = None) -> ChatMessage:
        """Create a new chat message"""
        return ChatMessage(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            model=model,
            attachments=attachments
        )

    def get_model_costs(self, model_id: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """Get cost information for a model"""
        try:
            # Use LiteLLM's cost tracking
            cost = litellm.completion_cost(
                model=model_id,
                prompt_tokens=input_tokens,
                completion_tokens=output_tokens
            )
            return {
                'input_cost': cost.get('input_cost', 0.0),
                'output_cost': cost.get('output_cost', 0.0),
                'total_cost': cost.get('total_cost', 0.0)
            }
        except Exception as e:
            return {
                'input_cost': 0.0,
                'output_cost': 0.0,
                'total_cost': 0.0,
                'error': str(e)
            }

    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return list(set(model.provider for model in self.models.values()))

    def get_models_by_provider(self, provider: str) -> List[ModelInfo]:
        """Get models filtered by provider"""
        return [model for model in self.models.values() if model.provider == provider]

# Global instance
litellm_service = LiteLLMService()
