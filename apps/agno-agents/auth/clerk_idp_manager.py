"""
Clerk-Focused IDP Manager
========================

Simplified IDP manager focused on Clerk integration with fallback to custom OAuth.
"""

from typing import Optional, Dict, Any
from .clerk_provider import ClerkProvider, UserInfo, IDPType
from .clerk_config import clerk_config
import logging

logger = logging.getLogger(__name__)

class ClerkIDPManager:
    """Clerk-focused IDP manager"""
    
    def __init__(self):
        self.clerk_provider = None
        
        # Initialize Clerk if configured
        if clerk_config.is_configured():
            try:
                self.clerk_provider = ClerkProvider()
                logger.info("✅ Clerk provider initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Clerk provider: {e}")
        else:
            logger.warning("⚠️  Clerk not configured")
    
    def validate_token(self, token: str) -> Optional[UserInfo]:
        """Validate token using Clerk"""
        
        # Try Clerk if available
        if self.clerk_provider:
            try:
                user_info = self.clerk_provider.validate_token(token)
                if user_info:
                    logger.info("✅ Token validated using Clerk provider")
                    return user_info
            except Exception as e:
                logger.debug(f"Clerk validation failed: {e}")
        
        logger.warning("❌ Clerk provider could not validate the token")
        return None
    
    def is_clerk_configured(self) -> bool:
        """Check if Clerk is properly configured"""
        return self.clerk_provider is not None
    
    def get_available_providers(self) -> list:
        """Get list of available providers"""
        providers = []
        if self.is_clerk_configured():
            providers.append("clerk")
        return providers

# Global Clerk-focused IDP manager
clerk_idp_manager = ClerkIDPManager()
