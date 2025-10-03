"""
Authentication middleware for the AI Chat API
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import os

# For now, we'll use a simple mock authentication
# In production, you'd integrate with your actual auth system
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Mock authentication function
    In production, this would validate the JWT token and return user info
    """
    # For development, we'll accept any token and return a mock user
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Mock user - in production, decode and validate the JWT
    mock_user = {
        "id": "user123",
        "email": "user@example.com",
        "name": "Test User"
    }
    
    return mock_user

# Optional: Function to get user without requiring authentication (for development)
async def get_current_user_optional() -> Optional[Dict[str, Any]]:
    """Optional authentication - returns None if no auth provided"""
    try:
        return await get_current_user()
    except HTTPException:
        return None
