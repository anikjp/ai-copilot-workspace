"""
Workspace Manager for Agent Data Storage

This module provides a workspace abstraction for managing user data, agent outputs,
and run artifacts in a production-ready way that separates code from data.

Storage Schema:
env/{env}/org/{org_id}/workspaces/{scope}/{scope_id}/agent/{agent_id}/ws/{workspace_id}/
  ├── current/          # Persistent working directory
  └── runs/             # Run-specific data
      └── {yyyy}/{mm}/{dd}/{run_id}/
          ├── inputs/   # Input data for this run
          ├── outputs/  # Output artifacts
          ├── logs/     # Execution logs
          └── manifest.json  # Run metadata
"""

import os
import json
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from enum import Enum
import fcntl
from contextlib import contextmanager


class WorkspaceScope(Enum):
    """Scope of workspace access"""
    USER = "user"
    TEAM = "team"
    ORG = "org"
    GLOBAL = "global"


class WorkspaceManager:
    """
    Manages workspace directories and file operations with proper isolation
    and security controls.
    """
    
    def __init__(
        self,
        base_path: str,
        env: str = "dev",
        org_id: str = None,
        scope: WorkspaceScope = WorkspaceScope.USER,
        scope_id: str = None,
        agent_id: str = None,
        workspace_id: str = None,
        storage_config: Optional[Any] = None,
        lifecycle_policy: Optional[Any] = None
    ):
        """
        Initialize workspace manager
        
        Args:
            base_path: Base directory for all workspaces
            env: Environment (dev, staging, prod)
            org_id: Organization ID
            scope: Workspace scope (user, team, org)
            scope_id: ID for the scope (user_id, team_id, org_id)
            agent_id: Agent identifier
            workspace_id: Workspace identifier (auto-generated if None)
            storage_config: Optional storage configuration
            lifecycle_policy: Optional lifecycle policy for data retention
        """
        self.base_path = Path(base_path)
        self.env = env
        self.org_id = org_id or "default"
        self.scope = scope if isinstance(scope, WorkspaceScope) else WorkspaceScope(scope)
        self.scope_id = scope_id or "default"
        self.agent_id = agent_id or "generic"
        self.workspace_id = workspace_id or f"ws-{uuid.uuid4().hex[:8]}"
        self.storage_config = storage_config
        self.lifecycle_policy = lifecycle_policy
        
        # Construct workspace path
        self.workspace_root = self._build_workspace_path()
        self.current_dir = self.workspace_root / "current"
        self.runs_dir = self.workspace_root / "runs"
        self.scratch_dir = self.workspace_root / "scratch"
        
        # Ensure directories exist
        self._initialize_workspace()
    
    def _build_workspace_path(self) -> Path:
        """Build the workspace path following the schema"""
        return (
            self.base_path / 
            "env" / self.env /
            "org" / self.org_id /
            "workspaces" / self.scope.value / self.scope_id /
            "agent" / self.agent_id /
            "ws" / self.workspace_id
        )
    
    def _initialize_workspace(self):
        """Create workspace directory structure"""
        self.current_dir.mkdir(parents=True, exist_ok=True)
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        self.scratch_dir.mkdir(parents=True, exist_ok=True)
        
        # Create workspace metadata
        metadata_path = self.workspace_root / "workspace_metadata.json"
        if not metadata_path.exists():
            metadata = {
                "workspace_id": self.workspace_id,
                "agent_id": self.agent_id,
                "scope": self.scope.value,
                "scope_id": self.scope_id,
                "org_id": self.org_id,
                "env": self.env,
                "created_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            }
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
    
    def create_run(self, run_id: Optional[str] = None) -> 'RunContext':
        """
        Create a new run context
        
        Args:
            run_id: Optional run ID (auto-generated if None)
            
        Returns:
            RunContext object for managing the run
        """
        if run_id is None:
            run_id = f"run-{uuid.uuid4().hex[:12]}"
        
        now = datetime.utcnow()
        run_path = (
            self.runs_dir / 
            str(now.year) / 
            f"{now.month:02d}" / 
            f"{now.day:02d}" / 
            run_id
        )
        
        return RunContext(
            run_path=run_path,
            run_id=run_id,
            workspace_manager=self
        )
    
    @contextmanager
    def lock_workspace(self, timeout: int = 30):
        """
        Acquire an exclusive lock on the workspace
        
        Args:
            timeout: Timeout in seconds
            
        Yields:
            Lock context
        """
        lock_file = self.workspace_root / ".lock"
        lock_file.touch(exist_ok=True)
        
        with open(lock_file, 'w') as f:
            try:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                yield
            except IOError:
                raise RuntimeError(f"Could not acquire workspace lock within {timeout}s")
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    
    def get_current_path(self, relative_path: str = "") -> Path:
        """Get path within current directory"""
        path = self.current_dir / relative_path
        # Ensure path is within current directory (security)
        path.resolve().relative_to(self.current_dir.resolve())
        return path
    
    def get_scratch_path(self, relative_path: str = "") -> Path:
        """Get path within scratch directory"""
        path = self.scratch_dir / relative_path
        path.resolve().relative_to(self.scratch_dir.resolve())
        return path
    
    def cleanup_scratch(self):
        """Remove all files in scratch directory"""
        if self.scratch_dir.exists():
            shutil.rmtree(self.scratch_dir)
            self.scratch_dir.mkdir(parents=True, exist_ok=True)
    
    def write_current_file(self, filename: str, content: Union[str, bytes]):
        """
        Write content to a file in the current directory
        
        Args:
            filename: Name of the file to write
            content: Content to write (string or bytes)
        """
        path = self.get_current_path(filename)
        
        # Create parent directories if needed
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write content based on type
        with self.lock_workspace():
            if isinstance(content, str):
                path.write_text(content)
            else:
                path.write_bytes(content)
    
    def read_current_file(self, filename: str) -> Optional[Union[str, bytes]]:
        """
        Read content from a file in the current directory
        
        Args:
            filename: Name of the file to read
            
        Returns:
            File content as string or bytes, or None if file doesn't exist
        """
        path = self.get_current_path(filename)
        if not path.exists():
            return None
        
        try:
            return path.read_text()
        except UnicodeDecodeError:
            return path.read_bytes()
    
    def delete_current_file(self, filename: str):
        """
        Delete a file from the current directory
        
        Args:
            filename: Name of the file to delete
        """
        path = self.get_current_path(filename)
        if path.exists():
            with self.lock_workspace():
                path.unlink()
    
    def list_current_files(self) -> List[str]:
        """
        List files in the current directory
        
        Returns:
            List of filenames (relative to current directory)
        """
        if not self.current_dir.exists():
            return []
        
        return [f.name for f in self.current_dir.iterdir() if f.is_file()]
    
    def list_runs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List recent runs
        
        Args:
            limit: Maximum number of runs to return
            
        Returns:
            List of run metadata
        """
        runs = []
        
        if not self.runs_dir.exists():
            return runs
        
        # Walk through year/month/day structure
        for year_dir in sorted(self.runs_dir.iterdir(), reverse=True):
            if not year_dir.is_dir():
                continue
            for month_dir in sorted(year_dir.iterdir(), reverse=True):
                if not month_dir.is_dir():
                    continue
                for day_dir in sorted(month_dir.iterdir(), reverse=True):
                    if not day_dir.is_dir():
                        continue
                    for run_dir in sorted(day_dir.iterdir(), reverse=True):
                        if not run_dir.is_dir():
                            continue
                        
                        manifest_path = run_dir / "manifest.json"
                        if manifest_path.exists():
                            with open(manifest_path) as f:
                                runs.append(json.load(f))
                        
                        if len(runs) >= limit:
                            return runs
        
        return runs
    
    def cleanup_scratch(self):
        """Clean up the scratch directory (called automatically at end of run)"""
        if self.scratch_dir.exists():
            shutil.rmtree(self.scratch_dir)
            self.scratch_dir.mkdir(parents=True, exist_ok=True)
    
    def clean_scratch(self):
        """Alias for cleanup_scratch for backwards compatibility"""
        self.cleanup_scratch()


class RunContext:
    """Context manager for a single agent run"""
    
    def __init__(self, run_path: Path, run_id: str, workspace_manager: WorkspaceManager):
        """
        Initialize run context
        
        Args:
            run_path: Path to the run directory
            run_id: Unique run identifier
            workspace_manager: Parent workspace manager
        """
        self.run_path = run_path
        self.run_id = run_id
        self.workspace_manager = workspace_manager
        
        # Run subdirectories
        self.inputs_dir = run_path / "inputs"
        self.outputs_dir = run_path / "outputs"
        self.logs_dir = run_path / "logs"
        self.scratch_dir = run_path / "scratch"
        self.manifest_path = run_path / "manifest.json"
        
        # Initialize manifest
        self.manifest = {
            "run_id": run_id,
            "started_at": datetime.utcnow().isoformat(),
            "status": "running",
            "inputs": [],
            "outputs": [],
            "logs": []
        }
        
        # Create directories
        self._ensure_dirs()
    
    def _ensure_dirs(self):
        """Ensure all run directories exist"""
        self.inputs_dir.mkdir(parents=True, exist_ok=True)
        self.outputs_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.scratch_dir.mkdir(parents=True, exist_ok=True)
    
    def write_input(self, filename: str, content: Union[str, bytes, Dict[str, Any]]):
        """Write content to the inputs directory"""
        path = self.inputs_dir / filename
        
        # Convert dict to JSON if needed
        if isinstance(content, dict):
            content = json.dumps(content, indent=2)
            
        if isinstance(content, str):
            path.write_text(content)
        else:
            path.write_bytes(content)
        
        return path
    
    def write_output(self, filename: str, content: Union[str, bytes, Dict[str, Any]]):
        """Write content to the outputs directory"""
        path = self.outputs_dir / filename
        
        # Convert dict to JSON if needed
        if isinstance(content, dict):
            content = json.dumps(content, indent=2)
            
        if isinstance(content, str):
            path.write_text(content)
        else:
            path.write_bytes(content)
        
        return path
    
    def write_log(self, filename: str, content: str):
        """Write content to the logs directory"""
        path = self.logs_dir / filename
        path.write_text(content)
        return path
    
    def write_manifest(self, data: Dict[str, Any]):
        """Write run manifest data"""
        with open(self.manifest_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def read_manifest(self) -> Dict[str, Any]:
        """Read run manifest data"""
        if self.manifest_path.exists():
            with open(self.manifest_path, "r") as f:
                return json.load(f)
        return {}
    
    def cleanup_scratch(self):
        """Clean up the scratch directory"""
        if self.scratch_dir.exists():
            shutil.rmtree(self.scratch_dir)
            self.scratch_dir.mkdir(parents=True, exist_ok=True)
    
    def __enter__(self):
        """Enter run context"""
        # Create run directories
        self.inputs_dir.mkdir(parents=True, exist_ok=True)
        self.outputs_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Write initial manifest
        self._write_manifest()
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit run context"""
        # Update manifest
        self.manifest["completed_at"] = datetime.utcnow().isoformat()
        self.manifest["status"] = "failed" if exc_type else "completed"
        
        if exc_type:
            self.manifest["error"] = {
                "type": exc_type.__name__,
                "message": str(exc_val)
            }
        
        self._write_manifest()
        
        # Cleanup scratch
        self.workspace_manager.cleanup_scratch()
        
        return False  # Don't suppress exceptions
    
    def _write_manifest(self):
        """Write manifest to disk"""
        with open(self.manifest_path, 'w') as f:
            json.dump(self.manifest, f, indent=2)
    
    def add_input(self, file_path: str, metadata: Optional[Dict] = None):
        """Record an input file"""
        self.manifest["inputs"].append({
            "path": file_path,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        })
        self._write_manifest()
    
    def add_output(self, file_path: str, metadata: Optional[Dict] = None):
        """Record an output file"""
        self.manifest["outputs"].append({
            "path": file_path,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        })
        self._write_manifest()
    
    def add_log(self, message: str, level: str = "info"):
        """Add a log entry"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message
        }
        self.manifest["logs"].append(log_entry)
        
        # Also write to log file
        log_file = self.logs_dir / f"{self.run_id}.log"
        with open(log_file, 'a') as f:
            f.write(f"[{log_entry['timestamp']}] {level.upper()}: {message}\n")
    
    def promote_to_current(self, file_path: str, destination: str = None):
        """
        Promote an output file to the current workspace
        
        Args:
            file_path: Path to file in outputs directory
            destination: Destination path in current directory (defaults to same name)
        """
        source = self.outputs_dir / file_path
        if not source.exists():
            raise FileNotFoundError(f"Output file not found: {file_path}")
        
        dest_path = destination or file_path
        dest = self.workspace_manager.current_dir / dest_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.copy2(source, dest)
        
        self.add_log(f"Promoted {file_path} to current workspace", "info")
