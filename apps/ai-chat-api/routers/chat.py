from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator, List, Dict, Any, Optional
import json
import uuid
from datetime import datetime

from models.chat import ChatRequest, ChatResponse, ChatMessage, MessageRole, ChatConversation
from services.litellm_service import litellm_service
from services.dynamodb import DynamoDBService
from middleware.auth import get_current_user

router = APIRouter()
db_service = DynamoDBService()

@router.post("/send")
async def send_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message and get AI response"""
    try:
        user_id = current_user["id"]
        
        # Validate model
        try:
            model_info = litellm_service.get_model_info(request.model_id)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Get or create conversation
        conversation = None
        if request.conversation_id:
            conversation = await db_service.get_conversation(request.conversation_id, user_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            conversation = {
                'id': conversation_id,
                'user_id': user_id,
                'title': request.message[:50] + "..." if len(request.message) > 50 else request.message,
                'model_id': request.model_id,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'messages': []
            }
        
        # Add user message with attachments
        user_message = litellm_service.create_message(
            role=MessageRole.USER,
            content=request.message,
            attachments=request.attachments
        )
        conversation['messages'].append(user_message.dict())
        
        # Generate AI response
        if request.stream:
            return StreamingResponse(
                stream_chat_response(conversation, request.model_id),
                media_type="text/plain"
            )
        else:
            # Non-streaming response
            response_text = ""
            async for chunk in litellm_service.generate_response(
                request.model_id, 
                [ChatMessage(**msg) for msg in conversation['messages']],
                stream=False
            ):
                response_text += chunk
            
            # Add AI response to conversation
            ai_message = litellm_service.create_message(
                role=MessageRole.ASSISTANT,
                content=response_text,
                model=request.model_id
            )
            conversation['messages'].append(ai_message.dict())
            conversation['updated_at'] = datetime.utcnow().isoformat()
            
            # Save conversation
            await db_service.save_conversation(conversation)
            
            return ChatResponse(
                message=response_text,
                conversation_id=conversation['id'],
                model_used=request.model_id,
                timestamp=datetime.utcnow()
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def stream_chat_response(conversation: dict, model_id: str) -> AsyncGenerator[str, None]:
    """Stream chat response"""
    try:
        response_text = ""
        
        # Generate streaming response
        async for chunk in litellm_service.generate_response(
            model_id,
            [ChatMessage(**msg) for msg in conversation['messages']],
            stream=True
        ):
            response_text += chunk
            yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        
        # Add AI response to conversation
        ai_message = litellm_service.create_message(
            role=MessageRole.ASSISTANT,
            content=response_text,
            model=model_id
        )
        conversation['messages'].append(ai_message.dict())
        conversation['updated_at'] = datetime.utcnow().isoformat()
        
        # Save conversation
        await db_service.save_conversation(conversation)
        
        # Send final response
        yield f"data: {json.dumps({'content': '', 'done': True, 'conversation_id': conversation['id']})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
