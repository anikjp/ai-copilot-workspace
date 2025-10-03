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
  console.log("=====================================");

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit/bpp",
  });

  return handleRequest(req);
};
