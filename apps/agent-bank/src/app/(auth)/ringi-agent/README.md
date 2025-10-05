# Ringi System AI Agent

## Overview

The Ringi System AI Agent is a Japanese business decision-making process facilitator that helps organizations manage the traditional Ringi (稟議) process through AI assistance.

## What is Ringi System?

The Ringi System is a traditional Japanese business decision-making process where proposals are circulated among all levels of management for approval. This collaborative approach ensures consensus before major decisions are implemented.

## Features

### Core Workflow
1. **Proposal Analysis** - Analyzes incoming business proposals
2. **Stakeholder Feedback** - Gathers feedback from management, department heads, and team leads
3. **Consensus Evaluation** - Evaluates consensus level and identifies concerns
4. **Decision Generation** - Provides final decision and recommendations

### Key Capabilities
- **Proposal Management** - Track proposal status and details
- **Stakeholder Communication** - Facilitate feedback collection
- **Consensus Analysis** - Measure agreement levels across stakeholders
- **Decision Support** - Provide structured recommendations
- **Timeline Management** - Track implementation timelines

## Usage

### Starting a Proposal
1. Navigate to `/ringi-agent` in the application
2. Submit your business proposal in the chat interface
3. The agent will analyze the proposal and begin the Ringi process

### Example Proposals
- "We need to approve a new marketing budget of $50,000 for Q2"
- "Please review the proposal to implement remote work policy"
- "Analyze the request for new software licensing for the development team"

## Technical Implementation

### Backend (Agno)
- **File**: `apps/agno-agents/ringi_system.py`
- **Endpoint**: `/ringi-agent`
- **Framework**: FastAPI with Agno workflow

### Frontend (Next.js)
- **Page**: `apps/simple-agent-ui/src/app/ringi-agent/page.tsx`
- **Layout**: `apps/simple-agent-ui/src/app/ringi-agent/layout.tsx`
- **API Route**: `apps/simple-agent-ui/src/app/api/copilotkit/ringi/route.ts`

### Configuration
- **Agent Config**: Added to `apps/simple-agent-ui/src/config/agents.ts`
- **Navigation**: Added to sidebar in `apps/simple-agent-ui/src/design-system/organisms/sidebar.tsx`

## State Management

The agent manages the following state:
- `proposal_id`: Unique identifier for the proposal
- `proposal_status`: Current status (draft, under_review, approved, etc.)
- `stakeholder_feedback`: Feedback from different stakeholder groups
- `consensus_level`: Percentage of stakeholder agreement
- `key_concerns`: Identified concerns that need addressing
- `recommendations`: Action items and next steps

## Next Steps

This is a basic implementation ready for enhancement. Future improvements could include:
- Integration with actual stakeholder management systems
- Email notifications for stakeholder feedback
- Document management for proposal attachments
- Advanced analytics and reporting
- Integration with existing business systems
