import type { ChampSelectAiSettings } from '@shared/types/champ-select-ai'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

export const useChampSelectAiStore = defineStore('shard:champ-select-ai-renderer', () => {
  const settings = shallowReactive<ChampSelectAiSettings>({
    enabled: true,
    apiKey: '',
    uiStyle: 'cyberpunk',
    model: 'gemini-3.1-flash-lite',
    autoPopup: true
  })

  const isAnalyzing = shallowRef(false)
  const lastError = shallowRef<string | null>(null)

  const STORAGE_KEY_ID = 'akari_ai_last_champion_id'
  const STORAGE_KEY_NAME = 'akari_ai_last_champion_name'

  let initialId = 0
  let initialName = ''
  try {
    const savedId = sessionStorage.getItem(STORAGE_KEY_ID)
    if (savedId) initialId = Number(savedId) || 0
    initialName = sessionStorage.getItem(STORAGE_KEY_NAME) || ''
  } catch {}

  const lastChampionId = shallowRef<number>(initialId)
  const lastChampionName = shallowRef<string>(initialName)

  function setLastChampion(id: number, name?: string) {
    if (id > 0) {
      lastChampionId.value = id
      if (name) {
        lastChampionName.value = name
      }
      try {
        sessionStorage.setItem(STORAGE_KEY_ID, String(id))
        if (name) sessionStorage.setItem(STORAGE_KEY_NAME, name)
      } catch {}
    }
  }

  function clearLastChampion() {
    lastChampionId.value = 0
    lastChampionName.value = ''
    try {
      sessionStorage.removeItem(STORAGE_KEY_ID)
      sessionStorage.removeItem(STORAGE_KEY_NAME)
    } catch {}
  }

  return {
    settings,
    isAnalyzing,
    lastError,
    lastChampionId,
    lastChampionName,
    setLastChampion,
    clearLastChampion
  }
})
