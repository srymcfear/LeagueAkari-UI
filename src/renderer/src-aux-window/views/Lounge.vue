<template>
  <div
    class="relative box-border flex h-full flex-col items-center justify-center p-3"
    :data-motion="enableAnimations ? 'full' : 'reduced'"
  >
    <div class="flex flex-1 flex-col items-center justify-center">
      <!-- Cyberpunk Emblem Hub -->
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

        <!-- Rotating Cyber HUD Rings -->
        <div class="emblem-orbit-ring" />
        <div class="emblem-inner-ring" />

        <!-- Radar Pulse Rings (Matchmaking Waiting) -->
        <div v-if="lcs.gameflow.phase === 'Matchmaking'" class="radar-wave wave-1" />
        <div v-if="lcs.gameflow.phase === 'Matchmaking'" class="radar-wave wave-2" />

        <!-- Ready Check Shockwaves (Accept Phase) -->
        <div v-if="lcs.gameflow.phase === 'ReadyCheck'" class="ready-shockwave shockwave-1" />
        <div v-if="lcs.gameflow.phase === 'ReadyCheck'" class="ready-shockwave shockwave-2" />

        <!-- Queue / Map Emblem Icon -->
        <Transition name="emblem-swap" mode="out-in">
          <LcuImage
            v-if="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
            :key="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
            class="emblem-img h-16 w-16"
            :src="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
          />
          <div v-else class="emblem-placeholder flex h-16 w-16 items-center justify-center">
            <div class="emblem-placeholder-core" />
          </div>
        </Transition>
      </div>

      <!-- Phase content panel với crossfade transition -->
      <Transition name="phase-panel" mode="out-in">
        <template v-if="lcs.gameflow.phase === 'ReadyCheck'" :key="'readycheck'">
          <div class="flex flex-col items-center">
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
              <NButton
                type="primary"
                secondary
                size="tiny"
                @click="() => handleCancelAutoAccept()"
                >{{ t('auxWindow.lounge.panel.autoAccept.cancelButton') }}</NButton
              >
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
          </div>
        </template>

        <div
          v-else-if="lcs.gameflow.phase === 'Matchmaking'"
          :key="'matchmaking'"
          class="flex flex-col items-center"
        >
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
        </div>

        <div
          v-else-if="agfs.willSearchMatch"
          :key="'will-search'"
          class="flex flex-col items-center"
        >
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
        </div>

        <div v-else :key="'idle'" class="flex flex-col items-center">
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
        </div>
      </Transition>
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
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

const acs = useAppCommonStore()
const enableAnimations = computed(() => acs.settings.enableAnimations ?? true)

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
/* ── Vue Transition Classes ── */

/* Phase panel crossfade: khi phase thay đổi (Idle → Matchmaking → ReadyCheck) */
.phase-panel-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.phase-panel-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.phase-panel-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.phase-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Emblem icon swap khi đổi map */
.emblem-swap-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.emblem-swap-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.12s ease;
}
.emblem-swap-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.emblem-swap-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* ── Emblem Hub ── */
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
  inset: 6px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(139, 74, 255, 0.28) 0%,
    rgba(56, 189, 248, 0.1) 50%,
    transparent 72%
  );
  filter: blur(12px);
  pointer-events: none;
  transition:
    background 0.4s ease,
    filter 0.4s ease,
    opacity 0.4s ease;
}

[data-motion='full'] .emblem-halo {
  animation: halo-breathe 4.5s ease-in-out infinite;
}

.emblem-orbit-ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1px dashed rgba(166, 124, 255, 0.35);
  pointer-events: none;
  transition:
    border-color 0.35s ease,
    box-shadow 0.35s ease;
}

[data-motion='full'] .emblem-orbit-ring {
  animation: ring-spin-cw 28s linear infinite;
}

.emblem-inner-ring {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 1px solid rgba(139, 74, 255, 0.2);
  pointer-events: none;
  transition:
    border-color 0.35s ease,
    box-shadow 0.35s ease;
}

[data-motion='full'] .emblem-inner-ring {
  animation: ring-spin-ccw 20s linear infinite;
}

.emblem-img {
  position: relative;
  z-index: 2;
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45));
}

[data-motion='full'] .emblem-img {
  animation: emblem-hover-float 4s ease-in-out infinite;
}

.emblem-placeholder {
  position: relative;
  z-index: 2;
}

.emblem-placeholder-core {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  transform: rotate(45deg);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(56, 189, 248, 0.4));
  border: 1px solid rgba(192, 132, 252, 0.6);
  box-shadow: 0 0 10px rgba(139, 74, 255, 0.4);
}

/* Phase: Matchmaking */
.phase-matchmaking .emblem-orbit-ring {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.22);
}

[data-motion='full'] .phase-matchmaking .emblem-orbit-ring {
  animation: ring-spin-cw 8s linear infinite;
}

.phase-matchmaking .emblem-inner-ring {
  border-color: rgba(166, 124, 255, 0.45);
}

[data-motion='full'] .phase-matchmaking .emblem-inner-ring {
  animation: ring-spin-ccw 6s linear infinite;
}

.phase-matchmaking .emblem-halo {
  background: radial-gradient(
    circle,
    rgba(139, 74, 255, 0.35) 0%,
    rgba(56, 189, 248, 0.18) 55%,
    transparent 78%
  );
  filter: blur(14px);
}

[data-motion='full'] .phase-matchmaking .emblem-halo {
  animation: halo-breathe 2.6s ease-in-out infinite;
}

.phase-matchmaking .emblem-img {
  filter: drop-shadow(0 0 12px rgba(139, 74, 255, 0.45));
}

/* Phase: ReadyCheck */
.phase-ready-check .emblem-orbit-ring {
  border: 1.5px dashed rgba(192, 132, 252, 0.85);
  box-shadow:
    0 0 16px rgba(139, 74, 255, 0.4),
    inset 0 0 8px rgba(139, 74, 255, 0.15);
}

[data-motion='full'] .phase-ready-check .emblem-orbit-ring {
  animation: ring-spin-cw 2.8s linear infinite;
}

.phase-ready-check .emblem-inner-ring {
  border-color: rgba(192, 132, 252, 0.65);
}

[data-motion='full'] .phase-ready-check .emblem-inner-ring {
  animation: ring-spin-ccw 2.2s linear infinite;
}

.phase-ready-check .emblem-halo {
  background: radial-gradient(
    circle,
    rgba(192, 132, 252, 0.45) 0%,
    rgba(139, 74, 255, 0.25) 55%,
    transparent 80%
  );
  filter: blur(16px);
}

[data-motion='full'] .phase-ready-check .emblem-halo {
  animation: halo-breathe 1.4s ease-in-out infinite;
}

[data-motion='full'] .phase-ready-check .emblem-img {
  animation: emblem-ready-pop 1.1s ease-in-out infinite alternate;
}

/* Radar Waves - Matchmaking Outward Pulse */
.radar-wave {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(166, 124, 255, 0.5);
  pointer-events: none;
  opacity: 0;
}

[data-motion='full'] .phase-matchmaking .radar-wave.wave-1 {
  animation: radar-ping 2.6s cubic-bezier(0.15, 0.85, 0.35, 1) infinite;
}

[data-motion='full'] .phase-matchmaking .radar-wave.wave-2 {
  animation: radar-ping 2.6s cubic-bezier(0.15, 0.85, 0.35, 1) 1.3s infinite;
}

/* Ready Check Shockwave - Energetic Expansion */
.ready-shockwave {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(192, 132, 252, 0.6);
  pointer-events: none;
  opacity: 0;
}

[data-motion='full'] .phase-ready-check .ready-shockwave.shockwave-1 {
  animation: shockwave-ping 1.8s cubic-bezier(0.1, 0.9, 0.2, 1) infinite;
}

[data-motion='full'] .phase-ready-check .ready-shockwave.shockwave-2 {
  animation: shockwave-ping 1.8s cubic-bezier(0.1, 0.9, 0.2, 1) 0.9s infinite;
}

/* Accepted State */
.is-accepted .emblem-orbit-ring {
  border: 1.5px solid rgba(56, 189, 248, 0.75);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.45);
}

.is-accepted .emblem-halo {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%);
}

.is-accepted .emblem-img {
  filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.65));
  transform: scale(1.05);
}

/* Reduced Motion Mode (Animations Turned Off) */
[data-motion='reduced'] .emblem-halo,
[data-motion='reduced'] .emblem-orbit-ring,
[data-motion='reduced'] .emblem-inner-ring,
[data-motion='reduced'] .radar-wave,
[data-motion='reduced'] .ready-shockwave,
[data-motion='reduced'] .emblem-img,
[data-motion='reduced'] .searching-radar-dot,
[data-motion='reduced'] .countdown-blip {
  animation: none !important;
}

[data-motion='reduced'] .radar-wave,
[data-motion='reduced'] .ready-shockwave {
  display: none !important;
}

/* ── HUD Keyframe Animations ── */
@keyframes halo-breathe {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.95;
  }
}

@keyframes ring-spin-cw {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes ring-spin-ccw {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

@keyframes radar-ping {
  0% {
    transform: scale(0.75);
    opacity: 0.95;
    box-shadow: 0 0 8px rgba(139, 74, 255, 0.5);
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: scale(1.85);
    opacity: 0;
    box-shadow: 0 0 2px rgba(56, 189, 248, 0);
  }
}

@keyframes shockwave-ping {
  0% {
    transform: scale(0.85);
    opacity: 1;
    border-color: rgba(192, 132, 252, 0.9);
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
  }
  100% {
    transform: scale(1.95);
    opacity: 0;
    border-color: rgba(56, 189, 248, 0);
    box-shadow: 0 0 0 rgba(168, 85, 247, 0);
  }
}

@keyframes emblem-hover-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.02);
  }
}

@keyframes emblem-ready-pop {
  0% {
    transform: scale(1.02);
    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5));
  }
  100% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 22px rgba(192, 132, 252, 0.85));
  }
}

.searching-hud-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(139, 74, 255, 0.1);
  border: 1px solid rgba(166, 124, 255, 0.28);
}

.searching-radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 5px rgba(56, 189, 248, 0.7);
  animation: status-blink 2s ease-in-out infinite;
}

@keyframes status-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.ready-accept-countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(139, 74, 255, 0.12);
  border: 1px solid rgba(192, 132, 252, 0.38);
}

.countdown-blip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c084fc;
  box-shadow: 0 0 5px rgba(192, 132, 252, 0.7);
  animation: status-blink 1.2s ease-in-out infinite;
}

.cyber-accept-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 18px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #ffffff;
  border-radius: 6px;
  border: 1px solid rgba(168, 85, 247, 0.5);
  background: rgba(109, 40, 217, 0.75);
  backdrop-filter: blur(6px);
  cursor: pointer;
  user-select: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.15s ease;
}

.cyber-accept-btn:hover {
  background: rgba(124, 58, 237, 0.9);
  border-color: rgba(192, 132, 252, 0.7);
  box-shadow: 0 4px 16px rgba(139, 74, 255, 0.35);
}

.cyber-accept-btn:active {
  transform: scale(0.97);
  background: rgba(91, 33, 182, 0.95);
}

.accepted-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.accepted-check {
  font-size: 12px;
  font-weight: 900;
  color: #38bdf8;
}
</style>
