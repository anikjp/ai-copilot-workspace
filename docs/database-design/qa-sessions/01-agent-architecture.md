# Q&A Session 1: Agent Architecture

**Date:** [Current Date]  
**Participants:** User, AI Assistant  
**Topic:** Agent Architecture Requirements

## Questions & Answers

### 1. How many types of agents do you have?

**Answer:**
- Currently: 2 agents
- Planned: More than 10 agents expected
- Each agent can have different structure and use cases

**Notes:**
- Need flexible schema to accommodate many different agent types
- Each agent may have unique requirements

### 2. Do agents have different schemas for their state?

**Answer:**
- **Multi-tenant**: Each organization has many members
- **N:N Relationship**: Each member can access multiple AI agents
- **Session-based**: Each member will have many sessions with many AI agents
- **Two types of data per session**:
  1. **Chat/Message data**: Rich conversation history
  2. **State data**: Agent-specific state (e.g., Stock Agent portfolio state)

**Key Insight:**
- Need separate tables for chat messages and agent states
- Each session needs to support multiple state types
- Flexible JSONB structure for different agent state schemas

### 3. Are agents organization-specific or global?

**Answer:**
- **Definitely organization-specific**
- Agents should be scoped to organizations

**Implications:**
- Need organization_id foreign key in agent_types table
- Agent configuration can vary per organization
- Multi-tenant isolation required

### 4. Do agents share any common state?

**Answer:**
- **No idea currently**
- **Recommendation**: Should be separated
- Keep agent states independent for now

## Design Decisions

### ✅ Confirmed Schema Elements:
1. **Separate Chat & State Tables**
   - `messages` table for conversation history
   - `agent_session_states` table for agent-specific state

2. **Organization-Scoped Agents**
   - `agent_types` table with `organization_id` foreign key
   - Unique constraint on (organization_id, agent_name)

3. **N:N User-Agent Sessions**
   - `user_agent_sessions` table as bridge
   - Multiple sessions per user per agent allowed

4. **Flexible State Storage**
   - JSONB for `state_data` in `agent_session_states`
   - Multiple state types per session via `state_type` field

### 🎯 Next Questions to Address:
- Chat & Context requirements
- Embeddings & Vector Search use cases
- Data relationships and constraints
- Performance and scaling considerations

## Schema Draft

```sql
-- Core tables identified:
organizations (clerk integration)
users (clerk integration)
agent_types (organization-scoped)
user_agent_sessions (N:N bridge)
messages (chat data + embeddings)
agent_session_states (flexible JSONB state)
```

## Status: ✅ Complete
**Next Session:** Chat & Context Requirements
