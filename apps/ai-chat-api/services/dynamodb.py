import boto3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from botocore.exceptions import ClientError
import os

from models.chat import ChatConversation, ChatMessage, MessageRole

class DynamoDBService:
    def __init__(self):
        # Use preprod profile from local AWS configuration
        session = boto3.Session(profile_name='preprod')
        self.dynamodb = session.resource(
            'dynamodb',
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.table_name = os.getenv('DYNAMODB_TABLE_NAME', 'chat-conversations')
        self.table = self.dynamodb.Table(self.table_name)
        
        # Ensure table exists
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """Ensure the DynamoDB table exists, create if it doesn't"""
        try:
            self.table.load()
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                self._create_table()
            else:
                raise

    def _create_table(self):
        """Create the DynamoDB table"""
        table = self.dynamodb.create_table(
            TableName=self.table_name,
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'user-index',
                    'KeySchema': [
                        {
                            'AttributeName': 'user_id',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Wait for table to be created
        table.wait_until_exists()

    async def create_conversation(self, conversation: ChatConversation) -> ChatConversation:
        """Create a new conversation"""
        try:
            item = {
                'id': conversation.id,
                'user_id': conversation.user_id,
                'title': conversation.title,
                'model_id': conversation.model_id,
                'created_at': conversation.created_at.isoformat(),
                'updated_at': conversation.updated_at.isoformat(),
                'messages': [
                    {
                        'id': msg.id,
                        'role': msg.role.value,
                        'content': msg.content,
                        'timestamp': msg.timestamp.isoformat(),
                        'model': msg.model,
                        'metadata': msg.metadata or {}
                    }
                    for msg in conversation.messages
                ],
                'metadata': conversation.metadata or {}
            }
            
            self.table.put_item(Item=item)
            return conversation
        except ClientError as e:
            raise Exception(f"Error creating conversation: {e}")

    async def get_conversation(self, conversation_id: str, user_id: str) -> Optional[ChatConversation]:
        """Get a conversation by ID"""
        try:
            response = self.table.get_item(
                Key={'id': conversation_id}
            )
            
            if 'Item' not in response:
                return None
                
            item = response['Item']
            
            # Verify user ownership
            if item['user_id'] != user_id:
                return None
                
            return ChatConversation(
                id=item['id'],
                user_id=item['user_id'],
                title=item['title'],
                model_id=item['model_id'],
                created_at=datetime.fromisoformat(item['created_at']),
                updated_at=datetime.fromisoformat(item['updated_at']),
                messages=[
                    ChatMessage(
                        id=msg['id'],
                        role=MessageRole(msg['role']),
                        content=msg['content'],
                        timestamp=datetime.fromisoformat(msg['timestamp']),
                        model=msg.get('model'),
                        metadata=msg.get('metadata', {})
                    )
                    for msg in item['messages']
                ],
                metadata=item.get('metadata', {})
            )
        except ClientError as e:
            raise Exception(f"Error getting conversation: {e}")

    async def update_conversation(self, conversation: ChatConversation) -> ChatConversation:
        """Update an existing conversation"""
        try:
            item = {
                'id': conversation.id,
                'user_id': conversation.user_id,
                'title': conversation.title,
                'model_id': conversation.model_id,
                'created_at': conversation.created_at.isoformat(),
                'updated_at': conversation.updated_at.isoformat(),
                'messages': [
                    {
                        'id': msg.id,
                        'role': msg.role.value,
                        'content': msg.content,
                        'timestamp': msg.timestamp.isoformat(),
                        'model': msg.model,
                        'metadata': msg.metadata or {}
                    }
                    for msg in conversation.messages
                ],
                'metadata': conversation.metadata or {}
            }
            
            self.table.put_item(Item=item)
            return conversation
        except ClientError as e:
            raise Exception(f"Error updating conversation: {e}")

    async def list_conversations(self, user_id: str, limit: int = 50) -> List[ChatConversation]:
        """List conversations for a user"""
        try:
            response = self.table.query(
                IndexName='user-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id},
                Limit=limit,
                ScanIndexForward=False  # Sort by creation time descending
            )
            
            conversations = []
            for item in response['Items']:
                conversations.append(ChatConversation(
                    id=item['id'],
                    user_id=item['user_id'],
                    title=item['title'],
                    model_id=item['model_id'],
                    created_at=datetime.fromisoformat(item['created_at']),
                    updated_at=datetime.fromisoformat(item['updated_at']),
                    messages=[
                        ChatMessage(
                            id=msg['id'],
                            role=MessageRole(msg['role']),
                            content=msg['content'],
                            timestamp=datetime.fromisoformat(msg['timestamp']),
                            model=msg.get('model'),
                            metadata=msg.get('metadata', {})
                        )
                        for msg in item['messages']
                    ],
                    metadata=item.get('metadata', {})
                ))
                
            return conversations
        except ClientError as e:
            raise Exception(f"Error listing conversations: {e}")

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation"""
        try:
            # First verify ownership
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False
                
            self.table.delete_item(Key={'id': conversation_id})
            return True
        except ClientError as e:
            raise Exception(f"Error deleting conversation: {e}")

    async def save_conversation(self, conversation_data: dict) -> dict:
        """Save or update a conversation (compatibility method)"""
        try:
            # Check if conversation exists
            existing = await self.get_conversation(conversation_data['id'], conversation_data['user_id'])
            
            if existing:
                # Update existing conversation
                conversation_obj = ChatConversation(**conversation_data)
                return (await self.update_conversation(conversation_obj)).dict()
            else:
                # Create new conversation
                conversation_obj = ChatConversation(**conversation_data)
                return (await self.create_conversation(conversation_obj)).dict()
        except Exception as e:
            raise Exception(f"Error saving conversation: {e}")

    async def get_user_conversations(self, user_id: str) -> List[ChatConversation]:
        """Get all conversations for a user"""
        try:
            response = self.table.query(
                IndexName='user-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={
                    ':user_id': user_id
                },
                ScanIndexForward=False  # Sort by creation date descending
            )
            
            conversations = []
            for item in response.get('Items', []):
                # Convert DynamoDB item to ChatConversation
                conversation_data = {
                    'id': item['id'],
                    'user_id': item['user_id'],
                    'title': item.get('title', 'New Conversation'),
                    'model_id': item.get('model_id', 'gpt-4o-mini'),
                    'messages': [ChatMessage(**msg) for msg in item.get('messages', [])],
                    'created_at': datetime.fromisoformat(item['created_at']) if 'created_at' in item else datetime.utcnow(),
                    'updated_at': datetime.fromisoformat(item['updated_at']) if 'updated_at' in item else datetime.utcnow()
                }
                conversations.append(ChatConversation(**conversation_data))
            
            return conversations
        except ClientError as e:
            raise Exception(f"Error getting user conversations: {e}")

    async def delete_conversation(self, conversation_id: str, user_id: str):
        """Delete a conversation"""
        try:
            # First verify the conversation belongs to the user
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                raise ValueError("Conversation not found or doesn't belong to user")
            
            # Delete the conversation
            self.table.delete_item(
                Key={'id': conversation_id}
            )
        except ClientError as e:
            raise Exception(f"Error deleting conversation: {e}")

# Global instance
db_service = DynamoDBService()
