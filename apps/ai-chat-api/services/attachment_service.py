"""
Attachment processing service
Handles file uploads, image processing, text extraction, etc.
"""
import base64
import io
import uuid
from typing import Optional, Dict, Any, List
from PIL import Image
import mimetypes
import os
import tempfile

from models.attachments import AttachmentInfo, AttachmentType, AttachmentResponse

class AttachmentService:
    """Service for handling file attachments and processing"""
    
    def __init__(self):
        # Maximum file sizes (in bytes)
        self.max_image_size = 10 * 1024 * 1024  # 10MB
        self.max_text_size = 5 * 1024 * 1024    # 5MB
        self.max_document_size = 20 * 1024 * 1024  # 20MB
        
        # Supported formats
        self.supported_image_types = {
            "image/jpeg", "image/jpg", "image/png", 
            "image/gif", "image/webp", "image/bmp"
        }
        self.supported_text_types = {
            "text/plain", "text/markdown", "text/csv",
            "application/json", "text/html"
        }
        self.supported_document_types = {
            "application/pdf"
        }
    
    def get_attachment_type(self, content_type: str) -> AttachmentType:
        """Determine attachment type from content type"""
        if content_type in self.supported_image_types:
            return AttachmentType.IMAGE
        elif content_type in self.supported_text_types:
            return AttachmentType.TEXT
        elif content_type in self.supported_document_types:
            return AttachmentType.DOCUMENT
        else:
            return AttachmentType.DOCUMENT  # Default fallback
    
    def validate_file_size(self, file_size: int, attachment_type: AttachmentType) -> bool:
        """Validate file size based on type"""
        if attachment_type == AttachmentType.IMAGE:
            return file_size <= self.max_image_size
        elif attachment_type == AttachmentType.TEXT:
            return file_size <= self.max_text_size
        elif attachment_type == AttachmentType.DOCUMENT:
            return file_size <= self.max_document_size
        return False
    
    async def process_image(self, file_content: bytes, filename: str, content_type: str) -> AttachmentInfo:
        """Process uploaded image file"""
        try:
            # Open and validate image
            image = Image.open(io.BytesIO(file_content))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (max 2048x2048 for vision models)
            max_size = (2048, 2048)
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Convert back to bytes
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG', quality=85)
            processed_content = buffer.getvalue()
            
            # Encode to base64 for API transmission
            base64_data = base64.b64encode(processed_content).decode('utf-8')
            
            return AttachmentInfo(
                id=str(uuid.uuid4()),
                filename=filename,
                content_type="image/jpeg",  # Standardize to JPEG
                size=len(processed_content),
                attachment_type=AttachmentType.IMAGE,
                base64_data=base64_data
            )
        except Exception as e:
            raise Exception(f"Failed to process image: {str(e)}")
    
    async def process_text_file(self, file_content: bytes, filename: str, content_type: str) -> AttachmentInfo:
        """Process uploaded text file"""
        try:
            # Decode text content
            text_content = file_content.decode('utf-8')
            
            return AttachmentInfo(
                id=str(uuid.uuid4()),
                filename=filename,
                content_type=content_type,
                size=len(file_content),
                attachment_type=AttachmentType.TEXT,
                text_content=text_content
            )
        except Exception as e:
            raise Exception(f"Failed to process text file: {str(e)}")
    
    async def process_pdf(self, file_content: bytes, filename: str) -> AttachmentInfo:
        """Process PDF file (basic implementation)"""
        try:
            # For now, just store the PDF as base64
            # In a full implementation, you'd extract text using PyPDF2 or similar
            base64_data = base64.b64encode(file_content).decode('utf-8')
            
            return AttachmentInfo(
                id=str(uuid.uuid4()),
                filename=filename,
                content_type="application/pdf",
                size=len(file_content),
                attachment_type=AttachmentType.DOCUMENT,
                base64_data=base64_data,
                text_content="[PDF content - text extraction not implemented]"
            )
        except Exception as e:
            raise Exception(f"Failed to process PDF: {str(e)}")
    
    async def process_attachment(self, file_content: bytes, filename: str, content_type: str) -> AttachmentResponse:
        """Main method to process any attachment"""
        try:
            # Determine attachment type
            attachment_type = self.get_attachment_type(content_type)
            
            # Validate file size
            if not self.validate_file_size(len(file_content), attachment_type):
                return AttachmentResponse(
                    success=False,
                    error=f"File size exceeds limit for {attachment_type.value} files"
                )
            
            # Process based on type
            if attachment_type == AttachmentType.IMAGE:
                attachment_info = await self.process_image(file_content, filename, content_type)
            elif attachment_type == AttachmentType.TEXT:
                attachment_info = await self.process_text_file(file_content, filename, content_type)
            elif attachment_type == AttachmentType.DOCUMENT:
                if content_type == "application/pdf":
                    attachment_info = await self.process_pdf(file_content, filename)
                else:
                    return AttachmentResponse(
                        success=False,
                        error=f"Unsupported document type: {content_type}"
                    )
            else:
                return AttachmentResponse(
                    success=False,
                    error=f"Unsupported file type: {content_type}"
                )
            
            return AttachmentResponse(
                success=True,
                attachment_info=attachment_info
            )
            
        except Exception as e:
            return AttachmentResponse(
                success=False,
                error=f"Failed to process attachment: {str(e)}"
            )
    
    def format_vision_message(self, text: str, image_base64: str) -> List[Dict[str, Any]]:
        """Format message with image for vision models"""
        return [
            {
                "type": "text",
                "text": text
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_base64}"
                }
            }
        ]
    
    def get_supported_formats(self) -> Dict[str, List[str]]:
        """Get all supported file formats"""
        return {
            "images": list(self.supported_image_types),
            "texts": list(self.supported_text_types),
            "documents": list(self.supported_document_types)
        }

# Global instance
attachment_service = AttachmentService()
