import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  AramChampionIntel,
  ChampSelectAiUiStyle,
  MatchupIntel
} from '@shared/types/champ-select-ai'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  CHAMP_SELECT_AI_MAIN_NAMESPACE,
  CHAMP_SELECT_AI_RENDERER_NAMESPACE,
  type ChampSelectAiRendererContext
} from './context'
import { syncChampSelectAiState } from './state-sync'

@Shard(ChampSelectAiRenderer.id)
export class ChampSelectAiRenderer implements IAkariShardInitDispose {
  static id = CHAMP_SELECT_AI_RENDERER_NAMESPACE

  private readonly _context: ChampSelectAiRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc,
      piniaMobxUtils,
      settingUtils
    }
  }

  async onInit() {
    await syncChampSelectAiState(this._context)
  }

  setEnabled(value: boolean) {
    return this._context.settingUtils.set(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'enabled', value)
  }

  setApiKey(value: string) {
    return this._context.settingUtils.set(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'apiKey', value)
  }

  setUiStyle(value: ChampSelectAiUiStyle) {
    return this._context.settingUtils.set(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'uiStyle', value)
  }

  setModel(value: string) {
    return this._context.settingUtils.set(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'model', value)
  }

  setAutoPopup(value: boolean) {
    return this._context.settingUtils.set(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'autoPopup', value)
  }

  testApiKey(apiKey?: string, model?: string): Promise<{ success: boolean; message?: string }> {
    return this._context.ipc.call(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'testApiKey', apiKey, model)
  }

  analyzeMatchup(params: {
    myChampionName: string
    myChampionId: number
    enemyChampionName: string
    enemyChampionId: number
    enemyPosition?: string
    forceRefresh?: boolean
  }): Promise<MatchupIntel> {
    return this._context.ipc.call(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'analyzeMatchup', params)
  }

  optimizeAramChampion(params: {
    championName: string
    championId: number
    forceRefresh?: boolean
  }): Promise<AramChampionIntel> {
    return this._context.ipc.call(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'optimizeAramChampion', params)
  }

  clearCache(): Promise<boolean> {
    return this._context.ipc.call(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'clearCache')
  }
}
