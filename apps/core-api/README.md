# Core API

Core backend services for AJ Copilot multi-frontend architecture.

## Features

- **Database Management**: PostgreSQL with pgvector for embeddings
- **File Storage**: Structured file management in @workspaces
- **Vector Search**: RAG capabilities with pgvector
- **Agent State Management**: Persistent agent states
- **Conversation Management**: Multi-tenant chat history
- **Workspace Management**: Organization-based workspaces

## Architecture

This service provides shared backend functionality for multiple frontend applications:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   agent-bank    │    │  stock-analyst  │    │ business-processor │
│   (main hub)    │    │  (dedicated)    │    │   (dedicated)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    core-api     │
                    │  (shared core)  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   auth-service  │
                    │ (authentication)│
                    └─────────────────┘
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## API Endpoints

- `GET /` - Service status and available services
- `GET /health` - Health check
- `GET /docs` - API documentation (Swagger UI)

## Planned Services

### Database Management
- Agent CRUD operations
- Organization management
- User management
- Conversation management

### File Management
- File upload/download
- Workspace organization
- File metadata tracking

### Vector Search
- Embedding generation
- Similarity search
- RAG query processing

### Agent State
- State persistence
- Session management
- Configuration storage

## Environment Variables

Create a `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aj_copilot
POSTGRES_USER=aj_copilot
POSTGRES_PASSWORD=your_password
POSTGRES_DB=aj_copilot

# Redis (for caching/sessions)
REDIS_URL=redis://localhost:6379

# Vector Search
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-ada-002
```

## Database Schema

See `docs/database-design/` for the complete schema design including:
- 12-table PostgreSQL schema
- pgvector for embeddings
- Multi-tenant organization support
- Agent configuration management

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Format code
black .
isort .

# Run tests
pytest

# Database migrations
alembic upgrade head
```
