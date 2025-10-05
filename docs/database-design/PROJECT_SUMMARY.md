# AJ Copilot Database Design - Project Summary

## 🎯 **What We Discussed & Decided**

### **📊 Project Overview:**
- **Multi-tenant B2B system** using Clerk for authentication
- **Multi-agent architecture** with 10+ different AI agents
- **Neon Postgres + pgvector** for main database with embeddings
- **Organization-scoped agents** with user management

### **🏗️ Core Architecture Decisions:**

#### **1. Database Strategy:**
- **Single PostgreSQL database** with pgvector extension
- **No separate vector database** - everything in one place
- **Development**: Docker with pgvector
- **Production**: Existing Neon subscription

#### **2. Agent Management:**
- **Comprehensive agents table** with 4 main categories:
  - **Persona**: Name, description, instructions, model config
  - **Knowledge**: RAG sources, embedding models, files/URLs
  - **Tasks**: Capabilities, quick tasks, scheduling
  - **Visibility**: Public/private/hidden, org access control

#### **3. Data Retention:**
- **30-day auto-cleanup** for conversations, files, and agent states
- **Persistent until user deletion** for active sessions

#### **4. File Management:**
- **Workspace integration** with existing `@workspaces` folder
- **Path structure**: `workspaces/{org_id}/{user_id}/{conversation_id}/files/`
- **No agent_id in path** - agent context via database relationships

### **📋 Complete Database Schema (12 Tables):**

1. **organizations** - Clerk organization management
2. **users** - Clerk user management  
3. **agents** - Comprehensive agent definitions
4. **agent_knowledge_sources** - RAG configuration
5. **agent_quick_tasks** - Pre-prompted tasks
6. **organization_agents** - Access control
7. **conversations** - Chat sessions
8. **messages** - Chat messages with rich content
9. **files** - File management (uploads + AI-generated)
10. **message_files** - File attachments
11. **agent_states** - Persistent user-agent state
12. **embeddings** - RAG vector storage

### **🔗 Key Relationships:**
- **Organization → Users**: 1:N (multi-tenant)
- **User + Agent → Conversations**: Many-to-many via conversations
- **Conversation → Messages**: 1:N (chat history)
- **Agent → Knowledge Sources**: 1:N (RAG configuration)
- **File → Embeddings**: 1:N (RAG-specific per agent)

## 🚀 **How We Will Develop**

### **📅 Implementation Phases:**

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
- **Webhook handlers** for real-time org/user sync
- **JWT validation** continuation
- **Organization management** with database persistence

#### **Phase 3: Agent Integration**
- **Update existing agent handlers** (Stock, Ringi, BPP, Generic)
- **Backward compatibility** maintained
- **Enhanced handlers** using new database schema

#### **Phase 4: File Management Enhancement**
- **Enhance workspace system** with database tracking
- **File lifecycle management**
- **RAG integration** for file processing

#### **Phase 5: RAG Integration**
- **On-demand embedding generation**
- **Agent-specific embedding models**
- **Vector similarity search**

### **🔧 Integration Strategy:**

#### **Existing Systems Integration:**
- **Clerk**: Webhooks + JWT validation
- **Agno AI**: Memory capabilities + PostgreSQL integration
- **Workspace System**: File storage + database tracking
- **Agent Framework**: Enhanced handlers with persistence

#### **Migration Approach:**
- **Greenfield start** - no existing data to migrate
- **Incremental rollout** - deploy new features gradually
- **Zero downtime** - seamless transition
- **Backward compatibility** - keep existing systems working

### **📁 File Structure:**
```
workspaces/{org_id}/{user_id}/{conversation_id}/files/
├── uploads/          # User uploaded files
├── generated/        # AI-generated files  
└── attachments/      # Message attachments
```

### **⚡ Key Features:**
- **Multi-agent support** with different capabilities
- **RAG-ready** with on-demand embeddings
- **Rich content** support (text, images, documents, charts)
- **Conversation sharing** within organizations
- **Persistent agent states** across sessions
- **Scheduling capabilities** built into agents
- **Auto-cleanup** policies for data retention

## 🎯 **Next Steps:**
1. **Start Phase 1**: Docker database setup
2. **Create core schema**: All 12 tables
3. **Basic Clerk integration**: Webhook handlers
4. **Agent enhancement**: Update existing handlers
5. **File management**: Workspace + database integration

## 📊 **Technical Stack:**
- **Database**: PostgreSQL + pgvector
- **Authentication**: Clerk
- **Backend**: FastAPI + Agno AI Framework
- **Frontend**: Next.js + CopilotKit
- **File Storage**: Local workspace system
- **Vector Search**: pgvector with OpenAI embeddings

---

**Status**: ✅ Database design complete, ready for implementation
**Next**: Begin Phase 1 - Database setup and core schema creation
