<template>
  <div class="h-full">
    <ConnectedMatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
      :details="previewingGame.details"
      :hide-privacy="as.settings.streamerMode"
      can-dry-run-ongoing-game
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
    />
    <OngoingGameProvider :value="ongoingGame">
      <OngoingGamePanel
        :content-width="contentWidth"
        :content-height="contentHeight"
        @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
        @preview-game="handlePreviewGame"
      />
    </OngoingGameProvider>

    <!-- Floating AI Assistant Launcher FAB -->
    <button
      v-if="aiStore.settings.enabled"
      class="ai-trigger-fab"
      :class="aiStore.settings.uiStyle"
      :title="
        'Trợ lý AI Gemini (' +
        (aiStore.settings.uiStyle === 'cyberpunk' ? 'Style 01' : 'Style 03') +
        ')'
      "
      @click="handleToggleAiRadar"
    >
      <span class="icon">⚡</span>
      <span class="text">AI RADAR</span>
    </button>

    <!-- AI Matchup Assistant Popup -->
    <ChampSelectAiPopup v-model:show="showAiPopup" @open-settings="openSettingsModal" />
  </div>
</template>

<script lang="ts" setup>
import ChampSelectAiPopup from '@renderer-shared/components/champ-select-ai/ChampSelectAiPopup.vue'
import ConnectedMatchPreviewer from '@renderer-shared/components/match-preview/ConnectedMatchPreviewer.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import {
  createAkariOngoingGameProvider,
  OngoingGameProvider
} from '@renderer-shared/providers/ongoing-game'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useChampSelectAiStore } from '@renderer-shared/shards/champ-select-ai/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { DraftOptions } from '@shared/shards/ongoing-game'
import { ref, shallowRef, watch } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { contentWidth, contentHeight, openSettingsModal } = useMainWindowAppContext()

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)
const wm = useInstance(WindowManagerRenderer)
const ongoingGame = createAkariOngoingGameProvider()

const as = useAppCommonStore()
const aiStore = useChampSelectAiStore()
const leagueClientStore = useLeagueClientStore()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const showPreviewModal = ref(false)
const showAiPopup = ref(false)

const handleToggleAiRadar = () => {
  try {
    const channel = new BroadcastChannel('akari-aux-window-nav')
    channel.postMessage({ tab: 'radar' })
    channel.close()
    wm.auxWindow.show()
  } catch {
    // ignore
  }
  showAiPopup.value = !showAiPopup.value
}

const previewingGame = shallowRef<MatchPreviewState>({
  gameId: 0,
  source: 'sgp'
})

// Auto-open in Champ Select if autoPopup enabled
watch(
  () => leagueClientStore.gameflow.phase,
  (phase) => {
    if (phase === 'ChampSelect' && aiStore.settings.enabled && aiStore.settings.autoPopup) {
      showAiPopup.value = true
    }
  },
  { immediate: true }
)

const handlePreviewGame = (payload: MatchPreviewPayload) => {
  previewingGame.value = toMatchPreviewState(payload, as.settings.preferredLolSource)
  showPreviewModal.value = true
}

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  await og.setDraft(draft)
  showPreviewModal.value = false
}
</script>

<style scoped>
.ai-trigger-fab {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.ai-trigger-fab.cyberpunk {
  background: rgba(11, 15, 25, 0.9);
  border: 1px solid #00f0ff;
  color: #00f0ff;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
}

.ai-trigger-fab.cyberpunk:hover {
  background: #00f0ff;
  color: #000000;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.6);
  transform: translateY(-2px);
}

.ai-trigger-fab.tactical {
  background: #0f131a;
  border: 1px solid #3b82f6;
  color: #60a5fa;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.ai-trigger-fab.tactical:hover {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 25px rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
}
</style>
