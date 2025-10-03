"""
Storage Configuration for Workspace Management

This module provides configuration and utilities for storage backends,
including local filesystem and cloud object storage (S3, GCS, Azure Blob).
"""

import os
from enum import Enum
from typing import Optional, Dict, Any
from pathlib import Path
import json


class StorageBackend(Enum):
    """Supported storage backends"""
    LOCAL = "local"
    S3 = "s3"
    GCS = "gcs"
    AZURE = "azure"


class StorageConfig:
    """Configuration for storage backend"""
    
    def __init__(
        self,
        backend: StorageBackend = StorageBackend.LOCAL,
        base_path: Optional[str] = None,
        bucket_name: Optional[str] = None,
        region: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None,
        encryption_enabled: bool = True,
        quotas: Optional[Dict[str, int]] = None
    ):
        """
        Initialize storage configuration
        
        Args:
            backend: Storage backend type
            base_path: Base path for local storage or prefix for cloud storage
            bucket_name: Bucket/container name for cloud storage
            region: Cloud region
            credentials: Cloud credentials (not recommended - use IAM roles instead)
            encryption_enabled: Enable encryption at rest
            quotas: Storage quotas (e.g., {"max_size_mb": 1000, "max_files": 10000})
        """
        self.backend = backend if isinstance(backend, StorageBackend) else StorageBackend(backend)
        self.base_path = base_path or self._default_base_path()
        self.bucket_name = bucket_name
        self.region = region
        self.credentials = credentials
        self.encryption_enabled = encryption_enabled
        self.quotas = quotas or self._default_quotas()
        
        # Security settings
        self.allowed_extensions = {
            # Documents
            '.txt', '.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            # Code
            '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.xml',
            # Data
            '.csv', '.parquet', '.arrow', '.feather',
            # Images
            '.png', '.jpg', '.jpeg', '.gif', '.svg',
            # Archives
            '.zip', '.tar', '.gz', '.bz2'
        }
        
        self.blocked_extensions = {
            # Executables
            '.exe', '.dll', '.so', '.dylib', '.app',
            # Scripts that could be harmful
            '.sh', '.bat', '.cmd', '.ps1',
            # System files
            '.sys', '.drv'
        }
    
    def _default_base_path(self) -> str:
        """Get default base path based on backend"""
        if self.backend == StorageBackend.LOCAL:
            # Use workspace directory in project root
            project_root = Path(__file__).parent.parent
            return str(project_root / "workspaces")
        return ""
    
    def _default_quotas(self) -> Dict[str, int]:
        """Default storage quotas"""
        return {
            "max_size_mb": 1000,  # 1 GB per workspace
            "max_files": 10000,   # Max files per workspace
            "max_file_size_mb": 100,  # Max size per file
            "scratch_size_mb": 500,  # Max scratch space
        }
    
    def validate_file(self, file_path: str) -> bool:
        """
        Validate if a file is allowed
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if file is allowed, False otherwise
        """
        path = Path(file_path)
        ext = path.suffix.lower()
        
        # Check blocked extensions
        if ext in self.blocked_extensions:
            return False
        
        # If allowed extensions is defined, check it
        if self.allowed_extensions and ext not in self.allowed_extensions:
            return False
        
        return True
    
    def check_quota(self, workspace_path: Path, new_file_size: int = 0) -> Dict[str, Any]:
        """
        Check if adding a file would exceed quotas
        
        Args:
            workspace_path: Path to workspace
            new_file_size: Size of new file in bytes
            
        Returns:
            Dict with quota status
        """
        current_size = 0
        file_count = 0
        
        if workspace_path.exists():
            for file in workspace_path.rglob('*'):
                if file.is_file():
                    current_size += file.stat().st_size
                    file_count += 1
        
        current_size_mb = current_size / (1024 * 1024)
        new_file_size_mb = new_file_size / (1024 * 1024)
        total_size_mb = current_size_mb + new_file_size_mb
        
        max_size_mb = self.quotas.get("max_size_mb", float('inf'))
        max_files = self.quotas.get("max_files", float('inf'))
        max_file_size_mb = self.quotas.get("max_file_size_mb", float('inf'))
        
        return {
            "allowed": (
                total_size_mb <= max_size_mb and
                file_count < max_files and
                new_file_size_mb <= max_file_size_mb
            ),
            "current_size_mb": current_size_mb,
            "new_file_size_mb": new_file_size_mb,
            "total_size_mb": total_size_mb,
            "max_size_mb": max_size_mb,
            "file_count": file_count,
            "max_files": max_files,
            "reasons": []
        }
    
    @classmethod
    def from_env(cls) -> 'StorageConfig':
        """Create configuration from environment variables"""
        backend = os.getenv("STORAGE_BACKEND", "local")
        
        config = {
            "backend": StorageBackend(backend),
            "base_path": os.getenv("STORAGE_BASE_PATH"),
            "bucket_name": os.getenv("STORAGE_BUCKET_NAME"),
            "region": os.getenv("STORAGE_REGION"),
            "encryption_enabled": os.getenv("STORAGE_ENCRYPTION", "true").lower() == "true"
        }
        
        # Parse quotas from env
        quotas = {}
        if max_size := os.getenv("STORAGE_MAX_SIZE_MB"):
            quotas["max_size_mb"] = int(max_size)
        if max_files := os.getenv("STORAGE_MAX_FILES"):
            quotas["max_files"] = int(max_files)
        if max_file_size := os.getenv("STORAGE_MAX_FILE_SIZE_MB"):
            quotas["max_file_size_mb"] = int(max_file_size)
        
        if quotas:
            config["quotas"] = quotas
        
        return cls(**config)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            "backend": self.backend.value,
            "base_path": self.base_path,
            "bucket_name": self.bucket_name,
            "region": self.region,
            "encryption_enabled": self.encryption_enabled,
            "quotas": self.quotas,
            "allowed_extensions": list(self.allowed_extensions),
            "blocked_extensions": list(self.blocked_extensions)
        }


class LifecyclePolicy:
    """Manages lifecycle policies for workspace data"""
    
    def __init__(self):
        """Initialize lifecycle policy with default retention periods"""
        self.retention_days = {
            "scratch": 0,  # Delete immediately on run end
            "runs": 90,    # Keep runs for 90 days
            "artifacts": 365,  # Keep artifacts for 1 year
            "current": -1,  # Keep until workspace deleted (-1 = indefinite)
        }
    
    def should_delete(self, file_path: Path, category: str) -> bool:
        """
        Check if a file should be deleted based on lifecycle policy
        
        Args:
            file_path: Path to the file
            category: File category (scratch, runs, artifacts, current)
            
        Returns:
            True if file should be deleted
        """
        if category not in self.retention_days:
            return False
        
        retention = self.retention_days[category]
        
        # Indefinite retention
        if retention < 0:
            return False
        
        # Immediate deletion
        if retention == 0:
            return True
        
        # Check file age
        if not file_path.exists():
            return False
        
        from datetime import datetime, timedelta
        file_age = datetime.now() - datetime.fromtimestamp(file_path.stat().st_mtime)
        
        return file_age > timedelta(days=retention)
    
    def set_retention(self, category: str, days: int):
        """
        Set retention period for a category
        
        Args:
            category: File category
            days: Retention period in days (-1 for indefinite)
        """
        self.retention_days[category] = days


# Default storage configuration
DEFAULT_STORAGE_CONFIG = StorageConfig()
DEFAULT_LIFECYCLE_POLICY = LifecyclePolicy()
