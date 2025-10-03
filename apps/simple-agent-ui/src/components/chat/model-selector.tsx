"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/design-system/atoms/select"
import { apiClient } from "@/lib/api-client"
import { useEffect, useState } from "react"

interface ModelConfig {
  id: string
  name: string
  provider: string
  description: string
  max_tokens: number
  supports_streaming: boolean
  api_key_env: string
}

interface ModelSelectorProps {
  selectedModelId: string
  onSelectModel: (modelId: string) => void
}

export function ModelSelector({ selectedModelId, onSelectModel }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      const fetchedModels = await apiClient.getModels()
      setModels(fetchedModels)
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={selectedModelId} onValueChange={onSelectModel}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model..." />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">
                {model.provider}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}