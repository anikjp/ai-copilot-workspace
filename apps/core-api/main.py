"""
Core API - Shared backend services for AJ Copilot
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Core API",
    description="Core backend services for AJ Copilot multi-frontend architecture",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Core API is running",
        "service": "core-api",
        "version": "0.1.0",
        "services": [
            "Database Management",
            "File Storage",
            "Vector Search (pgvector)",
            "Agent State Management",
            "Conversation Management",
            "Workspace Management"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "core-api"}

# TODO: Add routers for:
# - Database operations
# - File management
# - Vector search
# - Agent state
# - Conversations
# - Workspaces

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
