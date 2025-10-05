# Auth Service

Standalone authentication service for AJ Copilot multi-frontend architecture.

## Features

- **Clerk Integration**: JWT validation and user management
- **Organization Management**: B2B organization creation and management
- **Multi-tenant Support**: Organization-based access control
- **FastAPI**: Modern, fast web framework
- **Standalone**: Independent service that can be shared across multiple frontends

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

- `GET /` - Service status
- `GET /health` - Health check
- `GET /docs` - API documentation (Swagger UI)

### Organization Management
- `POST /api/organization/create` - Create new organization
- `GET /api/organization/list` - List user organizations
- `GET /api/organization/test` - Test endpoint

## Environment Variables

Create a `.env` file:

```bash
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Architecture

This service is designed to be shared across multiple frontend applications:
- `agent-bank` (main AI agent hub)
- `stock-analyst` (dedicated stock analysis app)
- `business-processor` (dedicated BPP assistant app)
- Future specialized frontends

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Format code
black .
isort .

# Run tests
pytest
```
