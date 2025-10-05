# Q&A Session 4: Database Schema Design

**Date:** [To be filled]  
**Participants:** User, AI Assistant  
**Topic:** Database Schema Design

## Questions to Discuss

### 1. Core entities
- **Question:** What are the main entities we need to track?
- **Answer:**
  - **Organizations**: Clerk organizations (multi-tenant)
  - **Users**: Clerk users with org membership
  - **Agents**: Different agent types (stock, ringi, bpp, generic, etc.)
  - **Conversations/Sessions**: 1 conversation = 1 session
  - **Messages**: Chat messages with rich content support
  - **Files**: User uploads + AI generated files
  - **Agent States**: Persistent state per user/agent combination
  - **Embeddings**: RAG-specific content (agent-specific)
  - **File Metadata**: Track file types, sources, permissions
- **Status:** ✅ Complete

### 2. Relationships
- **Question:** How do organizations, users, agents, conversations, and messages relate?
- **Answer:**
  - **Organization → Users**: One-to-many (1 org has many users)
  - **User → Conversations**: One-to-many (1 user has many conversations)
  - **Agent → Conversations**: One-to-many (1 agent can have many conversations)
  - **Conversation → Messages**: One-to-many (1 conversation has many messages)
  - **Conversation → Files**: One-to-many (1 conversation can have many files)
  - **User + Agent → Agent State**: Many-to-many with state (user-agent combination has state)
  - **File → Embeddings**: One-to-many (1 file can have multiple embeddings per agent)
  - **Organization → Agents**: Many-to-many (orgs can access multiple agents)
- **Status:** ✅ Complete

### 3. Data types and constraints
- **Question:** What data types and constraints do we need?
- **Answer:**
  - **UUIDs**: Primary keys for all entities
  - **Timestamps**: Created/updated timestamps with timezone
  - **JSONB**: For flexible data (agent states, message metadata, file metadata)
  - **TEXT**: For message content, file paths, descriptions
  - **ENUMs**: For status fields (conversation status, file types, agent types)
  - **Foreign Keys**: Proper referential integrity
  - **Indexes**: Performance optimization for queries
  - **Constraints**: NOT NULL, UNIQUE where appropriate
- **Status:** ✅ Complete

## 🏗️ **Comprehensive Database Schema Design**

### 📊 **Enhanced Entity Relationship Diagram:**

```
┌─────────────────┐     ┌─────────────────┐
│ Organizations   │────▶│ Users           │
│ (Clerk)         │ 1:N │ (Clerk)         │
└─────────────────┘     └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│ Org_Agents      │     │ Conversations   │
│ (Access Control)│     │ (Sessions)      │
└─────────────────┘     └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│ Agents          │     │ Messages        │
│ (Comprehensive) │     │ (Chat + Files)  │
└─────────────────┘     └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│ Knowledge       │     │ Files           │
│ Sources         │     │ (Uploads + AI)  │
│ (RAG Config)    │     └─────────────────┘
└─────────────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Quick Tasks     │     │ Embeddings      │
│ (Pre-prompts)   │     │ (RAG-specific)  │
└─────────────────┘     └─────────────────┘
         │                        │
         ▼                        │
┌─────────────────┐              │
│ Agent_States    │              │
│ (User+Agent)    │              │
└─────────────────┘              │
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Agent_States    │
                        │ (Persistent)    │
                        └─────────────────┘
```

### 🗂️ **Detailed Table Schemas (Enhanced for Agent Management):**

#### **1. Organizations Table:**
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_org_id TEXT UNIQUE NOT NULL, -- From Clerk
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **2. Users Table:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- From Clerk
    organization_id UUID REFERENCES organizations(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'member', -- org:admin, org:member
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **3. Agents Table (Comprehensive):**
```sql
CREATE TYPE agent_type AS ENUM ('stock_analysis', 'ringi_system', 'bpp_assistant', 'generic_chat', 'custom', 'it_support', 'sales', 'hr', 'research');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE agent_visibility AS ENUM ('public', 'private', 'hidden');

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 1. PERSONA (Basic Information)
    name TEXT NOT NULL,                                    -- "IT support agent"
    description TEXT,                                      -- "Designed to help troubleshoot..."
    instructions TEXT,                                     -- System prompt/instructions
    model_config JSONB NOT NULL DEFAULT '{}',             -- Model selection & config
    
    -- 2. KNOWLEDGE (RAG Configuration)
    knowledge_sources JSONB DEFAULT '{}',                 -- Files, folders, URLs for RAG
    embedding_model TEXT,                                 -- For RAG agents
    rag_enabled BOOLEAN DEFAULT false,                    -- RAG capability flag
    
    -- 3. TASKS (Capabilities & Scheduling)
    capabilities TEXT[] DEFAULT '{}',                     -- ["troubleshooting", "scheduling"]
    quick_tasks JSONB DEFAULT '{}',                       -- Pre-prompted quick questions
    scheduling_config JSONB DEFAULT '{}',                 -- Scheduling capabilities
    
    -- 4. VISIBILITY (Access Control)
    visibility agent_visibility DEFAULT 'private',        -- Public/Private/Hidden
    organization_id UUID REFERENCES organizations(id),    -- Org-specific agents
    
    -- Core Configuration
    type agent_type NOT NULL,
    status agent_status DEFAULT 'active',
    version TEXT DEFAULT '1.0.0',
    icon_url TEXT,                                        -- Agent icon/avatar
    metadata JSONB DEFAULT '{}',                          -- Additional config
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **4. Agent_Knowledge_Sources (RAG Configuration):**
```sql
CREATE TYPE knowledge_source_type AS ENUM ('file', 'folder', 'url', 'database', 'api');

CREATE TABLE agent_knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    source_type knowledge_source_type NOT NULL,
    source_path TEXT NOT NULL,                              -- File path, URL, etc.
    source_name TEXT NOT NULL,                              -- Display name
    enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',                            -- Additional source config
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, source_path)
);
```

#### **5. Agent_Quick_Tasks (Pre-prompted Tasks):**
```sql
CREATE TABLE agent_quick_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    title TEXT NOT NULL,                                    -- Task title
    prompt TEXT NOT NULL,                                   -- Pre-prompted question/task
    category TEXT,                                          -- Task category
    icon TEXT,                                              -- Task icon
    order_index INTEGER DEFAULT 0,                          -- Display order
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **6. Organization_Agents (Access Control):**
```sql
CREATE TABLE organization_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    agent_id UUID REFERENCES agents(id),
    enabled BOOLEAN DEFAULT true,
    user_visibility agent_visibility DEFAULT 'private',    -- Override agent visibility
    config JSONB DEFAULT '{}',                             -- Org-specific agent config
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, agent_id)
);
```

#### **7. Conversations Table:**
```sql
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'deleted');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    organization_id UUID REFERENCES organizations(id),
    status conversation_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}', -- Conversation metadata
    shared_with UUID[], -- Array of user IDs who can access
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **8. Messages Table:**
```sql
CREATE TYPE message_type AS ENUM ('user', 'assistant', 'system', 'tool');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'failed');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    type message_type NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}', -- Rich content, tool calls, etc.
    status message_status DEFAULT 'sent',
    parent_message_id UUID REFERENCES messages(id), -- For threading
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **9. Files Table:**
```sql
CREATE TYPE file_type AS ENUM ('upload', 'generated', 'attachment');
CREATE TYPE file_status AS ENUM ('processing', 'ready', 'failed');

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    name TEXT NOT NULL,
    original_name TEXT,
    file_path TEXT NOT NULL, -- Path in workspace storage
    file_type file_type NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    status file_status DEFAULT 'processing',
    metadata JSONB DEFAULT '{}', -- File metadata, OCR results, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **10. Message_Files (Junction Table):**
```sql
CREATE TABLE message_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id),
    file_id UUID REFERENCES files(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, file_id)
);
```

#### **11. Agent_States Table:**
```sql
CREATE TABLE agent_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    state_data JSONB NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agent_id)
);
```

#### **12. Embeddings Table (RAG-specific):**
```sql
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    source_type TEXT NOT NULL, -- 'file', 'web', 'message', 'user_input'
    source_id UUID, -- Reference to files, messages, etc.
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 🔍 **Key Indexes for Performance:**
```sql
-- Conversation queries
CREATE INDEX idx_conversations_user_agent ON conversations(user_id, agent_id);
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Message queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_type ON messages(type);

-- File queries
CREATE INDEX idx_files_conversation ON files(conversation_id);
CREATE INDEX idx_files_type ON files(file_type);

-- Agent state queries
CREATE INDEX idx_agent_states_user_agent ON agent_states(user_id, agent_id);

-- Embedding queries
CREATE INDEX idx_embeddings_agent ON embeddings(agent_id);
CREATE INDEX idx_embeddings_source ON embeddings(source_type, source_id);
```

### 🎯 **File Management Strategy:**

#### **Workspace Integration:**
- **Physical Storage**: Use existing `@workspaces` folder structure
- **Database Tracking**: Store file metadata and relationships in database
- **Path Structure**: `workspaces/{org_id}/{user_id}/{conversation_id}/files/`
- **File Types**: Support uploads, AI-generated files, attachments
- **Agent Context**: Files are conversation-scoped (not agent-specific in path)
  - Agent context maintained in database via `conversation_id → agent_id` relationship

#### **File Lifecycle:**
1. **Upload**: User uploads → Store in workspace → Create DB record
2. **Processing**: OCR, embedding generation (if RAG agent)
3. **Usage**: Attach to messages, generate new files
4. **Cleanup**: Archive or delete based on retention policies

### 🎯 **Agent Configuration Examples:**

#### **IT Support Agent Example:**
```sql
INSERT INTO agents (
    name, 
    description, 
    instructions, 
    model_config,
    knowledge_sources,
    capabilities,
    quick_tasks,
    scheduling_config,
    type,
    rag_enabled
) VALUES (
    'IT Support Agent',
    'Designed to help troubleshoot and resolve technical issues efficiently',
    'You are an IT support agent, adept at troubleshooting and resolving technical challenges while empowering users with technology solutions. Use a technical yet friendly tone of voice. Use step-by-step instructions and code snippets where necessary.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.7}',
    '{"files": ["/knowledge/it-docs/"], "urls": ["https://docs.company.com/"]}',
    ARRAY['troubleshooting', 'technical_support', 'system_diagnostics', 'user_training'],
    '{"tasks": [{"title": "Reset Password", "prompt": "Help user reset their password"}, {"title": "Software Installation", "prompt": "Guide through software installation"}]}',
    '{"enabled": true, "timezone": "UTC", "working_hours": "9-17"}',
    'it_support',
    true
);
```

#### **Stock Analysis Agent Example:**
```sql
INSERT INTO agents (
    name,
    description, 
    instructions,
    model_config,
    capabilities,
    type,
    rag_enabled
) VALUES (
    'Stock Analysis Agent',
    'Comprehensive portfolio analysis with real-time insights',
    'You are a financial advisor specializing in stock analysis and portfolio management...',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.3}',
    ARRAY['portfolio_analysis', 'market_research', 'risk_assessment', 'investment_planning'],
    'stock_analysis',
    false
);
```

### 📁 **File Management Strategy:**
**✅ No agent_id in file path needed:**
- **Conversation-scoped**: Files belong to conversations
- **Agent context**: Maintained via `conversation_id → agent_id` relationship
- **Simpler paths**: `workspaces/{org_id}/{user_id}/{conversation_id}/files/`
- **Database tracking**: Agent context stored in database relationships

## Status: ✅ Complete
**Next Session:** Implementation Plan & Migration Strategy
