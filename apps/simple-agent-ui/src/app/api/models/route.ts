import { apiClient } from "@/lib/api-client"

export async function GET() {
  try {
    const models = await apiClient.getModels()
    return Response.json(models)
  } catch (error) {
    console.error('Get models error:', error)
    return Response.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}
