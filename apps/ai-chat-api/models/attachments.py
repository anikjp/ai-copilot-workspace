"""
Pydantic models for attachment handling
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class AttachmentType(str, Enum):
    IMAGE = "image"
    TEXT = "text" 
    DOCUMENT = "document"
    AUDIO = "audio"
    VIDEO = "video"

class AttachmentInfo(BaseModel):
    """Information about an uploaded attachment"""
    id: str
    filename: str
    content_type: str
    size: int
    attachment_type: AttachmentType
    url: Optional[str] = None
    base64_data: Optional[str] = None
    text_content: Optional[str] = None  # For extracted text from documents

class VisionRequest(BaseModel):
    """Request for vision/image analysis"""
    message: str
    model_id: str = "gpt-4o"  # Default to GPT-4 with vision
    conversation_id: Optional[str] = None
    stream: bool = False
    temperature: float = 0.7
    max_tokens: Optional[int] = 1000

class DocumentRequest(BaseModel):
    """Request for document analysis"""
    message: str
    model_id: str = "gpt-4o"
    conversation_id: Optional[str] = None
    stream: bool = False
    temperature: float = 0.7
    max_tokens: Optional[int] = 2000

class AttachmentResponse(BaseModel):
    """Response from attachment processing"""
    success: bool
    attachment_info: Optional[AttachmentInfo] = None
    error: Optional[str] = None

class SupportedFormats(BaseModel):
    """Supported file formats for different attachment types"""
    images: List[str] = [
        "image/jpeg", "image/jpg", "image/png", 
        "image/gif", "image/webp", "image/bmp"
    ]
    texts: List[str] = [
        "text/plain", "text/markdown", "text/csv",
        "application/json", "text/html"
    ]
    documents: List[str] = [
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    audio: List[str] = [
        "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg"
    ]
    video: List[str] = [
        "video/mp4", "video/avi", "video/mov", "video/webm"
    ]
