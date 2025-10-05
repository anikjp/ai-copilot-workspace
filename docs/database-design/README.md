# Database Design Documentation

This folder contains documentation for the database design decisions for the AI Agent Platform.

## Overview

The platform uses:
- **Neon Postgres** with **pgvector** for embeddings
- **Clerk** for user authentication and organization management
- **Multi-agent architecture** with separate chat and state management
- **Multi-tenant** organization-based access control

## Documentation Structure

- `qa-sessions/` - Question & Answer sessions for design decisions
- `schema/` - Final database schema files
- `migrations/` - Database migration scripts
- `api-design/` - API design documentation

## Current Status

- [x] Agent Architecture Q&A
- [ ] Chat & Context Q&A
- [ ] Embeddings & Vector Search Q&A
- [ ] Data Relationships Q&A
- [ ] Performance & Scale Q&A
- [ ] Final Schema Design
- [ ] Migration Scripts
