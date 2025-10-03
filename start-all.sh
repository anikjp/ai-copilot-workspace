#!/bin/bash

# AI-Powered Workspace Management Platform Startup Script
echo "🚀 Starting AI-Powered Workspace Management Platform..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
echo "🔍 Checking ports..."
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 8000 || exit 1

# Start agno-agents backend
echo "🐍 Starting Agno Agents Backend (port 8000)..."
cd apps/agno-agents
poetry config virtualenvs.in-project true
poetry install --no-interaction --no-root
poetry run python main.py &
AGNO_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start simple-agent-ui
echo "🎨 Starting Simple Agent UI (port 3001)..."
cd ../simple-agent-ui
pnpm dev &
UI_PID=$!

# Wait a moment for the UI to start
sleep 3

# Start workspaces-site
echo "🏠 Starting Workspaces Site (port 3000)..."
cd ../workspaces-site
pnpm dev &
SITE_PID=$!

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Access your applications:"
echo "   Main Site:        http://localhost:3000"
echo "   Simple Agent UI:  http://localhost:3001"
echo "   Agno Backend:     http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $AGNO_PID 2>/dev/null
    kill $UI_PID 2>/dev/null
    kill $SITE_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
