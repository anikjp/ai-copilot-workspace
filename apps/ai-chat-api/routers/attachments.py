"""
Attachment Support Router for LiteLLM
Handles image uploads and vision models
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import base64
from datetime import datetime
import uuid

from models.chat import ChatMessage, MessageRole
from services.litellm_service import litellm_service
from services.dynamodb import db_service
from services.attachment_service import attachment_service
from middleware.auth import get_current_user
import litellm

router = APIRouter()

# Supported file types
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
}

SUPPORTED_TEXT_TYPES = {
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv"
}

@router.post("/upload-image")
async def upload_image_chat(
    file: UploadFile = File(...),
    message: str = Form(...),
    model_id: str = Form("gpt-4o"),
    conversation_id: Optional[str] = Form(None),
    stream: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload an image and chat with vision models
    Supports: JPG, PNG, GIF, WebP
    """
    # Validate file type
    if file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported types: {', '.join(SUPPORTED_IMAGE_TYPES)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )
    
    try:
        # Convert image to base64
        base64_image = base64.b64encode(file_content).decode('utf-8')
        image_url = f"data:{file.content_type};base64,{base64_image}"
        
        # Ensure we're using a vision-capable model
        vision_models = ["gpt-4o", "gpt-4o-mini", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "gemini-pro-vision"]
        if model_id not in vision_models:
            model_id = "gpt-4o"  # Default to GPT-4o for vision
        
        # Prepare messages for vision model
        vision_messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": message
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ]
        
        # Generate response using LiteLLM
        if stream:
            async def generate_stream():
                try:
                    response = await litellm.acompletion(
                        model=model_id,
                        messages=vision_messages,
                        stream=True,
                        temperature=0.7,
                        max_tokens=1000
                    )
                    
                    full_response = ""
                    async for chunk in response:
                        if hasattr(chunk, 'choices') and chunk.choices:
                            choice = chunk.choices[0]
                            if hasattr(choice, 'delta') and hasattr(choice.delta, 'content'):
                                if choice.delta.content:
                                    content = choice.delta.content
                                    full_response += content
                                    yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                    
                    # Save conversation to DynamoDB
                    if conversation_id:
                        conversation = await db_service.get_conversation_by_id(conversation_id)
                        if conversation:
                            # Add user message with attachment info
                            user_message = ChatMessage(
                                role=MessageRole.USER,
                                content=f"{message} [Image: {file.filename}]",
                                timestamp=datetime.utcnow()
                            )
                            # Add AI response
                            ai_message = ChatMessage(
                                role=MessageRole.ASSISTANT,
                                content=full_response,
                                timestamp=datetime.utcnow(),
                                model=model_id
                            )
                            conversation.messages.extend([user_message, ai_message])
                            await db_service.save_conversation(conversation.dict())
                    
                    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/plain",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
            )
        
        else:
            # Non-streaming response
            response = await litellm.acompletion(
                model=model_id,
                messages=vision_messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            # Save conversation if provided
            if conversation_id:
                conversation = await db_service.get_conversation_by_id(conversation_id)
                if conversation:
                    user_message = ChatMessage(
                        role=MessageRole.USER,
                        content=f"{message} [Image: {file.filename}]",
                        timestamp=datetime.utcnow()
                    )
                    ai_message = ChatMessage(
                        role=MessageRole.ASSISTANT,
                        content=ai_response,
                        timestamp=datetime.utcnow(),
                        model=model_id
                    )
                    conversation.messages.extend([user_message, ai_message])
                    await db_service.save_conversation(conversation.dict())
            
            return {
                "response": ai_response,
                "model": model_id,
                "attachment_info": {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "size": len(file_content),
                    "processed": True
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/upload-document")
async def upload_document_chat(
    file: UploadFile = File(...),
    message: str = Form(...),
    model_id: str = Form("gpt-4o"),
    conversation_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a text document and include its content in the chat
    Supports: TXT, MD, JSON
    """
    # Validate file type
    if file.content_type not in SUPPORTED_TEXT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported types: {', '.join(SUPPORTED_TEXT_TYPES)}"
        )
    
    # Validate file size (max 1MB for text files)
    max_size = 1 * 1024 * 1024  # 1MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 1MB for text files."
        )
    
    try:
        # Read file content as text
        text_content = file_content.decode('utf-8')
        
        # Prepare enhanced message with file content
        enhanced_message = f"""
{message}

[Document: {file.filename}]
---
{text_content}
---

Please analyze the document content above and respond to my message.
"""
        
        # Create messages for the model
        messages = [
            {
                "role": "user",
                "content": enhanced_message
            }
        ]
        
        # Generate response
        response = await litellm.acompletion(
            model=model_id,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        ai_response = response.choices[0].message.content
        
        # Save conversation if provided
        if conversation_id:
            conversation = await db_service.get_conversation_by_id(conversation_id)
            if conversation:
                user_message = ChatMessage(
                    role=MessageRole.USER,
                    content=f"{message} [Document: {file.filename}]",
                    timestamp=datetime.utcnow()
                )
                ai_message = ChatMessage(
                    role=MessageRole.ASSISTANT,
                    content=ai_response,
                    timestamp=datetime.utcnow(),
                    model=model_id
                )
                conversation.messages.extend([user_message, ai_message])
                await db_service.save_conversation(conversation.dict())
        
        return {
            "response": ai_response,
            "model": model_id,
            "attachment_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content),
                "processed": True,
                "preview": text_content[:200] + "..." if len(text_content) > 200 else text_content
            }
        }
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File is not a valid text file or uses unsupported encoding."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/supported-types")
async def get_supported_file_types(
    current_user: dict = Depends(get_current_user)
):
    """Get list of supported file types for attachments"""
    return {
        "image_types": list(SUPPORTED_IMAGE_TYPES),
        "text_types": list(SUPPORTED_TEXT_TYPES),
        "vision_models": ["gpt-4o", "gpt-4o-mini", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "gemini-pro-vision"],
        "max_sizes": {
            "images": "10MB",
            "text_files": "1MB"
        },
        "features": {
            "image_analysis": True,
            "document_processing": True,
            "streaming_responses": True,
            "conversation_history": True
        }
    }

@router.post("/generate-image")
async def generate_image(
    prompt: str = Form(...),
    model_id: str = Form("dall-e-2"),
    size: str = Form("1024x1024"),
    quality: str = Form("standard"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate images using LiteLLM image generation
    Supports: DALL-E, Stable Diffusion, etc.
    """
    try:
        # Generate image using LiteLLM
        response = await litellm.aimage_generation(
            model=model_id,
            prompt=prompt,
            size=size,
            quality=quality,
            n=1
        )
        
        return {
            "image_url": response.data[0].url,
            "prompt": prompt,
            "model": model_id,
            "size": size,
            "quality": quality
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")
