import openai
from anthropic import Anthropic
from typing import Dict, Any, AsyncGenerator, List
import os
from datetime import datetime
import uuid

from models.chat import ChatMessage, MessageRole, ModelInfo

class AIModelsService:
    def __init__(self):
        # Initialize OpenAI
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        # Initialize Anthropic
        self.anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
        # Available models configuration
        self.models: Dict[str, ModelInfo] = {
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
            'claude-3-opus': ModelInfo(
                id='claude-3-opus',
                name='Claude 3 Opus',
                provider='Anthropic',
                description='Most powerful Claude model',
                max_tokens=4096,
                supports_streaming=True
            ),
            'claude-3-sonnet': ModelInfo(
                id='claude-3-sonnet',
                name='Claude 3 Sonnet',
                provider='Anthropic',
                description='Balanced performance and speed',
                max_tokens=4096,
                supports_streaming=True
            ),
            'claude-3-haiku': ModelInfo(
                id='claude-3-haiku',
                name='Claude 3 Haiku',
                provider='Anthropic',
                description='Fastest Claude model',
                max_tokens=4096,
                supports_streaming=True
            )
        }

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
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """Generate AI response using the specified model"""
        
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        model_info = self.models[model_id]
        
        if model_info.provider == 'OpenAI':
            async for chunk in self._generate_openai_response(model_id, messages, stream):
                yield chunk
        elif model_info.provider == 'Anthropic':
            async for chunk in self._generate_anthropic_response(model_id, messages, stream):
                yield chunk
        else:
            raise ValueError(f"Unsupported provider: {model_info.provider}")

    async def _generate_openai_response(
        self, 
        model_id: str, 
        messages: List[ChatMessage], 
        stream: bool
    ) -> AsyncGenerator[str, None]:
        """Generate response using OpenAI"""
        
        # Convert messages to OpenAI format
        openai_messages = []
        for msg in messages:
            openai_messages.append({
                'role': msg.role.value,
                'content': msg.content
            })
        
        try:
            if stream:
                response = await openai.ChatCompletion.acreate(
                    model=model_id,
                    messages=openai_messages,
                    stream=True,
                    max_tokens=self.models[model_id].max_tokens
                )
                
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                response = await openai.ChatCompletion.acreate(
                    model=model_id,
                    messages=openai_messages,
                    max_tokens=self.models[model_id].max_tokens
                )
                yield response.choices[0].message.content
                
        except Exception as e:
            yield f"Error: {str(e)}"

    async def _generate_anthropic_response(
        self, 
        model_id: str, 
        messages: List[ChatMessage], 
        stream: bool
    ) -> AsyncGenerator[str, None]:
        """Generate response using Anthropic"""
        
        # Convert messages to Anthropic format
        # Anthropic expects a system message and user/assistant messages
        system_message = ""
        anthropic_messages = []
        
        for msg in messages:
            if msg.role == MessageRole.SYSTEM:
                system_message = msg.content
            else:
                anthropic_messages.append({
                    'role': msg.role.value,
                    'content': msg.content
                })
        
        try:
            if stream:
                async with self.anthropic.messages.stream(
                    model=model_id,
                    max_tokens=self.models[model_id].max_tokens,
                    system=system_message if system_message else None,
                    messages=anthropic_messages
                ) as stream:
                    async for text in stream.text_stream:
                        yield text
            else:
                response = await self.anthropic.messages.create(
                    model=model_id,
                    max_tokens=self.models[model_id].max_tokens,
                    system=system_message if system_message else None,
                    messages=anthropic_messages
                )
                yield response.content[0].text
                
        except Exception as e:
            yield f"Error: {str(e)}"

    def create_message(self, role: MessageRole, content: str, model: str = None) -> ChatMessage:
        """Create a new chat message"""
        return ChatMessage(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            model=model
        )

# Global instance
# ai_service = AIModelsService()  # Replaced by litellm_service
