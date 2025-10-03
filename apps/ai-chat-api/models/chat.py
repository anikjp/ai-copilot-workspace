from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: str
    role: MessageRole
    content: str
    timestamp: datetime
    model: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatConversation(BaseModel):
    id: str
    user_id: str
    title: str
    model_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessage] = []
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    model_id: str
    conversation_id: Optional[str] = None
    stream: bool = True
    attachments: Optional[List[Dict[str, Any]]] = None  # Support for attachment references

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    model_used: str
    timestamp: datetime

class ConversationCreate(BaseModel):
    title: str
    model_id: str

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model_id: Optional[str] = None

class ConversationTitleUpdateRequest(BaseModel):
    title: str

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    max_tokens: Optional[int] = None
    supports_streaming: bool = True
