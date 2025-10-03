# AI-Powered Workspace Management Platform

A comprehensive AI-powered workspace management platform built with Next.js, TypeScript, Tailwind CSS, and integrated with Agno agents using the AG-UI protocol.

## 🏗️ Architecture

This project follows a **3-tier architecture** with AI agent integration:

### **Backend (Python)**

- **`@agno-agents/`** - Agno framework with AG-UI protocol
- **FastAPI** - Web server with streaming endpoints
- **Specialized Agents** - Workspace management and general purpose agents

### **Frontend (Next.js)**

- **`@workspaces-site/`** - Main landing page and navigation
- **`@canvas-agents-ui/`** - Advanced AI agent interfaces with CopilotKit
- **AG-UI Integration** - Real-time agent communication

### **AI Integration**

- **Agno Framework** - Multi-agent system with memory and reasoning
- **AG-UI Protocol** - Event-driven communication between frontend and agents
- **CopilotKit** - Advanced AI copilot framework for rich interactions

## 🚀 Features

### **AI Agents**

- **General Purpose Agent** - Handles general queries and calculations
- **Workspace Manager Agent** - Specialized in project and task management
- **Real-time Communication** - AG-UI protocol for streaming responses
- **Tool Integration** - Agents can create projects, manage tasks, and search workspace

### **Workspace Management**

- **Project Creation** - AI agents can create and manage projects
- **Task Tracking** - Add, update, and track tasks across projects
- **Workspace Search** - Intelligent search through projects and tasks
- **Real-time Updates** - Live synchronization between agents and UI

### **Modern UI**

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Built-in theme switching
- **Interactive Components** - Rich UI with shadcn/ui components
- **Real-time Chat** - Advanced chat interface with CopilotKit

## 📁 Project Structure

```
aj-copilot/
├── apps/
│   ├── workspaces-site/          # Main landing page and navigation
│   │   ├── src/app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── chat/             # Chat interface (redirects to canvas-agents-ui)
│   │   │   └── workspace/        # Workspace interface (redirects to canvas-agents-ui)
│   │   └── src/components/       # UI components
│   │
│   ├── canvas-agents-ui/         # Advanced AI agent interfaces
│   │   ├── app/
│   │   │   ├── agno-agent/       # General purpose AI agent
│   │   │   ├── workspace-agent/  # Workspace management agent
│   │   │   └── api/copilotkit/   # CopilotKit API routes
│   │   └── components/           # Advanced UI components
│   │
│   └── agno-agents/              # Python backend with Agno agents
│       ├── main.py               # FastAPI server with AG-UI
│       ├── workspace_agent.py    # Workspace management agent
│       └── requirements.txt      # Python dependencies
│
└── package.json                  # Monorepo configuration
```

## 🛠️ Getting Started

### **Prerequisites**

- Node.js 18+ and pnpm
- Python 3.8+ and Poetry
- OpenAI API Key

### **1. Install Dependencies**

```bash
# Install root dependencies
pnpm install

# Install Python dependencies
cd apps/agno-agents
poetry install
```

### **2. Environment Setup**

Create `.env` files in the respective directories:

**`apps/agno-agents/.env`:**

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8001
```

**`apps/canvas-agents-ui/.env.local`:**

```env
NEXT_PUBLIC_AGNO_BASE_URL=http://localhost:8001
```

### **3. Start the Services**

**Terminal 1 - Start the Agno backend:**

```bash
cd apps/agno-agents
poetry run python main.py
```

**Terminal 2 - Start the canvas-agents-ui:**

```bash
cd apps/canvas-agents-ui
pnpm dev
```

**Terminal 3 - Start the workspaces-site:**

```bash
cd apps/workspaces-site
pnpm dev
```

### **4. Access the Application**

- **Main Site**: <http://localhost:3000>
- **Canvas Agents UI**: <http://localhost:3001>
- **Agno Backend**: <http://localhost:8001>

## 🤖 AI Agent Capabilities

### **General Purpose Agent**

- Mathematical calculations
- General queries and assistance
- Tool execution and reasoning

### **Workspace Manager Agent**

- **Project Management**: Create, update, and organize projects
- **Task Tracking**: Add, assign, and track tasks
- **Workspace Search**: Intelligent search through all workspace data
- **Status Updates**: Real-time project and task status management
- **Insights**: Provide workspace analytics and recommendations

## 🔧 Development

### **Adding New Agents**

1. Create agent in `apps/agno-agents/`
2. Add AG-UI interface
3. Update FastAPI routes
4. Create frontend page in `apps/canvas-agents-ui/`
5. Update CopilotKit API routes

### **Customizing UI**

- **Main Site**: Edit `apps/workspaces-site/src/`
- **Agent Interfaces**: Edit `apps/canvas-agents-ui/`
- **Components**: Use shadcn/ui components

## 📚 Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **AI Framework**: Agno, AG-UI Protocol, CopilotKit
- **Backend**: FastAPI, Python, Pydantic
- **AI Models**: OpenAI GPT-4o-mini
- **State Management**: React hooks, AG-UI events
- **Styling**: Tailwind CSS, CSS Variables, Dark mode

## 🌟 Key Features

- **Real-time AI Communication** - AG-UI protocol for streaming responses
- **Multi-Agent System** - Specialized agents for different tasks
- **Rich Interactions** - Interactive tool calls and user feedback
- **Modern UI** - Clean, responsive design with dark mode
- **Workspace Management** - Complete project and task management
- **Search & Analytics** - Intelligent workspace insights

## 📖 Based on Vercel AI Chatbot

This project is built following the patterns and structure of the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) repository, enhanced with Agno agents and AG-UI protocol for advanced AI capabilities.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
