# Q&A Session 2: Chat & Context

**Date:** [To be filled]  
**Participants:** User, AI Assistant  
**Topic:** Chat & Context Requirements

## Questions to Discuss

### 1. Chat Granularity
- **Question:** Is it per-conversation or per-message? Do conversations have titles/metadata?
- **Answer:** 
  - **Each chat session = separate conversation**
  - **No grouping** of multiple sessions
  - **B2B workspace approach**: Individual conversations per session
- **Status:** ✅ Complete

### 2. Context Windows
- **Question:** Do you need to store conversation context for retrieval?
- **Answer:**
  - **Yes, store conversation context**
  - **Session continuity**: Users can return anytime to continue conversations
  - **AI agent follow-up**: Agents need to remember where they left off
  - **Within-session context**: Agents reference past messages in same session
  - **No cross-session references**: Don't reference different sessions/agents
  - **No semantic search**: Not necessary across all conversations
  - **🎯 Agno AI Framework**: Supports memory capabilities
  - **🎯 PostgreSQL Integration**: Agno AI can use PostgreSQL for memory storage
- **Status:** ✅ Complete

### 3. Message Types
- **Question:** Just text, or also images, documents, structured data?
- **Answer:**
  - **Support everything**: Text, images, documents, structured data
  - **File uploads**: Users can upload files/images in each chat conversation
  - **File storage**: Save uploads in workspace storage (@workspaces folder under @agno-agents/)
  - **Structured data generation**: Charts, tables, JSON, docs, txt, CSV, HTML
  - **Rich content**: Markdown, rich formatting, and other content types
- **Status:** ✅ Complete

### 4. Conversation Sharing
- **Question:** Can conversations be shared within an organization?
- **Answer:**
  - **Yes, sharing between organization members**
  - **Share & Accept process**: One member shares, another accepts
  - **B2B collaboration**: Enable knowledge sharing within workspace
- **Status:** ✅ Complete

## Design Considerations

### Current Understanding:
- **Session-based approach**: Using `user_agent_sessions` as conversation containers
- **Message storage**: Individual messages with embeddings in `messages` table
- **Metadata support**: JSONB fields for flexible metadata storage

### Questions to Clarify:
1. How do you want to handle conversation titles/naming?
2. What kind of context retrieval do you need?
3. Will you support file uploads, images, or structured data in messages?
4. Should conversations be private to users or shareable within organization?

## Status: ✅ Complete
**Next Session:** Embeddings & Vector Search Requirements
