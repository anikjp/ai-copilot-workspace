import { apiClient } from "@/lib/api-client"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, modelId, conversationId, userId } = await req.json()

    // Get the last user message
    const userMessage = messages[messages.length - 1]
    if (!userMessage || userMessage.role !== 'user') {
      return Response.json({ error: "No user message found" }, { status: 400 })
    }

    // Prepare request for FastAPI backend
    const chatRequest = {
      message: userMessage.content,
      model_id: modelId || 'gpt-3.5-turbo', // Default model
      conversation_id: conversationId,
      stream: true,
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await apiClient.sendMessageStream(
            chatRequest,
            (chunk: string) => {
              // Send chunk to client
              const data = `data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`
              controller.enqueue(encoder.encode(data))
            },
            (conversationId: string) => {
              // Send end signal
              const data = `data: ${JSON.stringify({ type: 'finish', conversationId })}\n\n`
              controller.enqueue(encoder.encode(data))
              controller.close()
            },
            (error: string) => {
              // Send error
              const data = `data: ${JSON.stringify({ type: 'error', error })}\n\n`
              controller.enqueue(encoder.encode(data))
              controller.close()
            }
          )
        } catch (error) {
          console.error('Stream error:', error)
          const data = `data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`
          controller.enqueue(encoder.encode(data))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
