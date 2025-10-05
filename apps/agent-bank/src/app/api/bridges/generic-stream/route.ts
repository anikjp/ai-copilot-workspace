import { NextRequest } from "next/server";

export const runtime = "nodejs"

type OpenAIMessage = { role: "system" | "user" | "assistant" | "tool"; content: string }
type OpenAIChatRequest = {
  model?: string
  messages: OpenAIMessage[]
  stream?: boolean
  temperature?: number
  top_p?: number
  max_tokens?: number
}

type RunAgentInput = {
  messages: { role: string; content: string }[]
  tools?: any[]
  state?: Record<string, any>
}

function mapToRunAgentInput(body: OpenAIChatRequest): RunAgentInput {
  const messages = (body.messages || []).map((m) => ({
    role: m.role,
    content: m.content ?? "",
  }))

  const state: Record<string, any> = {
    selected_model: body.model ?? "gpt-4o-mini",
    workflow_type: "chat",
  }

  return { messages, tools: [], state }
}

function emitOpenAIChunk(controller: ReadableStreamDefaultController<Uint8Array>, content: string) {
  const encoder = new TextEncoder()
  const chunk = {
    id: "generic-chatcmpl",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "generic-agent",
    choices: [{ index: 0, delta: { content }, finish_reason: null }],
  }
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const backendUrl = process.env.NEXT_PUBLIC_AGNO_URL || "http://localhost:8000/generic-agent"

  let openaiBody: OpenAIChatRequest
  try {
    openaiBody = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  openaiBody.stream = true
  const runAgentInput = mapToRunAgentInput(openaiBody)

  const backendResp = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify(runAgentInput),
  })

  if (!backendResp.ok || !backendResp.body) {
    const text = await backendResp.text().catch(() => "")
    return new Response(text || JSON.stringify({ error: "Backend error" }), {
      status: backendResp.status || 502,
      headers: { "content-type": "application/json" },
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = backendResp.body!.getReader()
      const textDecoder = new TextDecoder()
      let buf = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += textDecoder.decode(value, { stream: true })

          const lines = buf.split(/\r?\n/)
          buf = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data:")) continue
            const payload = line.slice(5).trim()
            if (!payload) continue

            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              continue
            }

            try {
              const evt = JSON.parse(payload)
              const content = evt?.data?.content ?? evt?.data?.text ?? ""
              if (typeof content === "string" && content.length > 0) {
                emitOpenAIChunk(controller, content)
              }
              if (evt?.type === "TextMessageEndEvent" || evt?.type === "RUN_FINISHED") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (e) {
        controller.error(e)
        return
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "transfer-encoding": "chunked",
    },
  })
}


