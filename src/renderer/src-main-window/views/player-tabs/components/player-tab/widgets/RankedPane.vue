<template>
  <div v-if="shouldRender" class="relative flex gap-3 items-stretch">
    <!-- Cross Region Unsupported Card -->
    <div
      v-if="isCrossRegion"
      class="glass-card rank-card-cross relative flex flex-col items-center justify-center rounded-lg bg-black/5 dark:bg-white/5"
      :class="isSmallSize ? 'w-52' : 'w-72'"
    >
      <div class="text-xs text-[var(--la-color-text-primary)]/60">{{ t('playerTabs.ranked.crossRegion', 'Cross Region') }}</div>
      <div class="text-xs text-[var(--la-color-text-primary)]/40">{{ t('playerTabs.ranked.unavailable', 'Unavailable') }}</div>
    </div>

    <!-- Ranked Cards: Concept A — Solo chính + Flex phụ -->
    <template v-else>
      <!-- Solo Queue (primary) -->
      <div
        v-if="soloEntry"
        class="glass-card rank-card-primary rounded-lg bg-black/5 dark:bg-white/5"
        :class="isSmallSize ? 'w-60' : 'w-72'"
        :style="rankGlowVars(soloEntry, 0.15)"
      >
        <div class="rank-card-inner">
          <div class="rank-emblem-wrap">
            <div class="rank-emblem-glow"></div>
            <img
              :src="rankedImageMap[getCurrentTier(soloEntry)] || rankedImageMap['UNRANKED']"
            />
          </div>
          <div class="rank-info-col">
            <span class="queue-label">
              {{ t(`queueTypes.${soloEntry.queueType}`, { defaultValue: soloEntry.queueType, ns: 'common' }) }}
            </span>
            <span class="tier-text">{{ formatTier(soloEntry) }}</span>
            <span v-if="isRankedEntry(soloEntry)" class="lp-text">{{ soloEntry.leaguePoints }} LP</span>
            <span v-if="isRankedEntry(soloEntry)" class="record-text">{{ formatShortRecord(soloEntry) }}</span>
            <div
              v-if="soloEntry.highestTier && soloEntry.highestTier !== 'NA'"
              class="highest-row"
            >
              <span>{{ t('playerTabs.ranked.highest') }}</span>
              <img v-if="rankedMedalMap[soloEntry.highestTier]" :src="rankedMedalMap[soloEntry.highestTier]" />
              <span>{{ formatHighestTier(soloEntry) }}</span>
            </div>
          </div>
        </div>
        <span
          v-if="isRankedEntry(soloEntry)"
          class="rank-wr-chip"
        >{{ formatEntryTopRecord(soloEntry) }}</span>
      </div>

      <!-- Flex Queue (secondary) -->
      <div
        v-if="flexEntry && !isSmallSize"
        class="glass-card rank-card-secondary rounded-lg bg-black/5 dark:bg-white/5"
        :style="rankGlowVars(flexEntry, 0.1)"
      >
        <div class="rank-card-inner-sm">
          <div class="rank-emblem-wrap-sm">
            <div class="rank-emblem-glow-sm"></div>
            <img
              :src="rankedImageMap[getCurrentTier(flexEntry)] || rankedImageMap['UNRANKED']"
            />
          </div>
          <div class="rank-info-col">
            <span class="queue-label">
              {{ t(`queueTypes.${flexEntry.queueType}`, { defaultValue: flexEntry.queueType, ns: 'common' }) }}
            </span>
            <span class="tier-text">{{ formatTier(flexEntry) }}</span>
            <span v-if="isRankedEntry(flexEntry)" class="lp-text">{{ flexEntry.leaguePoints }} LP</span>
            <span v-if="isRankedEntry(flexEntry)" class="record-text">{{ formatShortRecord(flexEntry) }}</span>
          </div>
        </div>
      </div>

      <!-- More Button -->
      <div
        class="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/3"
        v-if="displayedRankedEntries.length > 1"
      >
        <NButton
          :focusable="false"
          :title="t('playerTabs.profile.rankedMore', '更多排位信息')"
          size="small"
          secondary
          @click="isShowingRankedModal = true"
        >
          <template #icon>
            <NIcon><MoreHorizFilled /></NIcon>
          </template>
        </NButton>
      </div>
    </template>
  </div>

  <NModal v-model:show="isShowingRankedModal">
    <div class="flex flex-col items-center rounded bg-[var(--la-card-surface-95)] p-4">
      <div class="mb-4 flex gap-4">
        <div
          v-for="entry in displayedRankedEntries"
          :key="entry.queueType"
          class="glass-card rank-card-primary rounded-lg bg-black/5 dark:bg-white/5 w-60"
          :style="rankGlowVars(entry, 0.12)"
        >
          <div class="rank-card-inner">
            <div class="rank-emblem-wrap rank-emblem-wrap-md">
              <div class="rank-emblem-glow"></div>
              <img
                :src="rankedImageMap[getCurrentTier(entry)] || rankedImageMap['UNRANKED']"
              />
            </div>
            <div class="rank-info-col">
              <span class="queue-label">
                {{ t(`queueTypes.${entry.queueType}`, { defaultValue: entry.queueType, ns: 'common' }) }}
              </span>
              <span class="tier-text">{{ formatTier(entry) }}</span>
              <span v-if="isRankedEntry(entry)" class="lp-text">{{ entry.leaguePoints }} LP</span>
              <span v-if="isRankedEntry(entry)" class="record-text">{{ formatShortRecord(entry) }}</span>
              <div
                v-if="entry.highestTier && entry.highestTier !== 'NA'"
                class="highest-row"
              >
                <span>{{ t('playerTabs.ranked.highest') }}</span>
                <img v-if="rankedMedalMap[entry.highestTier]" :src="rankedMedalMap[entry.highestTier]" />
                <span>{{ formatHighestTier(entry) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RankedTable v-if="rankedStats" :ranked-stats="rankedStats" />
    </div>
  </NModal>
</template>

<script setup lang="ts">
import RankedBronze from '@renderer-shared/assets/ranked-icons-large/bronze.png'
import RankedChallenger from '@renderer-shared/assets/ranked-icons-large/challenger.png'
import RankedDiamond from '@renderer-shared/assets/ranked-icons-large/diamond.png'
import RankedEmerald from '@renderer-shared/assets/ranked-icons-large/emerald.png'
import RankedGold from '@renderer-shared/assets/ranked-icons-large/gold.png'
import RankedGrandmaster from '@renderer-shared/assets/ranked-icons-large/grandmaster.png'
import RankedIron from '@renderer-shared/assets/ranked-icons-large/iron.png'
import RankedMaster from '@renderer-shared/assets/ranked-icons-large/master.png'
import RankedPlatinum from '@renderer-shared/assets/ranked-icons-large/platinum.png'
import RankedSilver from '@renderer-shared/assets/ranked-icons-large/silver.png'
import RankedNone from '@renderer-shared/assets/ranked-icons-large/unranked.png'
import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'
import { MoreHorizFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useRankedStats } from '../data/ranked-stats'

const { isCrossRegion } = usePlayerTab()

const { t } = useTranslation()
const isShowingRankedModal = ref(false)

const { rankedStats, isLoading } = useRankedStats()

// 只显示单双排和灵活组排
const DISPLAY_QUEUE_TYPES: Array<keyof RankedStats['queueMap']> = [
  'RANKED_SOLO_5x5',
  'RANKED_FLEX_SR'
]

const displayedRankedEntries = computed(() => {
  if (!rankedStats.value) return []

  return DISPLAY_QUEUE_TYPES.map((queueType) => {
    return (
      rankedStats.value?.queueMap[queueType] ||
      rankedStats.value?.queues.find((entry) => entry.queueType === queueType)
    )
  }).filter((entry): entry is RankedEntry => Boolean(entry))
})

const rankedImageMap: Record<string, string> = {
  UNRANKED: RankedNone,
  IRON: RankedIron,
  BRONZE: RankedBronze,
  SILVER: RankedSilver,
  GOLD: RankedGold,
  EMERALD: RankedEmerald,
  PLATINUM: RankedPlatinum,
  DIAMOND: RankedDiamond,
  MASTER: RankedMaster,
  GRANDMASTER: RankedGrandmaster,
  CHALLENGER: RankedChallenger
}

const rankedMedalMap: Record<string, string> = {
  IRON: IronMedal,
  BRONZE: BronzeMedal,
  SILVER: SilverMedal,
  GOLD: GoldMedal,
  PLATINUM: PlatinumMedal,
  EMERALD: EmeraldMedal,
  DIAMOND: DiamondMedal,
  MASTER: MasterMedal,
  GRANDMASTER: GrandmasterMedal,
  CHALLENGER: ChallengerMedal
}

const soloEntry = computed(() => displayedRankedEntries.value[0] || null)
const flexEntry = computed(() => displayedRankedEntries.value[1] || null)

const RANK_GLOW_RGB: Record<string, [number, number, number]> = {
  IRON: [89, 89, 89],
  BRONZE: [205, 127, 50],
  SILVER: [192, 192, 192],
  GOLD: [255, 215, 0],
  PLATINUM: [39, 184, 196],
  EMERALD: [80, 200, 120],
  DIAMOND: [122, 93, 255],
  MASTER: [211, 47, 47],
  GRANDMASTER: [255, 69, 0],
  CHALLENGER: [0, 191, 255],
}

const rankGlowVars = (entry: Partial<RankedEntry>, intensity: number) => {
  const rgb = RANK_GLOW_RGB[entry.tier || '']
  if (!rgb) return {}
  return { '--rank-glow': `${rgb[0]} ${rgb[1]} ${rgb[2]}`, '--rank-glow-a': String(intensity) }
}

const shouldRender = computed(() => {
  if (isCrossRegion.value) {
    return true
  }
  return soloEntry.value !== null || isLoading.value
})

const isUnrankedTier = (tier: string | undefined | null) => {
  return !tier || tier === 'NA' || tier === 'NONE'
}

const isRankedEntry = (entry: Partial<RankedEntry>) => {
  return !isUnrankedTier(entry.tier)
}

const getCurrentTier = (entry: Partial<RankedEntry>) => {
  return isUnrankedTier(entry.tier) ? 'UNRANKED' : entry.tier!
}

const formatEntryTopRecord = (entry: Partial<RankedEntry>) => {
  const wins = entry.wins ?? 0
  const losses = entry.losses ?? 0
  const total = wins + losses
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'

  return `${t('playerTabs.ranked.winRate')} ${winRate}%`
}

const formatShortRecord = (entry: Partial<RankedEntry>) => {
  if (!isRankedEntry(entry)) return '—'
  const wins = entry.wins ?? 0
  const losses = entry.losses ?? 0
  const total = wins + losses
  const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'
  return `${wins}W / ${losses}L · ${wr}%`
}

const formatTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  const rawTier = entry.tier

  if (isUnrankedTier(rawTier)) {
    return t('playerTabs.ranked.unranked', 'unranked')
  }

  const tier = t(`tiers.${rawTier}`, {
    defaultValue: rawTier,
    ns: 'common'
  })

  const division = entry.division

  if (isUnrankedTier(division)) {
    return tier
  }

  return `${tier} ${division}`
}

const formatHighestTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  if (isUnrankedTier(entry.highestTier)) {
    return t('playerTabs.ranked.unranked', 'unranked')
  }

  const tier = t(`tiers.${entry.highestTier}`, {
    defaultValue: entry.highestTier,
    ns: 'common'
  })

  const division = entry.highestDivision

  if (isUnrankedTier(division)) {
    return tier
  }

  return `${tier} ${division}`
}
</script>

<style scoped>
/* ── Override glass-card for rank cards: dimmer bg ── */
.rank-card-primary.glass-card,
.rank-card-secondary.glass-card {
  background: rgba(22, 18, 38, 0.25);
}

/* ── Rank Glow (tier-based ambient glow around emblem) ── */
.rank-emblem-glow {
  position: absolute;
  inset: -28px;
  background: radial-gradient(circle, rgb(var(--rank-glow, 139 74 255) / var(--rank-glow-a, 0.15)) 0%, transparent 70%);
  pointer-events: none;
  border-radius: 50%;
}

.rank-emblem-glow-sm {
  position: absolute;
  inset: -14px;
  background: radial-gradient(circle, rgb(var(--rank-glow, 139 74 255) / var(--rank-glow-a, 0.1)) 0%, transparent 70%);
  pointer-events: none;
  border-radius: 50%;
}

/* ── Card: Solo (primary) ── */
.rank-card-primary {
  min-height: 140px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.rank-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.rank-emblem-wrap {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.rank-emblem-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

/* ── Card: Flex (secondary) ── */
.rank-card-secondary {
  min-height: 140px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.rank-card-inner-sm {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.rank-emblem-wrap-sm {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.rank-emblem-wrap-sm img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

/* ── Info column (shared) ── */
.rank-info-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.queue-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--la-color-text-primary);
  opacity: 0.45;
  margin-bottom: 2px;
}

.tier-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--la-color-text-primary);
  line-height: 1.3;
}

.lp-text {
  font-size: 13px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: var(--la-color-text-primary);
  opacity: 0.55;
}

.record-text {
  font-size: 11px;
  color: var(--la-color-text-primary);
  opacity: 0.38;
}

.highest-row {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--la-color-text-primary);
  opacity: 0.38;
  margin-top: 2px;
}

.highest-row img {
  width: 12px;
  height: 12px;
}

/* ── Win rate chip (top-right corner on solo card) ── */
.rank-wr-chip {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--la-color-text-primary);
  opacity: 0.5;
  letter-spacing: 0.2px;
}

/* ── Cross region ── */
.rank-card-cross {
  min-height: 116px;
}

/* ── Emblem size in modal ── */
.rank-emblem-wrap-md {
  width: 72px;
  height: 72px;
}
</style>
