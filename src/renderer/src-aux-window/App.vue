<template>
  <div id="aux-window-frame">
    <SetupInAppScope />
    <AuxWindowTitlebar />

    <!-- Sub-Nav Tab Bar -->
    <div class="aux-tab-bar">
      <button
        class="aux-tab-item"
        :class="{ active: currentTab === 'assistant' }"
        @click="currentTab = 'assistant'"
      >
        <span class="tab-label">🎮 TRỢ THỦ</span>
      </button>
      <button
        class="aux-tab-item"
        :class="{ active: currentTab === 'radar' }"
        @click="currentTab = 'radar'"
      >
        <span class="radar-label">{{ isAramMayhem ? '⚡ TỐI ƯU ARAM' : '⚡ AI RADAR' }}</span>
        <span v-if="aiStore.isAnalyzing" class="radar-dot"></span>
      </button>
    </div>

    <div class="content">
      <KeepAlive>
        <AramMayhemGuideMini v-if="currentTab === 'radar' && isAramMayhem" />
        <AiRadarMini v-else-if="currentTab === 'radar'" />
        <IndicatorView v-else />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useChampSelectAiStore } from '@renderer-shared/shards/champ-select-ai/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { AiRadarMini, AramMayhemGuideMini } from '@renderer-shared/components/champ-select-ai'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import AuxWindowTitlebar from './components/AuxWindowTitlebar.vue'
import IndicatorView from './views/Indicator.vue'

const currentTab = ref<'assistant' | 'radar'>('assistant')
const aiStore = useChampSelectAiStore()
const leagueClientStore = useLeagueClientStore()

const rememberedIsAramMayhem = ref(false)

const isAramMayhem = computed(() => {
  const gfSession = leagueClientStore.gameflow.session
  const csSession = leagueClientStore.champSelect.session

  const gameMode = (
    gfSession?.map?.gameMode ||
    gfSession?.gameData?.queue?.gameMode ||
    ''
  ).toUpperCase()

  const queueId = gfSession?.gameData?.queue?.id
  const queueName = (
    gfSession?.gameData?.queue?.name ||
    gfSession?.gameData?.queue?.description ||
    ''
  ).toLowerCase()

  const isKiwi =
    gameMode === 'KIWI' ||
    queueId === 2400 ||
    queueName.includes('kiwi') ||
    queueName.includes('mayhem') ||
    queueName.includes('hỗn loạn')

  const isAram = gameMode === 'ARAM' || Boolean(csSession?.benchEnabled)

  if (isKiwi || isAram) {
    rememberedIsAramMayhem.value = true
    return true
  }

  // During in-game phases, retain remembered ARAM Mayhem state
  const phase = leagueClientStore.gameflow.phase
  if (
    rememberedIsAramMayhem.value &&
    (phase === 'GameStart' || phase === 'InProgress' || phase === 'Reconnect')
  ) {
    return true
  }

  return false
})

let navChannel: BroadcastChannel | null = null

onMounted(() => {
  try {
    navChannel = new BroadcastChannel('akari-aux-window-nav')
    navChannel.onmessage = (event) => {
      if (event.data?.tab === 'radar' || event.data?.tab === 'assistant') {
        currentTab.value = event.data.tab
      }
    }
  } catch (err) {
    // ignore
  }

  // If opening during champ select or in-game, automatically show radar if autoPopup is enabled
  const phase = leagueClientStore.gameflow.phase
  if (
    (phase === 'ChampSelect' || phase === 'GameStart' || phase === 'InProgress') &&
    aiStore.settings.enabled &&
    aiStore.settings.autoPopup
  ) {
    currentTab.value = 'radar'
  }
})

onUnmounted(() => {
  navChannel?.close()
})

// Auto-switch tab based on gameflow phase
watch(
  () => leagueClientStore.gameflow.phase,
  (newPhase) => {
    if (newPhase === 'ChampSelect' && aiStore.settings.enabled && aiStore.settings.autoPopup) {
      currentTab.value = 'radar'
    } else if (newPhase === 'Lobby' || newPhase === 'None' || newPhase === 'EndOfGame') {
      rememberedIsAramMayhem.value = false
      currentTab.value = 'assistant'
    }
  }
)
</script>

<style>
#aux-window-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}

.aux-tab-bar {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3px 6px;
  gap: 4px;
  user-select: none;
  flex-shrink: 0;
}

.aux-tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.aux-tab-item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
}

.aux-tab-item.active {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.35);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
}

.radar-label {
  letter-spacing: 0.5px;
}

.radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d946ef;
  box-shadow: 0 0 6px #d946ef;
  animation: pulse-dot 0.8s infinite alternate;
}

@keyframes pulse-dot {
  from {
    opacity: 0.4;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1.3);
  }
}
</style>
