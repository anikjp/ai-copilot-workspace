"""
Clerk Authentication Module
===========================

Clerk-based authentication system with JWT token validation.
"""

from .clerk_provider import ClerkProvider
from .clerk_config import clerk_config
from .clerk_idp_manager import clerk_idp_manager, ClerkIDPManager

# Import the base types from clerk_provider
from .clerk_provider import UserInfo, TokenInfo

__all__ = [
    "ClerkProvider",
    "clerk_config",
    "clerk_idp_manager", 
    "ClerkIDPManager",
    "UserInfo",
    "TokenInfo"
]