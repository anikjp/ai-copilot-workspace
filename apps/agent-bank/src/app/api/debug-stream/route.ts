// Debug endpoint to see what HttpAgent sends to CopilotKit
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🔍 DEBUG: Testing HttpAgent directly");
  
  try {
    const body = await req.json();
    const message = body.message || "Hi";
    
    // Create HttpAgent instance
    const agent = new HttpAgent({
      url: process.env.NEXT_PUBLIC_AGNO_URL || "http://localhost:8000/stock-agent",
    });
    
    console.log("🔍 DEBUG: Created HttpAgent");
    console.log("🔍 DEBUG: Agent URL:", agent.url);
    
    // Manually run the agent and log what it does
    const input = {
      threadId: agent.threadId,
      runId: crypto.randomUUID(),
      tools: [],
      context: [],
      forwardedProps: {},
      state: {},
      messages: [{ role: "user", content: message, id: crypto.randomUUID() }]
    };
    
    console.log("🔍 DEBUG: Running agent with input:", input);
    
    // Call the agent's run method and collect events
    const events: any[] = [];
    
    agent.run(input).subscribe({
      next: (event) => {
        console.log("🔍 DEBUG: HttpAgent emitted event:", event.type, event);
        events.push(event);
      },
      error: (err) => {
        console.error("🔍 DEBUG: HttpAgent error:", err);
      },
      complete: () => {
        console.log("🔍 DEBUG: HttpAgent completed. Total events:", events.length);
      }
    });
    
    // Wait a bit for events to accumulate
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("🔍 DEBUG: Final events collected:", events);
    
    return new Response(JSON.stringify({
      events,
      totalEvents: events.length,
      hasTextMessage: events.some(e => e.type === 'TEXT_MESSAGE_CONTENT')
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("🔍 DEBUG: Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

