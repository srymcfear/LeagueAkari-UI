<template>
  <div class="relative box-border flex h-full flex-col items-center justify-center p-3">
    <div class="flex flex-1 flex-col items-center justify-center">
      <!-- Cyberpunk Emblem Hub with cool animations -->
      <div
        class="mini-emblem-hub"
        :class="{
          'phase-matchmaking': lcs.gameflow.phase === 'Matchmaking',
          'phase-ready-check': lcs.gameflow.phase === 'ReadyCheck',
          'is-accepted': lcs.matchmaking.readyCheck?.playerResponse === 'Accepted'
        }"
      >
        <!-- Ambient Glow Aura -->
        <div class="emblem-halo" />

        <!-- Rotating Cyber HUD Ring -->
        <div class="emblem-orbit-ring" />

        <!-- Radar Pulse Rings (Matchmaking Waiting) -->
        <div v-if="lcs.gameflow.phase === 'Matchmaking'" class="radar-wave wave-1" />
        <div v-if="lcs.gameflow.phase === 'Matchmaking'" class="radar-wave wave-2" />

        <!-- Ready Check Shockwaves (Accept Phase) -->
        <div v-if="lcs.gameflow.phase === 'ReadyCheck'" class="ready-shockwave shockwave-1" />
        <div v-if="lcs.gameflow.phase === 'ReadyCheck'" class="ready-shockwave shockwave-2" />

        <!-- Queue / Map Emblem Icon -->
        <LcuImage
          v-if="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
          class="emblem-img h-16 w-16"
          :src="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
        />
      </div>

      <template v-if="lcs.gameflow.phase === 'ReadyCheck'">
        <template v-if="agfs.willAcceptAt > 0">
          <div class="ready-accept-countdown-badge mb-2">
            <span class="countdown-blip" />
            <span class="text-sm font-bold text-purple-200">
              {{
                t('auxWindow.lounge.panel.autoAccept.acceptIn', {
                  seconds: willAcceptIn.toFixed(1)
                })
              }}
            </span>
          </div>
          <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoAccept()">{{
            t('auxWindow.lounge.panel.autoAccept.cancelButton')
          }}</NButton>
        </template>
        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Accepted'">
          <div class="accepted-badge mb-2">
            <span class="accepted-check">✓</span>
            <span class="text-sm font-bold text-cyan-300">
              {{ t('auxWindow.lounge.panel.autoAccept.accepted') }}
            </span>
          </div>
          <span class="mb-2 text-xs text-purple-300/70">
            {{ t('auxWindow.lounge.panel.autoAccept.subtitle1') }}
          </span>
          <NButton type="error" secondary size="tiny" @click="() => handleDecline()">{{
            t('auxWindow.lounge.panel.autoAccept.declineButton')
          }}</NButton>
        </template>

        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Declined'">
          <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
            t('auxWindow.lounge.panel.autoAccept.declined')
          }}</span>
          <span class="mb-2 text-[13px] text-gray-500 dark:text-gray-400">{{
            t('auxWindow.lounge.panel.autoAccept.subtitle2')
          }}</span>
          <button class="cyber-accept-btn" @click="() => handleAccept()">
            <span>{{ t('auxWindow.lounge.panel.autoAccept.acceptButton') }}</span>
          </button>
        </template>
        <template v-else>
          <span
            class="mb-2 text-base font-extrabold tracking-wide text-gray-900 dark:text-gray-100"
            >{{ t('auxWindow.lounge.panel.autoAccept.pending') }}</span
          >
          <div class="flex items-center gap-2">
            <button class="cyber-accept-btn" @click="() => handleAccept()">
              <span>{{ t('auxWindow.lounge.panel.autoAccept.acceptButton') }}</span>
            </button>
            <NButton type="error" secondary size="tiny" @click="() => handleDecline()">{{
              t('auxWindow.lounge.panel.autoAccept.declineButton')
            }}</NButton>
          </div>
        </template>
      </template>

      <template v-else-if="lcs.gameflow.phase === 'Matchmaking'">
        <div class="searching-hud-badge mb-2">
          <span class="searching-radar-dot" />
          <span class="text-sm font-bold tracking-wider text-purple-300 uppercase">
            {{ t('auxWindow.lounge.panel.matchmaking.searching') }}
          </span>
        </div>
        <span
          class="mb-2.5 font-mono text-xs text-gray-500 dark:text-purple-200/70"
          v-if="lcs.matchmaking.search"
          >{{ formatMatchmakingSearchText(lcs.matchmaking.search) }}</span
        >
        <NButton
          :loading="isCancelingSearching"
          type="error"
          secondary
          size="tiny"
          @click="() => handleCancelSearching()"
          ><template v-if="agfs.settings.autoMatchmakingEnabled">{{
            t('auxWindow.lounge.panel.matchmaking.stopAndDisable')
          }}</template
          ><template v-else>{{ t('auxWindow.lounge.panel.matchmaking.stop') }}</template></NButton
        >
      </template>
      <template v-else-if="agfs.willSearchMatch">
        <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
          {{
            t('auxWindow.lounge.panel.matchmaking.searchIn', {
              seconds: willSearchMatchIn.toFixed(1)
            })
          }}
        </span>
        <NButton
          type="primary"
          secondary
          size="tiny"
          @click="() => handleCancelAutoSearchMatch()"
          >{{ t('auxWindow.lounge.panel.matchmaking.cancel') }}</NButton
        >
      </template>

      <template v-else>
        <span
          class="mb-2 block max-w-70 overflow-hidden text-base font-bold text-ellipsis whitespace-nowrap text-gray-900 dark:text-gray-100"
          :title="`${lcs.gameflow.session?.gameData.queue.name || t('auxWindow.lounge.panel.gameMode')} · ${lcs.gameflow.session?.map.name || t('auxWindow.lounge.panel.map')}`"
          >{{ formatMapModeText() }}</span
        >
        <template v-if="agfs.settings.autoMatchmakingEnabled">
          <span class="mb-2 text-[13px] text-gray-500 dark:text-gray-400" v-if="penaltyTime">{{
            t('auxWindow.lounge.panel.matchmaking.waitingForPenalty', {
              seconds: penaltyTime.toFixed()
            })
          }}</span>
          <span
            class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
            v-else-if="agfs.activityStartStatus === 'insufficient-members'"
          >
            {{
              t('auxWindow.lounge.panel.matchmaking.waitingForMembers', {
                count: agfs.settings.autoMatchmakingMinimumMembers
              })
            }}
          </span>
          <span
            class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
            v-else-if="agfs.activityStartStatus === 'waiting-for-invitees'"
            >{{ t('auxWindow.lounge.panel.matchmaking.waitingForInvitees') }}</span
          >
        </template>
      </template>
    </div>

    <div class="w-full">
      <LoungeOperations />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoungeOperations from '@aux-window/components/LoungeOperations.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { GetSearch } from '@shared/types/league-client/matchmaking'
import { useIntervalFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const { t } = useTranslation()
const componentName = useComponentName()

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const agf = useInstance(AutoGameflowRenderer)
const lc = useInstance(LeagueClientRenderer)
const logger = useInstance(LoggerRenderer)

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (agfs.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const willSearchMatchIn = ref(0)
const { pause: pauseAS, resume: resumeAS } = useIntervalFn(
  () => {
    const s = (agfs.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = async () => {
  try {
    await lc.api.matchmaking.accept()
  } catch (error) {
    logger.warn(componentName, 'Failed to accept ready check', error)
  }
}

const handleDecline = async () => {
  try {
    await lc.api.matchmaking.decline()
  } catch (error) {
    logger.warn(componentName, 'Failed to decline ready check', error)
  }
}

const handleCancelAutoAccept = () => agf.cancelAutoAccept()

const handleCancelAutoSearchMatch = async () => {
  await agf.setAutoMatchmakingEnabled(false)
  agf.cancelAutoMatchmaking()
}

const isCancelingSearching = ref(false)
const handleCancelSearching = async () => {
  if (isCancelingSearching.value) {
    return
  }

  try {
    isCancelingSearching.value = true
    await lc.api.lobby.deleteSearchMatch()
  } catch (error) {
    logger.warn(componentName, 'Failed to cancel matchmaking search', error)
    return
  } finally {
    isCancelingSearching.value = false
  }

  agf.setAutoMatchmakingEnabled(false)
}

const penaltyTime = computed(() => {
  if (!lcs.matchmaking.search) {
    return null
  }

  const errors = lcs.matchmaking.search.errors

  if (!errors.length) {
    return null
  }

  const maxPenaltyTime = errors.reduce(
    (prev, cur) => Math.max(cur.penaltyTimeRemaining, prev),
    -Infinity
  )

  return maxPenaltyTime
})

watch(
  () => agfs.willAcceptAt,
  (at) => {
    if (at > 0) {
      resumeAC()
    } else {
      pauseAC()
    }
  },
  { immediate: true }
)

watch(
  () => agfs.willSearchMatch,
  (ok) => {
    if (ok) {
      resumeAS()
    } else {
      pauseAS()
    }
  },
  { immediate: true }
)

const formatMapModeText = () => {
  const gameModeName =
    lcs.gameflow.session?.gameData.queue.name || t('auxWindow.lounge.panel.gameMode')
  const mapName = lcs.gameflow.session?.map.name || t('auxWindow.lounge.panel.map')

  if (gameModeName === mapName) {
    return gameModeName
  }

  return `${gameModeName} · ${mapName}`
}

const formatNumber = (num: number, precision = 1) => {
  let formatted = num.toFixed(precision)
  formatted = formatted.replace(/(\.\d*?)0+$/, '$1')
  return formatted.replace(/\.$/, '')
}

const formatMatchmakingSearchText = (search: GetSearch) => {
  if (search.lowPriorityData && search.lowPriorityData.penaltyTime) {
    return `${t('auxWindow.lounge.panel.wait')} ${formatNumber(search.lowPriorityData.penaltyTimeRemaining)} s (${formatNumber(search.lowPriorityData.penaltyTime)} s) `
  }

  if (agfs.settings.autoMatchmakingRematchStrategy === 'fixed-duration') {
    return `${search.timeInQueue.toFixed(1)} s (${t('auxWindow.lounge.panel.atMost')} ${agfs.settings.autoMatchmakingRematchFixedDuration.toFixed()} s) / ${search.estimatedQueueTime.toFixed(1)} s`
  }

  return `${search.timeInQueue.toFixed(1)} s / ${search.estimatedQueueTime.toFixed(1)} s`
}
</script>

<style scoped>
/* ── Cyberpunk Emblem Hub Animation ── */
.mini-emblem-hub {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.emblem-halo {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(139, 74, 255, 0.35) 0%,
    rgba(56, 189, 248, 0.15) 50%,
    transparent 75%
  );
  filter: blur(12px);
  pointer-events: none;
  transition: all 0.5s ease;
}

.emblem-orbit-ring {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 1px dashed rgba(166, 124, 255, 0.35);
  pointer-events: none;
  transition: all 0.4s ease;
}

.emblem-img {
  position: relative;
  z-index: 2;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0 10px rgba(139, 74, 255, 0.45));
}

/* Idle / Default Floating */
.mini-emblem-hub .emblem-img {
  animation: emblem-float 3.2s ease-in-out infinite;
}

/* Phase: Matchmaking (Chờ / Tìm trận) */
.phase-matchmaking .emblem-orbit-ring {
  border: 1.5px dashed rgba(166, 124, 255, 0.6);
  border-top-color: #38bdf8;
  animation: cyber-spin 8s linear infinite;
  box-shadow: 0 0 12px rgba(139, 74, 255, 0.25);
}

.phase-matchmaking .emblem-halo {
  background: radial-gradient(
    circle,
    rgba(139, 74, 255, 0.5) 0%,
    rgba(56, 189, 248, 0.25) 50%,
    transparent 75%
  );
  animation: halo-pulse 2.2s ease-in-out infinite;
}

.radar-wave {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(166, 124, 255, 0.7);
  pointer-events: none;
  opacity: 0;
  animation: radar-ping 2.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
}

.radar-wave.wave-2 {
  animation-delay: 1.2s;
  border-color: rgba(56, 189, 248, 0.6);
}

/* Phase: ReadyCheck (Có trận! Chấp nhận trận đấu!) */
.phase-ready-check .emblem-img {
  animation: ready-heartbeat 1.2s ease-in-out infinite;
  filter: drop-shadow(0 0 18px rgba(166, 124, 255, 0.95))
    drop-shadow(0 0 35px rgba(56, 189, 248, 0.5));
}

.phase-ready-check .emblem-orbit-ring {
  border: 2px solid rgba(166, 124, 255, 0.8);
  border-top-color: #38bdf8;
  border-bottom-color: #c084fc;
  animation: cyber-spin 3s linear infinite;
  box-shadow: 0 0 20px rgba(139, 74, 255, 0.6);
}

.ready-shockwave {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 2px solid rgba(192, 132, 252, 0.9);
  pointer-events: none;
  opacity: 0;
  animation: ready-burst 1.5s cubic-bezier(0.1, 0.85, 0.3, 1) infinite;
}

.ready-shockwave.shockwave-2 {
  animation-delay: 0.75s;
  border-color: rgba(56, 189, 248, 0.85);
}

/* Accepted State */
.is-accepted .emblem-img {
  animation: accepted-glow 2.5s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.85));
}

.is-accepted .emblem-orbit-ring {
  border: 2px solid rgba(56, 189, 248, 0.7);
  animation: cyber-spin 12s linear infinite;
}

/* ── Keyframes ── */
@keyframes emblem-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.02);
  }
}

@keyframes cyber-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes halo-pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
}

@keyframes radar-ping {
  0% {
    transform: scale(0.85);
    opacity: 0.85;
  }
  100% {
    transform: scale(2.3);
    opacity: 0;
  }
}

@keyframes ready-heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.08);
  }
  50% {
    transform: scale(1.02);
  }
  75% {
    transform: scale(1.12);
  }
}

@keyframes ready-burst {
  0% {
    transform: scale(0.9);
    opacity: 0.95;
    box-shadow: 0 0 10px rgba(166, 124, 255, 0.8);
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
    box-shadow: 0 0 30px rgba(166, 124, 255, 0);
  }
}

@keyframes accepted-glow {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.8));
  }
  50% {
    transform: scale(1.04);
    filter: drop-shadow(0 0 26px rgba(139, 74, 255, 0.9));
  }
}

/* ── HUD Badges and Buttons ── */
.searching-hud-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(139, 74, 255, 0.15);
  border: 1px solid rgba(166, 124, 255, 0.35);
  box-shadow: 0 0 12px rgba(139, 74, 255, 0.2);
}

.searching-radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: radar-blip 1.4s ease-in-out infinite;
}

@keyframes radar-blip {
  0%,
  100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
    box-shadow: 0 0 12px #38bdf8;
  }
}

.ready-accept-countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(139, 74, 255, 0.22);
  border: 1px solid rgba(192, 132, 252, 0.5);
  box-shadow: 0 0 15px rgba(139, 74, 255, 0.4);
  animation: countdown-glow 1.5s ease-in-out infinite;
}

@keyframes countdown-glow {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(139, 74, 255, 0.3);
  }
  50% {
    box-shadow:
      0 0 22px rgba(168, 85, 247, 0.65),
      0 0 35px rgba(56, 189, 248, 0.35);
  }
}

.countdown-blip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c084fc;
  box-shadow: 0 0 8px #c084fc;
  animation: radar-blip 1s ease-in-out infinite;
}

.cyber-accept-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 18px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #ffffff;
  border-radius: 6px;
  border: 1px solid rgba(192, 132, 252, 0.7);
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%);
  box-shadow: 0 0 18px rgba(139, 74, 255, 0.6);
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;
  animation: cyber-btn-pulse 1.8s ease-in-out infinite;
  overflow: hidden;
}

.cyber-accept-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.15);
  box-shadow: 0 0 26px rgba(168, 85, 247, 0.85);
}

.cyber-accept-btn:active {
  transform: scale(0.98);
}

@keyframes cyber-btn-pulse {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(139, 74, 255, 0.5);
  }
  50% {
    box-shadow:
      0 0 26px rgba(168, 85, 247, 0.85),
      0 0 40px rgba(99, 102, 241, 0.4);
  }
}

.accepted-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.3);
}

.accepted-check {
  font-size: 12px;
  font-weight: 900;
  color: #38bdf8;
}
</style>
