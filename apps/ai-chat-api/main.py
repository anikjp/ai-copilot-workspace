import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from services.dynamodb import db_service
from routers import chat, conversations, models, attachments

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Log environment variables status (for debugging)
print(f"Environment variables loaded:")
print(f"  AWS_REGION: {os.getenv('AWS_REGION', 'Not set')}")
print(f"  DYNAMODB_TABLE_NAME: {os.getenv('DYNAMODB_TABLE_NAME', 'Not set')}")
print(f"  OPENAI_API_KEY: {'Set' if os.getenv('OPENAI_API_KEY') else 'Not set'}")
print(f"  ANTHROPIC_API_KEY: {'Set' if os.getenv('ANTHROPIC_API_KEY') else 'Not set'}")
print(f"  GOOGLE_API_KEY: {'Set' if os.getenv('GOOGLE_API_KEY') else 'Not set'}")
print(f"  COHERE_API_KEY: {'Set' if os.getenv('COHERE_API_KEY') else 'Not set'}")
print(f"  GROQ_API_KEY: {'Set' if os.getenv('GROQ_API_KEY') else 'Not set'}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    # DynamoDB table creation is handled automatically in DynamoDBService constructor
    yield
    # Shutdown logic

app = FastAPI(
    title="AI Chat API",
    description="Backend API for AI chat application with multiple models, attachments, and DynamoDB storage",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(attachments.router, prefix="/api/attachments", tags=["attachments"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(models.router, prefix="/api/models", tags=["models"])

@app.get("/")
async def root():
    return {
        "message": "AI Chat API is running",
        "version": "1.0.0",
        "features": [
            "Multi-model chat support",
            "Image upload and vision chat",
            "Document upload and processing", 
            "Conversation management",
            "DynamoDB storage"
        ],
        "endpoints": {
            "chat": "/api/chat/send",
            "attachments": {
                "upload_image": "/api/attachments/upload-image",
                "upload_document": "/api/attachments/upload-document", 
                "supported_types": "/api/attachments/supported-types",
                "generate_image": "/api/attachments/generate-image"
            },
            "conversations": "/api/conversations",
            "models": "/api/models"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with service status"""
    try:
        # Check DynamoDB connection
        db_status = "healthy"
        try:
            # Test DynamoDB connection by checking if table exists
            db_service.table.load()
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
        
        # Check if required environment variables are set
        env_status = "healthy"
        required_vars = ["AWS_REGION", "DYNAMODB_TABLE_NAME"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            env_status = f"unhealthy: missing {', '.join(missing_vars)}"
        
        return {
            "status": "healthy" if db_status == "healthy" and env_status == "healthy" else "degraded",
            "services": {
                "database": db_status,
                "environment": env_status,
                "attachments": "available"
            },
            "features": {
                "chat": "available",
                "attachments": "available", 
                "conversations": "available",
                "models": "available"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
