"""
Workspace Service - Centralized Adapter for Workspace Management

This module provides a service layer for workspace operations across different
environments (local, S3, etc.) and handles user context extraction from requests.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional, Union, List
import json
import uuid
from datetime import datetime
from enum import Enum
import logging

from fastapi import Request, Depends
from pydantic import BaseModel

from .workspace_manager import WorkspaceManager, WorkspaceScope, RunContext
from .storage_config import StorageConfig, StorageBackend, DEFAULT_STORAGE_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RequestContext(BaseModel):
    """User context extracted from request for workspace operations"""
    user_id: str
    org_id: str = "default"
    workspace_id: Optional[str] = None
    agent_id: str
    env: str = "dev"


class WorkspaceService:
    """
    Centralized service for workspace operations across all agents.
    
    This service:
    1. Determines the appropriate storage backend based on environment
    2. Extracts user context from requests
    3. Manages workspace lifecycle
    4. Provides a consistent interface for all agents
    """
    
    def __init__(self, storage_config: Optional[StorageConfig] = None):
        """
        Initialize the workspace service
        
        Args:
            storage_config: Optional storage configuration
        """
        self.env = os.getenv("ENV", "dev")
        self.base_path = os.getenv("WORKSPACE_BASE_PATH", "./workspaces")
        
        # Determine storage backend from environment
        backend_name = os.getenv("WORKSPACE_STORAGE_BACKEND", "local").lower()
        backend = StorageBackend.LOCAL
        
        if backend_name == "s3":
            backend = StorageBackend.S3
        elif backend_name == "gcs":
            backend = StorageBackend.GCS
        elif backend_name == "azure":
            backend = StorageBackend.AZURE
            
        # Use provided config or create one based on environment
        if storage_config:
            self.storage_config = storage_config
        else:
            self.storage_config = StorageConfig(
                backend=backend,
                base_path=self.base_path,
                bucket_name=os.getenv("AWS_S3_BUCKET", ""),
                region=os.getenv("AWS_REGION", ""),
                credentials={
                    "access_key": os.getenv("AWS_ACCESS_KEY_ID", ""),
                    "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY", "")
                } if backend == StorageBackend.S3 else None,
                encryption_enabled=True
            )
        
        logger.info(f"Workspace service initialized with {backend.value} backend in {self.env} environment")
    
    async def extract_context_from_request(self, request: Request) -> RequestContext:
        """
        Extract user context from request headers/auth
        
        Args:
            request: FastAPI request object
            
        Returns:
            RequestContext with user_id, org_id, etc.
        """
        # In production, this would extract from JWT/auth
        # For now, we'll use headers or query params
        
        # Try to get from headers first
        user_id = request.headers.get("X-User-ID")
        org_id = request.headers.get("X-Org-ID") or os.getenv("DEFAULT_ORG_ID", "default")
        workspace_id = request.headers.get("X-Workspace-ID")
        agent_id = request.headers.get("X-Agent-ID")
        
        # If not in headers, try query params
        if not user_id:
            user_id = request.query_params.get("user_id", str(uuid.uuid4()))
        
        if not agent_id:
            # Extract agent ID from path
            path = request.url.path
            if path.startswith("/"):
                path = path[1:]
            parts = path.split("/")
            if parts:
                agent_id = parts[0].replace("-agent", "")
            else:
                agent_id = "generic"
        
        return RequestContext(
            user_id=user_id,
            org_id=org_id,
            workspace_id=workspace_id,
            agent_id=agent_id,
            env=self.env
        )
    
    def get_workspace(
        self,
        context: RequestContext,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> WorkspaceManager:
        """
        Get a workspace manager for the given context
        
        Args:
            context: Request context with user information
            scope: Workspace scope (USER, TEAM, ORG, GLOBAL)
            
        Returns:
            Configured WorkspaceManager
        """
        scope_id = context.user_id
        if scope == WorkspaceScope.TEAM:
            # In production, you'd get team ID from user's teams
            scope_id = f"team-{context.user_id}"
        elif scope == WorkspaceScope.ORG:
            scope_id = context.org_id
        elif scope == WorkspaceScope.GLOBAL:
            scope_id = "global"
            
        return WorkspaceManager(
            base_path=self.storage_config.base_path,
            env=context.env,
            org_id=context.org_id,
            scope=scope,
            scope_id=scope_id,
            agent_id=context.agent_id,
            workspace_id=context.workspace_id,
            storage_config=self.storage_config
        )
    
    def create_run(
        self,
        context: RequestContext,
        run_id: Optional[str] = None,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> RunContext:
        """
        Create a new run context for tracking an agent execution
        
        Args:
            context: Request context with user information
            run_id: Optional run ID (generated if not provided)
            scope: Workspace scope
            
        Returns:
            RunContext for the execution
        """
        workspace = self.get_workspace(context, scope)
        return workspace.create_run(run_id)
    
    def write_file(
        self,
        context: RequestContext,
        filename: str,
        content: Union[str, bytes, Dict[str, Any]],
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> Path:
        """
        Write a file to the user's workspace
        
        Args:
            context: Request context with user information
            filename: Name of the file to write
            content: Content to write (string, bytes, or JSON-serializable dict)
            scope: Workspace scope
            
        Returns:
            Path to the written file
        """
        workspace = self.get_workspace(context, scope)
        
        # Convert dict to JSON string if needed
        if isinstance(content, dict):
            content = json.dumps(content, indent=2)
            
        workspace.write_current_file(filename, content)
        return workspace.get_current_path(filename)
    
    def read_file(
        self,
        context: RequestContext,
        filename: str,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> Optional[Union[str, bytes]]:
        """
        Read a file from the user's workspace
        
        Args:
            context: Request context with user information
            filename: Name of the file to read
            scope: Workspace scope
            
        Returns:
            File content as string or bytes, or None if file doesn't exist
        """
        workspace = self.get_workspace(context, scope)
        return workspace.read_current_file(filename)
    
    def read_json_file(
        self,
        context: RequestContext,
        filename: str,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> Optional[Dict[str, Any]]:
        """
        Read a JSON file from the user's workspace
        
        Args:
            context: Request context with user information
            filename: Name of the file to read
            scope: Workspace scope
            
        Returns:
            Parsed JSON content, or None if file doesn't exist
        """
        content = self.read_file(context, filename, scope)
        if content and isinstance(content, str):
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from {filename}")
                return None
        return None
    
    def list_files(
        self,
        context: RequestContext,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> List[str]:
        """
        List files in the user's workspace
        
        Args:
            context: Request context with user information
            scope: Workspace scope
            
        Returns:
            List of filenames
        """
        workspace = self.get_workspace(context, scope)
        return workspace.list_current_files()
    
    def delete_file(
        self,
        context: RequestContext,
        filename: str,
        scope: WorkspaceScope = WorkspaceScope.USER
    ) -> bool:
        """
        Delete a file from the user's workspace
        
        Args:
            context: Request context with user information
            filename: Name of the file to delete
            scope: Workspace scope
            
        Returns:
            True if file was deleted, False otherwise
        """
        workspace = self.get_workspace(context, scope)
        try:
            workspace.delete_current_file(filename)
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {filename}: {e}")
            return False


# Global instance for dependency injection
workspace_service = WorkspaceService()


def get_workspace_service() -> WorkspaceService:
    """Dependency for FastAPI to get the workspace service"""
    return workspace_service


def get_request_context(
    request: Request,
    workspace_service: WorkspaceService = Depends(get_workspace_service)
) -> RequestContext:
    """
    FastAPI dependency to extract request context
    
    Usage:
    ```
    @app.post("/my-endpoint")
    async def my_endpoint(context: RequestContext = Depends(get_request_context)):
        # Use context.user_id, etc.
    ```
    """
    return workspace_service.extract_context_from_request(request)
