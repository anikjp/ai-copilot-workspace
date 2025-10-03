// Import CopilotKit runtime components for AI agent integration
import {
    CopilotRuntime, // Core runtime for managing AI agents and conversations
    copilotRuntimeNextJSAppRouterEndpoint, // Next.js App Router integration helper
} from "@copilotkit/runtime";

// Import Next.js request type for proper TypeScript typing
import { NextRequest } from "next/server";

// Import HttpAgent for communicating with external AI agents
import { HttpAgent } from "@ag-ui/client";
import { tap } from "rxjs/operators";

// Import Clerk for authentication
import { auth } from '@clerk/nextjs/server';

// STEP 1: Initialize HTTP Agent for BPP Backend
// Create a custom HttpAgent with logging
class LoggingHttpAgent extends HttpAgent {
  protected requestInit(input: any): RequestInit {
    console.log("🔶 BPP HttpAgent.requestInit() - Building fetch request");
    console.log("🔶 BPP HttpAgent - Target URL:", this.url);
    console.log("🔶 BPP HttpAgent - Sending messages count:", input.messages?.length);
    
    const init = super.requestInit(input);
    console.log("🔶 BPP HttpAgent - Request init:", init);
    return init;
  }
  
  run(input: any) {
    console.log("🔶 BPP HttpAgent.run() called with input:", input);
    console.log("🔶 BPP HttpAgent - threadId:", input.threadId);
    console.log("🔶 BPP HttpAgent - runId:", input.runId);
    
    const events$ = super.run(input);
    console.log("🔶 BPP HttpAgent - Observable created, adding tap...");
    
    return events$.pipe(
      tap({
        next: (event: any) => {
          console.log("🔶 BPP HttpAgent EVENT:", event.type, event);
          if (event.type === 'TEXT_MESSAGE_CONTENT') {
            console.log("🔶 BPP HttpAgent TEXT_MESSAGE_CONTENT:", {
              messageId: event.messageId,
              hasDelta: 'delta' in event,
              delta: event.delta?.substring(0, 100)
            });
          }
        },
        error: (err: any) => {
          console.error("🔶 BPP HttpAgent ERROR:", err);
        },
        complete: () => {
          console.log("🔶 BPP HttpAgent COMPLETE");
        }
      })
    );
  }
}

const bppAgent = new LoggingHttpAgent({
  url: process.env.NEXT_PUBLIC_BPP_URL || "http://0.0.0.0:8000/bpp-agent",
  debug: true,
});

// STEP 2: Initialize CopilotKit Runtime with BPP agent
const runtime = new CopilotRuntime({
  agents: [
    {
      name: "bpp-agent",
      description: "Business Process Planning AI Assistant",
      agent: bppAgent,
    },
  ],
});

// STEP 3: Define POST Request Handler
export const POST = async (req: NextRequest) => {
  console.log("=====================================");
  console.log("🔵 BPP CLIENT API: CopilotKit request received for BPP Agent");
  console.log("🔵 BPP CLIENT API: URL:", req.url);
  console.log("🔵 BPP CLIENT API: Method:", req.method);
  
  // STEP 3.1: Clerk Authentication
  // Get the authenticated user from Clerk
  const { getToken, userId } = await auth();
  
  if (!userId) {
    console.log("🔵 BPP CLIENT API: No authenticated user found");
    return new Response(
      JSON.stringify({ error: "Unauthorized - Please sign in to access this feature" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("🔵 BPP CLIENT API: Authenticated user ID:", userId);
  
  // Get the JWT token from Clerk
  const clerkToken = await getToken();
  if (!clerkToken) {
    console.log("🔵 BPP CLIENT API: Failed to get Clerk token");
    return new Response(
      JSON.stringify({ error: "Authentication failed - Unable to get token" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  
  console.log("🔵 BPP CLIENT API: Clerk token obtained successfully");
  console.log("=====================================");

  // STEP 3.2: Create Runtime with Clerk Token
  // Create a new runtime with the Clerk token for this request
  const runtimeWithAuth = new CopilotRuntime({
    agents: [
      {
        name: "bpp-agent",
        description: "Business Process Planning AI Assistant",
        agent: new LoggingHttpAgent({
          url: process.env.NEXT_PUBLIC_BPP_URL || "http://0.0.0.0:8000/bpp-agent",
          debug: true,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${clerkToken}`,
          },
        }),
      },
    ],
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeWithAuth, // Our configured CopilotKit runtime with Clerk authentication
    endpoint: "/api/copilotkit/bpp",
  });

  return handleRequest(req);
};
