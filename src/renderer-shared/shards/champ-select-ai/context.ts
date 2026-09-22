import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const CHAMP_SELECT_AI_MAIN_NAMESPACE = 'champ-select-ai'
export const CHAMP_SELECT_AI_RENDERER_NAMESPACE = 'champ-select-ai-renderer'

export interface ChampSelectAiRendererContext {
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
