from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models.chat import ChatConversation, ConversationTitleUpdateRequest, MessageRole
from services.dynamodb import DynamoDBService
from middleware.auth import get_current_user

router = APIRouter()
db_service = DynamoDBService()

@router.get("/", response_model=List[ChatConversation])
async def get_conversations(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user's conversations"""
    try:
        user_id = current_user["id"]
        conversations = await db_service.get_user_conversations(user_id)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_conversations = conversations[start_idx:end_idx]
        
        return paginated_conversations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversation_id}", response_model=ChatConversation)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific conversation"""
    try:
        user_id = current_user["id"]
        conversation = await db_service.get_conversation(conversation_id, user_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: ConversationTitleUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update conversation title"""
    try:
        user_id = current_user["id"]
        conversation = await db_service.get_conversation(conversation_id, user_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation.title = request.title
        conversation.updated_at = datetime.utcnow()
        
        await db_service.update_conversation(conversation)
        
        return {"message": "Title updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        user_id = current_user["id"]
        conversation = await db_service.get_conversation(conversation_id, user_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        await db_service.delete_conversation(conversation_id, user_id)
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{conversation_id}/messages")
async def add_message_to_conversation(
    conversation_id: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """Add a message to an existing conversation"""
    try:
        user_id = current_user["id"]
        conversation = await db_service.get_conversation(conversation_id, user_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Add user message
        user_message = {
            'id': str(uuid.uuid4()),
            'role': MessageRole.USER,
            'content': message,
            'timestamp': datetime.utcnow().isoformat()
        }
        conversation.messages.append(user_message)
        conversation.updated_at = datetime.utcnow()
        
        await db_service.update_conversation(conversation)
        
        return {"message": "Message added successfully", "message_id": user_message['id']}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
