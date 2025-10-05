import { apiClient } from "@/lib/api-client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await apiClient.getConversation(params.id)
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }
    return Response.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return Response.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await req.json()
    const conversation = await apiClient.updateConversationTitle(params.id, title)
    return Response.json(conversation)
  } catch (error) {
    console.error('Update conversation error:', error)
    return Response.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await apiClient.deleteConversation(params.id)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return Response.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
