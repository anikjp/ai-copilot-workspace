"""
Clerk Configuration
==================

Configuration and setup for Clerk IDP integration.
"""

import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def load_env_file():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load .env file
load_env_file()

class ClerkConfig:
    """Clerk configuration manager"""
    
    def __init__(self):
        self.api_key = os.getenv("CLERK_SECRET_KEY")
        self.publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY")
        self.base_url = os.getenv("CLERK_BASE_URL", "https://api.clerk.com/v1")
        
        # Calculate the correct JWKS URL from publishable key
        self.jwks_url = self._get_jwks_url()
        
        # Validate configuration
        if not self.api_key:
            logger.warning("CLERK_SECRET_KEY not found in environment variables")
        if not self.publishable_key:
            logger.warning("CLERK_PUBLISHABLE_KEY not found in environment variables")
    
    def _get_jwks_url(self) -> str:
        """Get the correct JWKS URL from the publishable key"""
        if not self.publishable_key:
            return f"{self.base_url}/jwks"
        
        try:
            # Extract instance ID from publishable key
            if self.publishable_key.startswith("pk_test_") or self.publishable_key.startswith("pk_live_"):
                instance_part = self.publishable_key.replace("pk_test_", "").replace("pk_live_", "")
                
                # Decode base64 to get the actual instance domain
                import base64
                decoded = base64.b64decode(instance_part + "==").decode('utf-8').rstrip('$')
                
                # Construct JWKS URL
                jwks_url = f"https://{decoded}/.well-known/jwks.json"
                logger.info(f"Using Clerk JWKS URL: {jwks_url}")
                return jwks_url
            else:
                logger.warning("Invalid publishable key format")
                return f"{self.base_url}/jwks"
        except Exception as e:
            logger.warning(f"Error parsing publishable key: {e}")
            return f"{self.base_url}/jwks"
    
    def is_configured(self) -> bool:
        """Check if Clerk is properly configured"""
        return bool(self.api_key and self.publishable_key)
    
    def get_config(self) -> Dict[str, Any]:
        """Get Clerk configuration dictionary"""
        return {
            "api_key": self.api_key,
            "publishable_key": self.publishable_key,
            "base_url": self.base_url,
            "jwks_url": self.jwks_url
        }

# Global Clerk configuration
clerk_config = ClerkConfig()

# Example environment variables for Clerk
CLERK_ENV_EXAMPLE = """
# Add these to your .env file in the agno-agents directory:

# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_BASE_URL=https://api.clerk.com/v1

# Optional: Custom domain (if using custom Clerk domain)
# CLERK_BASE_URL=https://your-domain.clerk.accounts.dev/v1
"""
