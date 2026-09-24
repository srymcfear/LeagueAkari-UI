import type { ChampSelectAiSettings, ChampSelectAiUiStyle } from '@shared/types/champ-select-ai'
import { makeAutoObservable } from 'mobx'

export class ChampSelectAiSettingsState implements ChampSelectAiSettings {
  enabled: boolean = true
  apiKey: string = ''
  uiStyle: ChampSelectAiUiStyle = 'cyberpunk'
  model: string = 'gemini-3.6-flash'
  autoPopup: boolean = true

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setUiStyle(style: ChampSelectAiUiStyle) {
    this.uiStyle = style
  }

  setModel(model: string) {
    this.model = model
  }

  setAutoPopup(autoPopup: boolean) {
    this.autoPopup = autoPopup
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class ChampSelectAiRuntimeState {
  isAnalyzing: boolean = false
  lastError: string | null = null

  setIsAnalyzing(analyzing: boolean) {
    this.isAnalyzing = analyzing
  }

  setLastError(err: string | null) {
    this.lastError = err
  }

  constructor() {
    makeAutoObservable(this)
  }
}
