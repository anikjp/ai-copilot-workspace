import { apiClient } from "@/lib/api-client"

export async function GET(req: Request) {
  try {
    const conversations = await apiClient.getConversations()
    return Response.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return Response.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
