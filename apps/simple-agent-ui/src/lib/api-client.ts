// API client for communicating with the FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface ChatRequest {
  message: string
  model_id: string
  conversation_id?: string
  stream: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  model?: string
}

interface ChatConversation {
  id: string
  user_id: string
  title: string
  model_id: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

interface ModelConfig {
  id: string
  name: string
  provider: string
  description: string
  max_tokens: number
  supports_streaming: boolean
  api_key_env: string
}

class ApiClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = API_BASE_URL
    this.apiKey = 'supersecretapikey' // TODO: Replace with actual API key from auth
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  // Chat endpoints
  async sendMessage(chatRequest: ChatRequest): Promise<any> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(chatRequest),
    })
  }

  async sendMessageStream(
    chatRequest: ChatRequest,
    onChunk: (chunk: string) => void,
    onEnd: (conversationId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const url = `${this.baseUrl}/api/chat`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(chatRequest),
    })

    if (!response.ok) {
      const error = await response.text()
      onError(`API request failed: ${response.status} ${error}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('No response body')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'delta') {
                onChunk(data.content)
              } else if (data.type === 'end') {
                onEnd(data.conversation_id)
                return
              } else if (data.type === 'error') {
                onError(data.message)
                return
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      onError(`Stream error: ${error}`)
    } finally {
      reader.releaseLock()
    }
  }

  // Conversation endpoints
  async getConversations(): Promise<ChatConversation[]> {
    return this.request('/api/conversations')
  }

  async getConversation(conversationId: string): Promise<ChatConversation> {
    return this.request(`/api/conversations/${conversationId}`)
  }

  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<ChatConversation> {
    return this.request(`/api/conversations/${conversationId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    })
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    })
  }

  // Model endpoints
  async getModels(): Promise<ModelConfig[]> {
    return this.request('/api/models')
  }
}

export const apiClient = new ApiClient()
