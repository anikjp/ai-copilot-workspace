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

// STEP 1: Configure OpenAI Service Adapter
// Set up adapter for OpenAI-compatible API communication
const serviceAdapter = new OpenAIAdapter();

// Create a custom HttpAgent with detailed logging
class DetailedLoggingHttpAgent extends HttpAgent {
  run(input: any) {
    console.log("🔶 STOCK-REFERENCE HttpAgent.run() called with input:", {
      threadId: input.threadId,
      runId: input.runId,
      messagesCount: input.messages?.length,
      toolsCount: input.tools?.length,
      state: input.state
    });
    
    console.log("🔶 STOCK-REFERENCE HttpAgent - Target URL:", this.url);
    console.log("🔶 STOCK-REFERENCE HttpAgent - Headers:", this.headers);
    
    return super.run(input);
  }
  
  protected requestInit(input: any): RequestInit {
    console.log("🔶 STOCK-REFERENCE HttpAgent.requestInit() - Building fetch request");
    console.log("🔶 STOCK-REFERENCE HttpAgent - Target URL:", this.url);
    console.log("🔶 STOCK-REFERENCE HttpAgent - Sending messages count:", input.messages?.length);
    
    const init = super.requestInit(input);
    console.log("🔶 STOCK-REFERENCE HttpAgent - Request init:", {
      method: init.method,
      headers: init.headers,
      bodyLength: init.body ? String(init.body).length : 0
    });
    return init;
  }
}

// STEP 2: Initialize CopilotKit Runtime (will be overridden in POST handler)
// Create the main runtime that orchestrates AI agent interactions
// Note: This runtime is not used - we create a new one with Clerk auth in the POST handler
const runtime = new CopilotRuntime({
  agents: {
    // Placeholder - will be replaced with authenticated runtime in POST handler
    agnoAgent: new DetailedLoggingHttpAgent({
      url: process.env.NEXT_PUBLIC_AGNO_URL || "http://localhost:8000/agents/stock-reference",
      headers: {
        "Content-Type": "application/json",
        // No hardcoded token - will use Clerk token in POST handler
      },
    }),
  },
});

// STEP 3: Define POST Request Handler
// Export async function to handle incoming POST requests from CopilotKit
export const POST = async (req: NextRequest) => {
  // Add debugging
  console.log("🔵 STOCK-REFERENCE API: CopilotKit request received for Stock Agent Reference");
  console.log("🔵 STOCK-REFERENCE API: URL:", req.url);
  console.log("🔵 STOCK-REFERENCE API: Method:", req.method);
  
  // Debug environment variables
  console.log("🔵 STOCK-REFERENCE API: CLERK_SECRET_KEY present:", !!process.env.CLERK_SECRET_KEY);
  console.log("🔵 STOCK-REFERENCE API: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY present:", !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  
  // STEP 3.1: Clerk Authentication
  // Get the authenticated user from Clerk
  const { getToken, userId } = await auth();
  
  console.log("🔵 STOCK-REFERENCE API: Auth debug - userId:", userId);
  console.log("🔵 STOCK-REFERENCE API: Auth debug - getToken function:", typeof getToken);
  
  // Check request headers for debugging
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  console.log("🔵 STOCK-REFERENCE API: Auth header:", authHeader ? "Present" : "Not present");
  console.log("🔵 STOCK-REFERENCE API: Cookie header:", cookieHeader ? "Present" : "Not present");
  
  if (!userId) {
    console.log("🔵 STOCK-REFERENCE API: No authenticated user found");
    return new Response(
      JSON.stringify({ error: "Unauthorized - Please sign in to access this feature" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("🔵 STOCK-REFERENCE API: Authenticated user ID:", userId);
  
  // Get the JWT token from Clerk using custom template
  const clerkToken = await getToken({ template: "backend-auth-local" });
  if (!clerkToken) {
    console.log("🔵 STOCK-REFERENCE API: Failed to get Clerk token");
    return new Response(
      JSON.stringify({ error: "Authentication failed - Unable to get token" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("🔵 STOCK-REFERENCE API: Clerk token obtained successfully");
  console.log("🔵 STOCK-REFERENCE API: Using Clerk token (first 50 chars):", clerkToken.substring(0, 50) + "...");
  
  // STEP 3.2: Create Runtime with Clerk Token
  // Create a new runtime with the Clerk token for this request
  const runtimeWithAuth = new CopilotRuntime({
    agents: {
      agnoAgent: new DetailedLoggingHttpAgent({
        url: process.env.AGENT_STOCK_REFERENCE_URL || "http://localhost:8000/agents/stock-reference",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clerkToken}`,
        },
      }),
    },
  });
  
  // STEP 4: Create Request Handler with CopilotKit Integration
  // Configure the endpoint handler with our runtime and service adapter
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeWithAuth, // Our configured CopilotKit runtime with Clerk authentication
    serviceAdapter, // OpenAI adapter for LLM communication
    endpoint: "/api/copilotkit/stock-reference", // This API route's endpoint path
  });

  // STEP 5: Process and Return Request
  // Delegate request handling to CopilotKit's built-in handler
  // This will route requests to appropriate agents and handle responses
  const response = await handleRequest(req);
  console.log("🔵 STOCK-REFERENCE API: Response status:", response.status);
  console.log("🔵 STOCK-REFERENCE API: Response headers:", Object.fromEntries(response.headers.entries()));
  return response;
};
