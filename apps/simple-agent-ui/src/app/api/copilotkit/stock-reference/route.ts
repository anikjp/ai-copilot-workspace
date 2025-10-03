// Import CopilotKit runtime components for AI agent integration
import {
  CopilotRuntime, // Core runtime for managing AI agents and conversations
  copilotRuntimeNextJSAppRouterEndpoint, // Next.js App Router integration helper
  OpenAIAdapter, // Adapter for OpenAI-compatible API endpoints
} from "@copilotkit/runtime";

// Import Next.js request type for proper TypeScript typing
import { NextRequest } from "next/server";

// Import HttpAgent for communicating with external AI agents
import { HttpAgent } from "@ag-ui/client";

// STEP 1: Initialize HTTP Agent for Stock Agent Reference Backend
// Create agent connection to our FastAPI Stock Agent Reference service
const stockReferenceAgent = new HttpAgent({
  // Use environment variable for backend URL, fallback to localhost
  url: process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/stock-reference",
});

// STEP 2: Configure OpenAI Service Adapter
// Set up adapter for OpenAI-compatible API communication
const serviceAdapter = new OpenAIAdapter();

// STEP 3: Initialize CopilotKit Runtime
// Create the main runtime that orchestrates AI agent interactions
const runtime = new CopilotRuntime({
  agents: {
    // Our FastAPI endpoint URL for Stock Agent Reference
    // @ts-ignore - Suppress TypeScript error for agent configuration
    agnoAgent: stockReferenceAgent, // Register our Stock Agent Reference
  },
});

// STEP 4: Define POST Request Handler
// Export async function to handle incoming POST requests from CopilotKit
export const POST = async (req: NextRequest) => {
  // Add debugging
  console.log("CopilotKit request received for Stock Agent Reference (HttpAgent)");
  console.log("Stock Reference Agent URL:", process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/stock-reference");
  console.log("Runtime agents:", Object.keys(runtime.agents || {}));
  
  // STEP 5: Create Request Handler with CopilotKit Integration
  // Configure the endpoint handler with our runtime and service adapter
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime, // Our configured CopilotKit runtime with agents
    serviceAdapter, // OpenAI adapter for LLM communication
    endpoint: "/api/copilotkit/stock-reference", // This API route's endpoint path
  });

  // STEP 6: Process and Return Request
  // Delegate request handling to CopilotKit's built-in handler
  // This will route requests to appropriate agents and handle responses
  const response = await handleRequest(req);
  console.log("Stock Reference Agent response status:", response.status);
  console.log("Stock Reference Agent response headers:", Object.fromEntries(response.headers.entries()));
  return response;
};
