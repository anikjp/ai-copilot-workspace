"""
Clerk Authentication Provider
============================

Integration with Clerk for user management and authentication.
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
from .clerk_config import clerk_config
import requests
import logging

logger = logging.getLogger(__name__)

class IDPType(Enum):
    """Supported Identity Provider types"""
    CLERK = "clerk"

@dataclass
class UserInfo:
    """Standardized user information from Clerk"""
    user_id: str
    email: str
    name: str
    org_id: Optional[str] = None
    org_name: Optional[str] = None
    org_role: Optional[str] = None
    permissions: List[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.permissions is None:
            self.permissions = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class TokenInfo:
    """Standardized token information from Clerk"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    refresh_token: Optional[str] = None
    scope: Optional[str] = None
    user_info: Optional[UserInfo] = None

class IDPProvider:
    """Abstract base class for Identity Provider integrations"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.provider_type = self.get_provider_type()
    
    def get_provider_type(self) -> IDPType:
        """Return the provider type"""
        pass
    
    def validate_token(self, token: str) -> Optional[UserInfo]:
        """Validate token and return user information"""
        pass
    
    def refresh_token(self, refresh_token: str) -> Optional[TokenInfo]:
        """Refresh access token using refresh token"""
        pass
    
    def revoke_token(self, token: str) -> bool:
        """Revoke/revoke a token"""
        pass

class ClerkProvider(IDPProvider):
    """Clerk authentication provider"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or {})
        # Use global clerk config if no config provided
        if not config:
            config = clerk_config.get_config()
        
        self.api_key = config.get("api_key")
        self.publishable_key = config.get("publishable_key")
        self.base_url = config.get("base_url", "https://api.clerk.com/v1")
        self.jwks_url = config.get("jwks_url", f"{self.base_url}/jwks")
    
    def get_provider_type(self) -> IDPType:
        return IDPType.CLERK
    
    def validate_token(self, token: str) -> Optional[UserInfo]:
        """Validate Clerk JWT token"""
        try:
            # Clerk uses JWT tokens that can be validated locally
            import jwt
            import json
            import ssl
            
            # Get the key ID from token header
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                logger.error("No 'kid' found in token header")
                return None
            
            # Fetch JWKS manually to avoid SSL issues
            import urllib.request
            import urllib.error
            
            # Create SSL context that doesn't verify certificates (for development)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            try:
                with urllib.request.urlopen(self.jwks_url, context=ssl_context) as response:
                    jwks_data = json.loads(response.read().decode('utf-8'))
            except Exception as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                return None
            
            # Find the correct key
            signing_key = None
            for key in jwks_data.get('keys', []):
                if key.get('kid') == kid:
                    signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                    break
            
            if not signing_key:
                logger.error(f"No matching key found for kid: {kid}")
                return None
            
            # Decode and validate token
            # Note: Clerk tokens use 'azp' (authorized party) instead of 'aud' (audience)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                options={"verify_exp": True, "verify_aud": False}  # Disable audience verification for Clerk
            )
            
            # Extract user information from JWT template
            user_id = payload.get("sub") or payload.get("user_id")
            email = payload.get("email", "")
            name = payload.get("name", "")
            first_name = payload.get("first_name", "")
            last_name = payload.get("last_name", "")
            image_url = payload.get("image_url", "")
            
            # If name is empty but we have first/last name, construct it
            if not name and (first_name or last_name):
                name = f"{first_name} {last_name}".strip()
            
            # If still no email/name, fallback to API fetch (for backward compatibility)
            if not email or not name:
                user_details = self._fetch_user_details(user_id)
                if user_details:
                    email = email or user_details.get("email_addresses", [{}])[0].get("email_address", "")
                    name = name or user_details.get("first_name", "") + " " + user_details.get("last_name", "")
                    name = name.strip()
            
            # Extract organization information from Clerk metadata
            org_id = payload.get("org_id")
            org_name = payload.get("org_name")
            org_role = payload.get("org_role")
            
            return UserInfo(
                user_id=user_id,
                email=email,
                name=name,
                org_id=org_id,
                org_name=org_name,
                org_role=org_role,
                permissions=self._get_permissions_from_role(org_role),
                metadata={
                    **payload,
                    "first_name": first_name,
                    "last_name": last_name,
                    "image_url": image_url
                }
            )
            
        except Exception as e:
            logger.error(f"Clerk token validation failed: {e}")
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[TokenInfo]:
        """Refresh Clerk token"""
        try:
            response = requests.post(
                f"{self.base_url}/tokens/refresh",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={"refresh_token": refresh_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                return TokenInfo(
                    access_token=data["access_token"],
                    token_type=data.get("token_type", "Bearer"),
                    expires_in=data.get("expires_in", 3600),
                    refresh_token=data.get("refresh_token")
                )
            
        except Exception as e:
            logger.error(f"Clerk token refresh failed: {e}")
        
        return None
    
    def revoke_token(self, token: str) -> bool:
        """Revoke Clerk token"""
        try:
            response = requests.post(
                f"{self.base_url}/tokens/revoke",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={"token": token}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Clerk token revocation failed: {e}")
            return False
    
    def _fetch_user_details(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user details from Clerk API"""
        if not self.api_key or not user_id:
            return None
            
        try:
            import urllib.request
            import urllib.parse
            import ssl
            
            # Create SSL context for development
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Build API URL
            api_url = f"{self.base_url}/users/{user_id}"
            
            # Create request
            request = urllib.request.Request(api_url)
            request.add_header("Authorization", f"Bearer {self.api_key}")
            request.add_header("Content-Type", "application/json")
            
            # Make request
            with urllib.request.urlopen(request, context=ssl_context) as response:
                if response.status == 200:
                    import json
                    user_data = json.loads(response.read().decode('utf-8'))
                    logger.info(f"Fetched user details for {user_id}: {user_data.get('email_addresses', [{}])[0].get('email_address', 'No email')}")
                    return user_data
                else:
                    logger.warning(f"Failed to fetch user details: HTTP {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching user details: {e}")
            return None
    
    def _get_permissions_from_role(self, role: str) -> List[str]:
        """Get permissions based on Clerk role"""
        role_permissions = {
            "admin": ["read", "write", "admin", "manage_users", "manage_org"],
            "manager": ["read", "write", "manage_users"],
            "user": ["read", "write"],
            "viewer": ["read"]
        }
        return role_permissions.get(role, ["read"])
