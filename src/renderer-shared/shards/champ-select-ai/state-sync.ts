import { CHAMP_SELECT_AI_MAIN_NAMESPACE, type ChampSelectAiRendererContext } from './context'
import { useChampSelectAiStore } from './store'

export async function syncChampSelectAiState(context: ChampSelectAiRendererContext) {
  const store = useChampSelectAiStore()

  await context.piniaMobxUtils.sync(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'settings', store.settings)
  await context.piniaMobxUtils.sync(CHAMP_SELECT_AI_MAIN_NAMESPACE, 'state', store)
}
