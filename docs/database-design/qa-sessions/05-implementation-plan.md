# Q&A Session 5: Implementation Plan & Migration Strategy

**Date:** [To be filled]  
**Participants:** User, AI Assistant  
**Topic:** Implementation Plan & Migration Strategy

## Questions to Discuss

### 1. Database setup
- **Question:** How should we set up the Neon Postgres database with pgvector?
- **Answer:**
  - **Production**: Use existing Neon subscription
  - **Development**: Docker setup for local development
  - **Single Database**: Use one PostgreSQL database with pgvector extension (not separate databases)
  - **Schema**: All 10 tables + embeddings in same database
- **Status:** ✅ Complete

### 2. Migration strategy
- **Question:** How do we migrate from current state to new database?
- **Answer:**
  - **Greenfield Approach**: Start fresh with new schema (no existing data to migrate)
  - **Incremental Rollout**: Deploy new agents with database integration gradually
  - **Backward Compatibility**: Keep existing agent endpoints working during transition
  - **Data Migration**: Only migrate if there's existing conversation/message data
- **Status:** ✅ Complete

### 3. Integration points
- **Question:** How do we integrate with existing Clerk, Agno AI, and workspace systems?
- **Answer:**
  - **Clerk Integration**: Sync organizations/users from Clerk webhooks
  - **Agno AI Integration**: Use existing memory capabilities + extend with new schema
  - **Workspace Integration**: Enhance existing workspace system with database tracking
  - **Agent Integration**: Update agent handlers to use new database schema
- **Status:** ✅ Complete

## 🚀 **Comprehensive Implementation Plan**

### 📊 **Database Architecture Decision:**
**✅ Single Database Approach:**
- **One PostgreSQL database** with pgvector extension
- **All tables + embeddings** in same database
- **Simpler management**, better performance, easier queries
- **No need for separate vector database**

### 🏗️ **Implementation Phases:**

#### **Phase 1: Database Setup & Core Schema**
```bash
# Docker setup for development
docker run --name aj-copilot-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=aj_copilot \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16

# Enable pgvector extension
CREATE EXTENSION vector;
```

#### **Phase 2: Clerk Integration**
```python
# Clerk webhook handlers
@app.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    # Sync organizations and users to database
    # Handle user creation, updates, deletions
    # Sync organization membership
```

#### **Phase 3: Agent Integration**
```python
# Update existing agent handlers
class StockAnalysisAgentHandler(BaseAgentHandler):
    async def handle_request(self, context: AgentRequestContext):
        # Use new database schema
        # Store conversations and messages
        # Manage agent states
```

#### **Phase 4: File Management Enhancement**
```python
# Enhance workspace system
class EnhancedWorkspaceManager(WorkspaceManager):
    def store_file(self, file_data, conversation_id, user_id):
        # Store in workspace folder
        # Create database record
        # Handle file metadata
```

#### **Phase 5: RAG Integration**
```python
# On-demand embedding generation
async def generate_embeddings(file_id: str, agent_id: str):
    # Only for RAG-dependent agents
    # Use agent-specific embedding model
    # Store in embeddings table
```

### 🔗 **Integration Strategy:**

#### **1. Clerk Integration:**
- **Webhooks**: Real-time sync of organizations/users
- **JWT Validation**: Continue using existing Clerk JWT validation
- **Organization Management**: Extend with database persistence

#### **2. Agno AI Integration:**
- **Memory System**: Use existing PostgreSQL memory capabilities
- **Enhanced Schema**: Add conversation and message tracking
- **State Management**: Extend with persistent agent states

#### **3. Workspace Integration:**
- **File Storage**: Continue using `@workspaces` folder structure
- **Database Tracking**: Add file metadata and relationships
- **Enhanced Paths**: `workspaces/{org_id}/{user_id}/{conversation_id}/files/`

#### **4. Agent Integration:**
- **Backward Compatibility**: Keep existing endpoints working
- **Gradual Migration**: Update agents one by one
- **Enhanced Handlers**: Use new database schema for persistence

### 📁 **File Management Strategy:**
**✅ No agent_id in file path needed:**
- **Conversation-scoped**: Files belong to conversations
- **Agent context**: Maintained via `conversation_id → agent_id` relationship
- **Simpler paths**: `workspaces/{org_id}/{user_id}/{conversation_id}/files/`
- **Database tracking**: Agent context stored in database relationships

### 🐳 **Docker Development Setup:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: aj_copilot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 🔄 **Migration Strategy:**
**✅ Greenfield Approach:**
- **No existing data**: Start fresh with new schema
- **Incremental rollout**: Deploy new features gradually
- **Backward compatibility**: Keep existing systems working
- **Zero downtime**: Seamless transition

### 📋 **Final Clarifications:**

#### **1. Agent State Persistence:**
- **Retention**: Persist until user deletes session
- **Auto-cleanup**: Delete sessions older than 30 days
- **Policy**: Automated cleanup job to remove old agent states

#### **2. File Retention Policy:**
- **Retention**: 30 days (same as sessions)
- **Auto-cleanup**: Delete files older than 30 days
- **Policy**: Automated cleanup job for file storage

#### **3. Conversation Sharing Permissions:**
- **Scope**: Anyone can share with anyone in their organization
- **No restrictions**: Open sharing within organization boundaries

#### **4. Agent Configuration:**
- **Need suggestions**: To be determined during implementation
- **Approach**: Start simple, add complexity as needed

#### **5. RAG Agent Identification:**
- **Method**: Add category/type field to identify RAG agents
- **Approach**: Simple automatic identification based on agent type
- **Implementation**: Update agents table with RAG capability flag

## Status: ✅ Complete
**Next:** Start implementation with Phase 1
