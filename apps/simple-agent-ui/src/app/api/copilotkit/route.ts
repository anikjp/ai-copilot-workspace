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

// STEP 1: Initialize HTTP Agent for Agno/Stock Analysis Backend
// Create agent connection to our FastAPI Agno/Stock Analysis service

// Create a custom HttpAgent with logging
class LoggingHttpAgent extends HttpAgent {
  // Override requestInit to log the fetch
  protected requestInit(input: any): RequestInit {
    console.log("🔶 HttpAgent.requestInit() - Building fetch request");
    console.log("🔶 HttpAgent - Target URL:", this.url);
    console.log("🔶 HttpAgent - Sending messages count:", input.messages?.length);
    
    const init = super.requestInit(input);
    console.log("🔶 HttpAgent - Request init:", init);
    return init;
  }
  
  run(input: any) {
    console.log("🔶 HttpAgent.run() called with input:", input);
    console.log("🔶 HttpAgent - threadId:", input.threadId);
    console.log("🔶 HttpAgent - runId:", input.runId);
    
    // Call parent run method and tap into the observable
    const events$ = super.run(input);
    
    console.log("🔶 HttpAgent - Observable created, adding tap...");
    
    // Log each event as it flows through
    return events$.pipe(
      tap({
        next: (event: any) => {
          console.log("🔶 HttpAgent EVENT:", event.type, event);
          if (event.type === 'TEXT_MESSAGE_CONTENT') {
            console.log("🔶 HttpAgent TEXT_MESSAGE_CONTENT:", {
              messageId: event.messageId,
              hasDelta: 'delta' in event,
              delta: event.delta?.substring(0, 100)
            });
          }
        },
        error: (err: any) => {
          console.error("🔶 HttpAgent ERROR:", err);
        },
        complete: () => {
          console.log("🔶 HttpAgent COMPLETE");
        }
      })
    );
  }
}

// Import rxjs operators for logging
import { tap } from 'rxjs/operators';

const agnoAgent = new LoggingHttpAgent({
  // Use environment variable for backend URL, fallback to localhost
  url: process.env.NEXT_PUBLIC_AGNO_URL || "http://0.0.0.0:8000/stock-agent",
  debug: true,  // Enable debug mode
});

// STEP 2: Configure OpenAI Service Adapter
// Set up adapter for OpenAI-compatible API communication
const serviceAdapter = new OpenAIAdapter();

// STEP 3: Initialize CopilotKit Runtime
// Create the main runtime that orchestrates AI agent interactions
const runtime = new CopilotRuntime({
  agents: {
    // Our FastAPI endpoint URL for Agno/Stock Analysis
    // @ts-ignore - Suppress TypeScript error for agent configuration
    agnoAgent: agnoAgent, // Register our Agno/Stock Analysis agent
  },
});

// Alternative simple runtime configuration (commented out)
// const runtime = new CopilotRuntime()

// STEP 4: Define POST Request Handler
// Export async function to handle incoming POST requests from CopilotKit
export const POST = async (req: NextRequest) => {
  // Add debugging
  console.log("=====================================");
  console.log("🔵 CLIENT API: CopilotKit request received for Stock Agent");
  console.log("🔵 CLIENT API: URL:", req.url);
  console.log("🔵 CLIENT API: Method:", req.method);
  
  try {
    const body = await req.clone().json();
    console.log("🔵 CLIENT API: Request messages count:", body.messages?.length);
    console.log("🔵 CLIENT API: Last message:", body.messages?.[body.messages.length - 1]?.content);
  } catch (e) {
    console.log("🔵 CLIENT API: Could not parse request body", e);
  }
  
  // STEP 5: Create Request Handler with CopilotKit Integration
  // Configure the endpoint handler with our runtime and service adapter
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime, // Our configured CopilotKit runtime with agents
    serviceAdapter, // OpenAI adapter for LLM communication
    endpoint: "/api/copilotkit", // This API route's endpoint path
  });

  // STEP 6: Process and Return Request
  // First, let's intercept and log the raw backend response
  console.log("🔵 CLIENT API: Forwarding to CopilotKit runtime...");
  
  // Clone request to inspect what's being sent to backend
  const bodyClone = await req.clone().json();
  console.log("🔵 CLIENT API: Messages being sent to backend:", bodyClone.messages?.length);
  
  // Let CopilotKit handle the request
  const response = await handleRequest(req);
  
  console.log("🔵 CLIENT API: Response status:", response.status);
  console.log("🔵 CLIENT API: Response headers:", Object.fromEntries(response.headers.entries()));
  
  // Intercept the response stream to log raw backend data
  if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("🔵 CLIENT API: Stream ended");
              controller.close();
              break;
            }
            
            // Log the raw chunk
            const chunk = decoder.decode(value, { stream: true });
            console.log("🔵 CLIENT API: Raw chunk from backend:", chunk);
            
            // Forward to frontend
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("🔵 CLIENT API: Stream error:", error);
          controller.error(error);
        }
      }
    });
    
    return new Response(stream, {
      headers: response.headers,
      status: response.status
    });
  }
  
  console.log("=====================================");
  return response;
};
