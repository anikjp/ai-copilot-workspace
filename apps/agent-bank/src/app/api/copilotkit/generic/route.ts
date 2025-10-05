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

// Import Clerk for authentication
import { auth } from '@clerk/nextjs/server';

// STEP 1: Initialize HTTP Agent for Generic Agent Backend
// Create agent connection to our FastAPI Generic Agent service
const genericAgent = new HttpAgent({
  // Use environment variable for backend URL, fallback to localhost
  url: process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/generic-agent",
});

// STEP 2: Configure OpenAI Service Adapter
// Set up adapter for OpenAI-compatible API communication
const serviceAdapter = new OpenAIAdapter();

// STEP 3: Initialize CopilotKit Runtime
// Create the main runtime that orchestrates AI agent interactions
const runtime = new CopilotRuntime({
  agents: {
    // Our FastAPI endpoint URL for Generic Agent
    // @ts-ignore - Suppress TypeScript error for agent configuration
    genericAgent: genericAgent, // Register our Generic Agent
  },
});

// STEP 4: Define POST Request Handler
// Export async function to handle incoming POST requests from CopilotKit
export const POST = async (req: NextRequest) => {
  // Add debugging
  console.log("CopilotKit request received for Generic Agent (HttpAgent)");
  console.log("Generic Agent URL:", process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/generic-agent");
  console.log("Runtime agents:", Object.keys(runtime.agents || {}));
  
  // STEP 4.1: Clerk Authentication
  // Get the authenticated user from Clerk
  const { getToken, userId } = await auth();
  
  if (!userId) {
    console.log("Generic Agent API: No authenticated user found");
    return new Response(
      JSON.stringify({ error: "Unauthorized - Please sign in to access this feature" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("Generic Agent API: Authenticated user ID:", userId);
  
  // Get the JWT token from Clerk
  const clerkToken = await getToken({ template: "backend-auth-local" });
  if (!clerkToken) {
    console.log("Generic Agent API: Failed to get Clerk token");
    return new Response(
      JSON.stringify({ error: "Authentication failed - Unable to get token" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("Generic Agent API: Clerk token obtained successfully");
  
  // STEP 4.2: Create Runtime with Clerk Token
  // Create a new runtime with the Clerk token for this request
  const runtimeWithAuth = new CopilotRuntime({
    agents: {
      genericAgent: new HttpAgent({
        url: process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/generic-agent",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clerkToken}`,
        },
      }),
    },
  });
  
  // STEP 5: Create Request Handler with CopilotKit Integration
  // Configure the endpoint handler with our runtime and service adapter
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeWithAuth, // Our configured CopilotKit runtime with Clerk authentication
    serviceAdapter, // OpenAI adapter for LLM communication
    endpoint: "/api/copilotkit/generic", // This API route's endpoint path
  });

  // STEP 6: Process and Return Request
  // Delegate request handling to CopilotKit's built-in handler
  // This will route requests to appropriate agents and handle responses
  const response = await handleRequest(req);
  console.log("Generic Agent response status:", response.status);
  console.log("Generic Agent response headers:", Object.fromEntries(response.headers.entries()));
  return response;
};
