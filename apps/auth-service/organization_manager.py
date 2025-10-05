"""
Organization Management API
==========================

Custom organization management endpoints for the backend.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from .clerk_provider import ClerkProvider, UserInfo
import logging

logger = logging.getLogger(__name__)

# Create router for organization endpoints
organization_router = APIRouter(prefix="/api/organization", tags=["organization"])

class CreateOrganizationRequest(BaseModel):
    name: str
    slug: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    created_at: str
    members_count: int
    role: str
    
    @classmethod
    def from_clerk_data(cls, org_data: dict, role: str = "admin"):
        """Create OrganizationResponse from Clerk API data"""
        return cls(
            id=org_data.get("id", ""),
            name=org_data.get("name", ""),
            slug=org_data.get("slug", ""),
            created_at=str(org_data.get("created_at", "")),  # Convert to string
            members_count=org_data.get("members_count", 1),
            role=role
        )

class OrganizationManager:
    """Organization management using Clerk"""
    
    def __init__(self):
        self.clerk_provider = ClerkProvider()
    
    async def create_organization(self, user_info: UserInfo, org_data: CreateOrganizationRequest) -> Optional[OrganizationResponse]:
        """Create a new organization for the user"""
        try:
            import requests
            
            # Create organization via Clerk API
            # Generate unique slug by adding timestamp
            import time
            base_slug = org_data.slug or org_data.name.lower().replace(" ", "-")
            unique_slug = f"{base_slug}-{int(time.time())}"
            
            response = requests.post(
                "https://api.clerk.com/v1/organizations",
                headers={
                    "Authorization": f"Bearer {self.clerk_provider.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "name": org_data.name,
                    "slug": unique_slug,
                    "created_by": user_info.user_id
                }
            )
            
            if response.status_code == 200:
                org_data_response = response.json()
                
                # Add user as admin to the organization
                await self._add_user_to_organization(
                    user_info.user_id, 
                    org_data_response["id"], 
                    "admin"
                )
                
                # Use the new from_clerk_data method to handle type conversion
                return OrganizationResponse.from_clerk_data(org_data_response, "admin")
            else:
                logger.error(f"Failed to create organization: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating organization: {e}")
        return None
    
    async def _add_user_to_organization(self, user_id: str, org_id: str, role: str = "org:admin"):
        """Add user to organization with specified role"""
        try:
            import requests
            
            # Use valid Clerk organization roles
            valid_roles = {
                "admin": "org:admin",
                "manager": "org:manager", 
                "member": "org:member"
            }
            
            clerk_role = valid_roles.get(role, "org:admin")
            
            response = requests.post(
                f"https://api.clerk.com/v1/organizations/{org_id}/memberships",
                headers={
                    "Authorization": f"Bearer {self.clerk_provider.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "user_id": user_id,
                    "role": clerk_role
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Added user {user_id} to organization {org_id} as {clerk_role}")
            else:
                logger.error(f"Failed to add user to organization: {response.text}")
                
        except Exception as e:
            logger.error(f"Error adding user to organization: {e}")
    
    async def get_user_organizations(self, user_id: str) -> List[OrganizationResponse]:
        """Get all organizations for a user"""
        try:
            import requests
            
            response = requests.get(
                f"https://api.clerk.com/v1/users/{user_id}/organization_memberships",
                headers={
                    "Authorization": f"Bearer {self.clerk_provider.api_key}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                memberships = response.json().get("data", [])
                organizations = []
                
                for membership in memberships:
                    org_data = membership.get("organization", {})
                    organizations.append(OrganizationResponse.from_clerk_data(
                        org_data, 
                        membership.get("role", "member")
                    ))
                
                return organizations
            else:
                logger.error(f"Failed to get user organizations: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting user organizations: {e}")
            return []

# Global organization manager
org_manager = OrganizationManager()

@organization_router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"message": "Organization API is working", "status": "ok"}

@organization_router.get("/debug-token")
async def debug_token(authorization: str = Header(None)):
    """Debug endpoint to test token validation"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            return {"error": "Missing or invalid authorization header", "status": 401}
        
        token = authorization.replace("Bearer ", "")
        logger.info(f"Debug token validation for token: {token[:20]}...")
        
        user_info = org_manager.clerk_provider.validate_token(token)
        if user_info:
            return {
                "status": "success",
                "user_id": user_info.user_id,
                "email": user_info.email,
                "name": user_info.name,
                "org_id": user_info.org_id
            }
        else:
            return {"error": "Token validation failed", "status": 401}
            
    except Exception as e:
        logger.error(f"Debug token error: {e}")
        return {"error": f"Token validation error: {str(e)}", "status": 500}

# Dependency to get current user
async def get_current_user(authorization: str = Header(None)) -> UserInfo:
    """Get current user from token"""
    logger.info(f"Authorization header received: {authorization[:20] if authorization else 'None'}...")
    
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Missing or invalid authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    logger.info(f"Token extracted (first 20 chars): {token[:20]}...")
    
    try:
        user_info = org_manager.clerk_provider.validate_token(token)
        if not user_info:
            logger.warning("Token validation failed - no user info returned")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        logger.info(f"Token validation successful for user: {user_info.user_id}")
        return user_info
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

@organization_router.post("/create")
async def create_organization(
    request: CreateOrganizationRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """Create a new organization"""
    try:
        logger.info(f"Creating organization: {request.name} for user: {current_user.user_id}")
        organization = await org_manager.create_organization(current_user, request)
        
        if organization:
            logger.info(f"Organization created successfully: {organization.id}")
            return {
                "success": True,
                "organization": organization,
                "message": "Organization created successfully"
            }
        else:
            logger.error("Failed to create organization - no organization returned")
            raise HTTPException(status_code=400, detail="Failed to create organization")
            
    except Exception as e:
        logger.error(f"Error in create_organization endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@organization_router.get("/list")
async def list_organizations(current_user: UserInfo = Depends(get_current_user)):
    """Get user's organizations"""
    try:
        organizations = await org_manager.get_user_organizations(current_user.user_id)
        
        return {
            "success": True,
            "organizations": organizations,
            "count": len(organizations)
        }
        
    except Exception as e:
        logger.error(f"Error in list_organizations endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@organization_router.post("/{org_id}/join")
async def join_organization(
    org_id: str,
    current_user: UserInfo = Depends(get_current_user)
):
    """Join an organization"""
    try:
        await org_manager._add_user_to_organization(current_user.user_id, org_id, "member")
        
        return {
            "success": True,
            "message": f"Successfully joined organization {org_id}"
        }
        
    except Exception as e:
        logger.error(f"Error in join_organization endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
