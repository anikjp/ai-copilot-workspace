# AJ Copilot - Project Architecture Restructure

## 🎯 **Current Issues:**
- **Mixed concerns** in `@agno-agents/` (AI agents + auth + core services)
- **Tight coupling** between agent logic and infrastructure
- **Hard to scale** and maintain

## 🏗️ **Proposed Architecture:**

### **📁 New Project Structure:**
```
aj-copilot/
├── apps/
│   ├── agno-agents/           # Pure AI Agent implementations
│   ├── simple-agent-ui/       # Frontend (Next.js)
│   ├── workspaces-site/       # Workspace management UI
│   ├── core-api/              # 🆕 Core backend services
│   └── auth-service/          # 🆕 Standalone auth service
├── packages/
│   ├── shared-types/          # 🆕 Shared TypeScript types
│   └── shared-utils/          # 🆕 Shared utilities
└── docs/
```

## 🚀 **New Services Breakdown:**

### **1. 🔐 `auth-service/` (Standalone)**
**Purpose**: Authentication & user management
**Tech**: FastAPI + Python
**Responsibilities**:
- Clerk integration & JWT validation
- User & organization management
- Authentication middleware
- User/org synchronization

**What moves here**:
- `apps/agno-agents/auth/` → `apps/auth-service/`
- Clerk provider, organization manager
- JWT utilities, IDP management

### **2. 🏗️ `core-api/` (New Core Services)**
**Purpose**: Core backend functionality
**Tech**: FastAPI + Python
**Responsibilities**:
- Database management (PostgreSQL + pgvector)
- Conversation & message management
- File management & workspace integration
- RAG services & embeddings
- Agent configuration management
- Cleanup jobs & retention policies

**What this includes**:
- All 12 database tables & schemas
- Conversation/chat APIs
- File upload/management APIs
- RAG & embedding services
- Agent configuration APIs
- Background jobs (cleanup, etc.)

### **3. 🤖 `agno-agents/` (Pure AI Agents)**
**Purpose**: AI agent implementations only
**Tech**: Python + Agno AI Framework
**Responsibilities**:
- Stock analysis agent
- Ringi system agent
- BPP assistant agent
- Generic agent
- Agent-specific workflows
- Tool implementations

**What stays here**:
- Agent implementations (`agents/stock_agent/`, etc.)
- Agent workflows & prompts
- Tool definitions
- Agent-specific logic

**What moves out**:
- `auth/` → `auth-service/`
- Database models → `core-api/`
- Core services → `core-api/`

## 🔗 **Service Communication:**

### **API Flow:**
```
Frontend (Next.js)
    ↓
Auth Service (JWT validation)
    ↓
Core API (conversations, files, config)
    ↓
AI Agents (agent-specific logic)
```

### **Internal Communication:**
- **Auth Service** ↔ **Core API**: User/org validation
- **Core API** ↔ **AI Agents**: Agent configuration, conversation data
- **Frontend** ↔ **All Services**: REST/GraphQL APIs

## 📋 **Migration Plan:**

### **Phase 1: Create New Services**
1. **Create `auth-service/`**:
   - Move `apps/agno-agents/auth/` → `apps/auth-service/`
   - Add FastAPI app with auth endpoints
   - Docker setup

2. **Create `core-api/`**:
   - Database schema & models
   - Conversation/message APIs
   - File management APIs
   - RAG services

### **Phase 2: Clean Up `agno-agents/`**
1. **Remove auth dependencies**
2. **Remove database models**
3. **Keep only agent implementations**
4. **Update agent handlers to use Core API**

### **Phase 3: Integration**
1. **Update frontend** to use new service endpoints
2. **Configure service communication**
3. **Add Docker Compose** for local development

## 🐳 **Docker Architecture:**

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    # Database for all services
  
  auth-service:
    build: ./apps/auth-service
    ports: ["8001:8000"]
  
  core-api:
    build: ./apps/core-api
    ports: ["8002:8000"]
    depends_on: [postgres]
  
  agno-agents:
    build: ./apps/agno-agents
    ports: ["8003:8000"]
    depends_on: [core-api, auth-service]
  
  simple-agent-ui:
    build: ./apps/simple-agent-ui
    ports: ["3000:3000"]
    depends_on: [auth-service, core-api]
```

## 🎯 **Benefits:**

### **✅ Separation of Concerns:**
- **Auth Service**: Pure authentication logic
- **Core API**: Business logic & data management
- **AI Agents**: Pure agent implementations
- **Frontend**: UI & user experience

### **✅ Scalability:**
- **Independent scaling** of each service
- **Microservice architecture** benefits
- **Technology flexibility** per service

### **✅ Maintainability:**
- **Clear boundaries** between services
- **Easier testing** and debugging
- **Team collaboration** improvements

### **✅ Development:**
- **Independent development** of services
- **Clear API contracts** between services
- **Better code organization**

## 🚀 **Implementation Order:**

1. **Create `auth-service/`** (move existing auth code)
2. **Create `core-api/`** (database + core functionality)
3. **Clean up `agno-agents/`** (remove non-agent code)
4. **Update frontend** (use new service endpoints)
5. **Add Docker Compose** (local development)

## 📊 **API Endpoints:**

### **Auth Service (`:8001`)**:
- `POST /auth/validate` - JWT validation
- `GET /auth/user` - User info
- `GET /auth/organization` - Organization info

### **Core API (`:8002`)**:
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `GET /conversations/{id}/messages` - Get messages
- `POST /files/upload` - File upload
- `POST /embeddings/generate` - Generate embeddings

### **AI Agents (`:8003`)**:
- `POST /agents/stock-analysis` - Stock agent
- `POST /agents/ringi-system` - Ringi agent
- `POST /agents/bpp-assistant` - BPP agent
- `POST /agents/generic` - Generic agent

---

**This architecture provides clean separation, better scalability, and easier maintenance!**

**Ready to start with creating the `auth-service/` first?** 🚀
