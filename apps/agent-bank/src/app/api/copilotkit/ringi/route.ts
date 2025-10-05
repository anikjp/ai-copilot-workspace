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

// STEP 1: Initialize HTTP Agent for Ringi System Backend
// Create a custom HttpAgent with logging
class LoggingHttpAgent extends HttpAgent {
  protected requestInit(input: any): RequestInit {
    console.log("🔶 Ringi HttpAgent.requestInit() - Building fetch request");
    console.log("🔶 Ringi HttpAgent - Target URL:", this.url);
    console.log("🔶 Ringi HttpAgent - Sending messages count:", input.messages?.length);
    
    const init = super.requestInit(input);
    console.log("🔶 Ringi HttpAgent - Request init:", init);
    return init;
  }
  
  run(input: any) {
    console.log("🔶 Ringi HttpAgent.run() called with input:", input);
    console.log("🔶 Ringi HttpAgent - threadId:", input.threadId);
    console.log("🔶 Ringi HttpAgent - runId:", input.runId);
    
    const events$ = super.run(input);
    console.log("🔶 Ringi HttpAgent - Observable created, adding tap...");
    
    return events$.pipe(
      tap({
        next: (event: any) => {
          console.log("🔶 Ringi HttpAgent EVENT:", event.type, event);
          if (event.type === 'TEXT_MESSAGE_CONTENT') {
            console.log("🔶 Ringi HttpAgent TEXT_MESSAGE_CONTENT:", {
              messageId: event.messageId,
              hasDelta: 'delta' in event,
              delta: event.delta?.substring(0, 100)
            });
          }
        },
        error: (err: any) => {
          console.error("🔶 Ringi HttpAgent ERROR:", err);
        },
        complete: () => {
          console.log("🔶 Ringi HttpAgent COMPLETE");
        }
      })
    );
  }
}

const ringiAgent = new LoggingHttpAgent({
  url: process.env.NEXT_PUBLIC_RINGI_URL || "http://0.0.0.0:8000/ringi-agent",
  debug: true,
});

// STEP 2: Initialize CopilotKit Runtime with Ringi agent
const runtime = new CopilotRuntime({
  agents: [
    {
      name: "ringi-agent",
      description: "Ringi System AI Assistant for proposal management",
      agent: ringiAgent,
    },
  ],
});

// STEP 3: Define POST Request Handler
export const POST = async (req: NextRequest) => {
  console.log("=====================================");
  console.log("🔵 RINGI CLIENT API: CopilotKit request received for Ringi Agent");
  console.log("🔵 RINGI CLIENT API: URL:", req.url);
  console.log("🔵 RINGI CLIENT API: Method:", req.method);
  console.log("=====================================");

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit/ringi",
  });

  return handleRequest(req);
};
