import type { ChampSelectAiSettings } from '@shared/types/champ-select-ai'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useChampSelectAiStore = defineStore('shard:champ-select-ai-renderer', () => {
  const settings = shallowReactive<ChampSelectAiSettings>({
    enabled: true,
    apiKey: '',
    uiStyle: 'cyberpunk',
    model: 'gemini-2.5-flash',
    autoPopup: true
  })

  const isAnalyzing = shallowRef(false)
  const lastError = shallowRef<string | null>(null)

  return {
    settings,
    isAnalyzing,
    lastError
  }
})
