// Test endpoint to directly call backend and see raw response
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🧪 TEST ENDPOINT: Called");
  
  const backendUrl = process.env.NEXT_PUBLIC_AGNO_URL || "http://localhost:8000/stock-agent";
  
  try {
    const body = await req.json();
    console.log("🧪 TEST: Sending to backend:", backendUrl);
    console.log("🧪 TEST: Message:", body.message || "Hi");
    
    // Call backend directly
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: body.message || "Hi" }],
        state: {}
      })
    });
    
    console.log("🧪 TEST: Backend response status:", response.status);
    console.log("🧪 TEST: Backend response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.body) {
      return new Response("No body", { status: 500 });
    }
    
    // Read and log the entire SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      console.log("🧪 TEST: Chunk:", chunk);
    }
    
    console.log("🧪 TEST: Full response:");
    console.log(fullResponse);
    
    // Parse and return as JSON for easy viewing
    const events = fullResponse
      .split('\n\n')
      .filter(line => line.startsWith('data: '))
      .map(line => {
        try {
          return JSON.parse(line.substring(6));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    console.log("🧪 TEST: Parsed events:", events);
    
    return new Response(JSON.stringify(events, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("🧪 TEST: Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

