<template>
  <div v-if="shouldRender" class="relative flex items-center gap-3">
    <!-- Cross Region Unsupported Card -->
    <div
      v-if="isCrossRegion"
      class="ranked-hud-card flex h-[78px] w-72 items-center justify-center"
      style="--tier-accent: rgba(140, 150, 164, 0.4)"
    >
      <div class="flex flex-col items-center justify-center text-center">
        <div class="text-xs font-bold tracking-wide text-neutral-800 uppercase dark:text-white/70">
          {{ t('playerTabs.ranked.crossRegion', 'Cross Region') }}
        </div>
        <div class="mt-0.5 text-[11px] text-neutral-500 dark:text-white/40">
          {{ t('playerTabs.ranked.unavailable', 'Unavailable') }}
        </div>
      </div>
    </div>

    <!-- Ranked Cards: Clean Modern HUD Cards -->
    <template v-else>
      <!-- Primary Card (Solo/Duo or Fallback) -->
      <div
        v-if="primaryEntry"
        class="ranked-hud-card ranked-hud-primary"
        :style="{
          '--tier-accent': tierHexColor(primaryEntry)
        }"
      >
        <!-- Left: Rank Crest -->
        <div class="hud-crest-wrap">
          <div class="hud-crest-glow" :style="tierGlowStyle(primaryEntry)"></div>
          <img
            class="hud-crest-img"
            :src="rankedImageMap[getCurrentTier(primaryEntry)] || rankedImageMap['UNRANKED']"
          />
        </div>

        <!-- Center: Info -->
        <div class="hud-info-wrap">
          <!-- Queue row -->
          <div class="flex items-center gap-1.5 leading-none">
            <span class="hud-queue-badge">{{ getQueueShortCode(primaryEntry.queueType) }}</span>
            <span class="hud-queue-title">
              {{
                t(`queueTypes.${primaryEntry.queueType}`, {
                  defaultValue: primaryEntry.queueType,
                  ns: 'common'
                })
              }}
            </span>
          </div>

          <!-- Tier name & LP -->
          <div class="mt-1 flex items-center gap-2">
            <span class="hud-tier-name" :style="{ backgroundImage: getTierGradient(primaryEntry) }">
              {{ formatTier(primaryEntry).toUpperCase() }}
            </span>
            <span v-if="isRankedEntry(primaryEntry)" class="hud-lp-pill">
              {{ primaryEntry.leaguePoints }} LP
            </span>
          </div>

          <!-- Record & Highest Tier -->
          <div
            v-if="isRankedEntry(primaryEntry)"
            class="mt-1 flex items-center gap-1.5 text-[11px]"
          >
            <span class="font-bold text-sky-600 dark:text-sky-400"
              >{{ primaryEntry.wins ?? 0 }}W</span
            >
            <template v-if="hasLosses(primaryEntry)">
              <span class="text-neutral-800 opacity-30 dark:text-white">·</span>
              <span class="font-bold text-rose-600 dark:text-rose-400"
                >{{ primaryEntry.losses }}L</span
              >
            </template>
            <template v-if="primaryEntry.highestTier && primaryEntry.highestTier !== 'NA'">
              <span class="text-neutral-800 opacity-30 dark:text-white">·</span>
              <span
                class="hud-highest-pill"
                :title="t('ranked.display.highest', { ns: 'ranked', defaultValue: 'Cao nhất' })"
              >
                <span class="mr-0.5 text-[9px] opacity-60">{{
                  t('ranked.display.highest', { ns: 'ranked', defaultValue: 'Cao nhất' })
                }}</span>
                <img
                  v-if="rankedMedalMap[primaryEntry.highestTier]"
                  :src="rankedMedalMap[primaryEntry.highestTier]"
                  class="inline size-3 object-contain"
                />
                {{ formatHighestTier(primaryEntry).toUpperCase() }}
              </span>
            </template>
          </div>
        </div>

        <!-- Right: Clean Minimal Win Rate Ring (only when losses are known) -->
        <div v-if="isRankedEntry(primaryEntry) && hasLosses(primaryEntry)" class="hud-gauge-wrap">
          <svg class="hud-gauge-svg" width="40" height="40" viewBox="0 0 40 40">
            <circle
              class="hud-gauge-bg-circle"
              cx="20"
              cy="20"
              r="15"
              fill="none"
              stroke-width="2.5"
            />
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="none"
              :stroke="tierHexColor(primaryEntry)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-dasharray="94.2"
              :stroke-dashoffset="
                94.2 *
                (1 - Math.min(100, Math.max(0, parseFloat(formatWinRate(primaryEntry)))) / 100)
              "
              transform="rotate(-90 20 20)"
            />
          </svg>
          <div class="hud-gauge-text">
            <span class="text-[11px] leading-none font-bold text-neutral-900 dark:text-white"
              >{{ formatWinRate(primaryEntry) }}%</span
            >
            <span
              class="mt-0.5 text-[8px] leading-none font-semibold tracking-tighter text-neutral-500 uppercase dark:text-white/40"
              >T/T</span
            >
          </div>
        </div>
      </div>

      <!-- Secondary Companion Card (Flex or other) -->
      <div
        v-if="secondaryEntry"
        class="ranked-hud-card ranked-hud-secondary hidden @[1100px]:flex"
        :style="{
          '--tier-accent': tierHexColor(secondaryEntry)
        }"
      >
        <!-- Left: Crest -->
        <div
          class="hud-crest-wrap"
          :class="{ 'opacity-40 grayscale': !isRankedEntry(secondaryEntry) }"
        >
          <div
            v-if="isRankedEntry(secondaryEntry)"
            class="hud-crest-glow"
            :style="tierGlowStyle(secondaryEntry)"
          ></div>
          <img
            class="hud-crest-img"
            :src="rankedImageMap[getCurrentTier(secondaryEntry)] || rankedImageMap['UNRANKED']"
          />
        </div>

        <!-- Center: Info -->
        <div class="hud-info-wrap">
          <!-- Queue row -->
          <div class="flex items-center gap-1.5 leading-none">
            <span class="hud-queue-badge">{{ getQueueShortCode(secondaryEntry.queueType) }}</span>
            <span class="hud-queue-title">
              {{
                t(`queueTypes.${secondaryEntry.queueType}`, {
                  defaultValue: secondaryEntry.queueType,
                  ns: 'common'
                })
              }}
            </span>
          </div>

          <!-- Tier name & LP -->
          <div class="mt-1 flex items-center gap-2">
            <span
              class="hud-tier-name"
              :class="{
                'text-[14px]! text-neutral-500 dark:text-white/50': !isRankedEntry(secondaryEntry)
              }"
              :style="
                isRankedEntry(secondaryEntry)
                  ? { backgroundImage: getTierGradient(secondaryEntry) }
                  : {}
              "
            >
              {{ formatTier(secondaryEntry).toUpperCase() }}
            </span>
            <span v-if="isRankedEntry(secondaryEntry)" class="hud-lp-pill">
              {{ secondaryEntry.leaguePoints }} LP
            </span>
          </div>

          <!-- Record or Unranked text -->
          <div
            v-if="isRankedEntry(secondaryEntry)"
            class="mt-1 flex items-center gap-1.5 text-[11px]"
          >
            <span class="font-bold text-sky-600 dark:text-sky-400"
              >{{ secondaryEntry.wins ?? 0 }}W</span
            >
            <template v-if="hasLosses(secondaryEntry)">
              <span class="text-neutral-800 opacity-30 dark:text-white">·</span>
              <span class="font-bold text-rose-600 dark:text-rose-400"
                >{{ secondaryEntry.losses }}L</span
              >
              <span class="text-neutral-800 opacity-30 dark:text-white">·</span>
              <span class="font-medium text-neutral-600 dark:text-white/60"
                >{{ formatWinRate(secondaryEntry) }}%</span
              >
            </template>
          </div>
          <div v-else class="mt-0.5 text-[10.5px] text-neutral-400 dark:text-white/30">0 trận</div>
        </div>
      </div>

      <!-- More Button in natural flow -->
      <NButton
        v-if="displayedRankedEntries.length > 1"
        :focusable="false"
        :title="t('playerTabs.profile.rankedMore', 'Xem thêm thông tin xếp hạng')"
        size="small"
        secondary
        circle
        class="shrink-0 text-neutral-500 hover:text-black dark:text-white/50 dark:hover:text-white"
        @click="isShowingRankedModal = true"
      >
        <template #icon>
          <NIcon size="16"><MoreHorizFilled /></NIcon>
        </template>
      </NButton>
    </template>
  </div>

  <NModal v-model:show="isShowingRankedModal">
    <div class="flex flex-col items-center rounded bg-[var(--la-card-surface-95)] p-4">
      <div class="mb-4 flex gap-4">
        <div
          v-for="entry in displayedRankedEntries"
          :key="entry.queueType"
          class="ranked-hud-card h-[78px] w-80 p-2"
          :style="{
            '--tier-accent': tierHexColor(entry)
          }"
        >
          <div class="hud-crest-wrap">
            <div class="hud-crest-glow" :style="tierGlowStyle(entry)"></div>
            <img
              class="hud-crest-img"
              :src="rankedImageMap[getCurrentTier(entry)] || rankedImageMap['UNRANKED']"
            />
          </div>
          <div class="hud-info-wrap">
            <div class="flex items-center gap-1.5 leading-none">
              <span class="hud-queue-badge">{{ getQueueShortCode(entry.queueType) }}</span>
              <span class="hud-queue-title">
                {{
                  t(`queueTypes.${entry.queueType}`, {
                    defaultValue: entry.queueType,
                    ns: 'common'
                  })
                }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <span class="hud-tier-name" :style="{ backgroundImage: getTierGradient(entry) }">
                {{ formatTier(entry).toUpperCase() }}
              </span>
              <span v-if="isRankedEntry(entry)" class="hud-lp-pill">
                {{ entry.leaguePoints }} LP
              </span>
            </div>
            <div v-if="isRankedEntry(entry)" class="mt-1 flex items-center gap-1.5 text-[11px]">
              <span class="font-bold text-sky-400">{{ entry.wins ?? 0 }}W</span>
              <template v-if="hasLosses(entry)">
                <span class="text-white opacity-30">·</span>
                <span class="font-bold text-rose-400">{{ entry.losses }}L</span>
                <span class="text-white opacity-30">·</span>
                <span class="font-medium text-white/60">{{ formatWinRate(entry) }}%</span>
              </template>
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

const soloEntry = computed(
  () => displayedRankedEntries.value.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null
)
const flexEntry = computed(
  () => displayedRankedEntries.value.find((e) => e.queueType === 'RANKED_FLEX_SR') ?? null
)

const primaryEntry = computed(() => soloEntry.value ?? flexEntry.value ?? null)
const secondaryEntry = computed(() => {
  if (soloEntry.value && flexEntry.value) {
    return flexEntry.value
  }
  return null
})

interface TierTheme {
  gradient: string
  glowRgb: [number, number, number]
  hexColor: string
  borderColor: string
  innerBorderColor: string
}

const TIER_THEMES: Record<string, TierTheme> = {
  IRON: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #d0c8c0 30%, #8c827c 70%, #463d38 100%)',
    glowRgb: [140, 130, 124],
    hexColor: '#a89f91',
    borderColor: 'rgba(168, 159, 145, 0.5)',
    innerBorderColor: 'rgba(168, 159, 145, 0.22)'
  },
  BRONZE: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #f6bca0 30%, #b86b45 70%, #5a2e18 100%)',
    glowRgb: [184, 107, 69],
    hexColor: '#cd7f32',
    borderColor: 'rgba(205, 127, 50, 0.55)',
    innerBorderColor: 'rgba(205, 127, 50, 0.25)'
  },
  SILVER: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #e8f0f8 30%, #9cb4ca 70%, #4b6278 100%)',
    glowRgb: [160, 185, 210],
    hexColor: '#b0c4de',
    borderColor: 'rgba(176, 196, 222, 0.55)',
    innerBorderColor: 'rgba(176, 196, 222, 0.25)'
  },
  GOLD: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #faeab8 25%, #d8ae48 60%, #825e1c 100%)',
    glowRgb: [230, 180, 60],
    hexColor: '#d4af37',
    borderColor: 'rgba(218, 175, 55, 0.6)',
    innerBorderColor: 'rgba(218, 175, 55, 0.28)'
  },
  PLATINUM: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #baf8ee 30%, #3ec2ae 70%, #155e54 100%)',
    glowRgb: [62, 194, 174],
    hexColor: '#2eb8a2',
    borderColor: 'rgba(46, 184, 162, 0.55)',
    innerBorderColor: 'rgba(46, 184, 162, 0.25)'
  },
  EMERALD: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #bafad2 30%, #34d47c 70%, #0f6334 100%)',
    glowRgb: [52, 212, 124],
    hexColor: '#2ec872',
    borderColor: 'rgba(46, 200, 114, 0.55)',
    innerBorderColor: 'rgba(46, 200, 114, 0.25)'
  },
  DIAMOND: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #e2deff 30%, #9587ff 65%, #3d2eb0 100%)',
    glowRgb: [149, 135, 255],
    hexColor: '#8b7df8',
    borderColor: 'rgba(139, 125, 248, 0.6)',
    innerBorderColor: 'rgba(139, 125, 248, 0.28)'
  },
  MASTER: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #fcc2ff 30%, #d44afc 65%, #621480 100%)',
    glowRgb: [212, 74, 252],
    hexColor: '#c840f0',
    borderColor: 'rgba(200, 64, 240, 0.6)',
    innerBorderColor: 'rgba(200, 64, 240, 0.28)'
  },
  GRANDMASTER: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #ffd8c4 30%, #fc5030 65%, #881808 100%)',
    glowRgb: [252, 80, 48],
    hexColor: '#f44828',
    borderColor: 'rgba(244, 72, 40, 0.6)',
    innerBorderColor: 'rgba(244, 72, 40, 0.28)'
  },
  CHALLENGER: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #c4f4ff 30%, #28c4fc 65%, #0c567c 100%)',
    glowRgb: [40, 196, 252],
    hexColor: '#20b8f0',
    borderColor: 'rgba(32, 184, 240, 0.6)',
    innerBorderColor: 'rgba(32, 184, 240, 0.28)'
  },
  UNRANKED: {
    gradient: 'linear-gradient(180deg, #ffffff 0%, #ccd4de 40%, #7e8898 80%, #3e444e 100%)',
    glowRgb: [126, 136, 152],
    hexColor: '#8c96a4',
    borderColor: 'rgba(140, 150, 164, 0.4)',
    innerBorderColor: 'rgba(140, 150, 164, 0.18)'
  }
}

const getTierTheme = (entry?: Partial<RankedEntry> | null): TierTheme => {
  if (!entry) return TIER_THEMES.UNRANKED
  const tier = getCurrentTier(entry)
  return TIER_THEMES[tier] || TIER_THEMES.UNRANKED
}

const tierHexColor = (entry?: Partial<RankedEntry> | null) => getTierTheme(entry).hexColor
const getTierGradient = (entry?: Partial<RankedEntry> | null) => getTierTheme(entry).gradient

const tierGlowStyle = (entry?: Partial<RankedEntry> | null) => {
  const theme = getTierTheme(entry)
  return {
    background: `radial-gradient(circle, rgba(${theme.glowRgb.join(',')}, 0.32) 0%, transparent 70%)`
  }
}

const getQueueShortCode = (queueType?: string) => {
  if (!queueType) return 'R'
  if (queueType.includes('SOLO')) return 'S'
  if (queueType.includes('FLEX')) return 'F'
  if (queueType.includes('CHERRY')) return 'A'
  return 'R'
}

const shouldRender = computed(() => {
  if (isCrossRegion.value) {
    return true
  }
  return primaryEntry.value !== null || isLoading.value
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

const hasLosses = (entry?: Partial<RankedEntry> | null) => {
  return typeof entry?.losses === 'number' && entry.losses > 0
}

const formatWinRate = (entry: Partial<RankedEntry>) => {
  const wins = entry.wins ?? 0
  const losses = entry.losses ?? 0
  const total = wins + losses
  return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0'
}

const formatTier = (entry: Partial<RankedEntry>) => {
  if (!entry) return ''

  const rawTier = entry.tier

  if (isUnrankedTier(rawTier)) {
    return t('playerTabs.ranked.unranked', 'Chưa xếp hạng')
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
    return t('playerTabs.ranked.unranked', 'Chưa xếp hạng')
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
/* ── Modern HUD Card Outer Container ── */
.ranked-hud-card {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3.5px solid var(--tier-accent, rgba(255, 255, 255, 0.2));
  background: rgba(18, 20, 26, 0.72);
  backdrop-filter: blur(12px);
  user-select: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.ranked-hud-card:hover {
  border-color: rgba(255, 255, 255, 0.16);
  border-left-color: var(--tier-accent, rgba(255, 255, 255, 0.45));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.ranked-hud-primary {
  min-width: 330px;
  max-width: 390px;
  height: 78px;
  padding: 6px 12px 6px 8px;
}

.ranked-hud-secondary {
  min-width: 210px;
  max-width: 270px;
  height: 78px;
  padding: 6px 12px 6px 8px;
}

/* ── Left: Crest ── */
.hud-crest-wrap {
  position: relative;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.hud-crest-glow {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.hud-crest-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
}

/* ── Center: Info ── */
.hud-info-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
  padding-left: 6px;
  z-index: 2;
}

.hud-queue-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
  font-size: 8.5px;
  font-weight: 800;
  line-height: 1;
}

.hud-queue-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.55);
}

.hud-tier-name {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.4px;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hud-lp-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  font-size: 10px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  line-height: 1;
}

.hud-highest-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.09);
  font-size: 9.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
}

/* ── Right: Mini Ring Gauge ── */
.hud-gauge-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
  z-index: 2;
}

.hud-gauge-svg {
  position: absolute;
  inset: 0;
}

.hud-gauge-text {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hud-gauge-bg-circle {
  stroke: rgba(255, 255, 255, 0.08);
}

/* ── Light Mode Adaptations (Anti-Glare & High Readability) ── */
[data-theme='light'] .ranked-hud-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 3.5px solid var(--tier-accent, rgba(0, 0, 0, 0.2));
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.03);
}

[data-theme='light'] .ranked-hud-card:hover {
  border-color: rgba(0, 0, 0, 0.16);
  border-left-color: var(--tier-accent, rgba(0, 0, 0, 0.45));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .hud-queue-badge {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.25);
  color: #7e22ce;
}

[data-theme='light'] .hud-queue-title {
  color: rgba(0, 0, 0, 0.55);
}

[data-theme='light'] .hud-tier-name {
  color: var(--tier-accent, #2563eb);
  background-image: none !important;
  -webkit-text-fill-color: var(--tier-accent, #2563eb) !important;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
}

[data-theme='light'] .hud-lp-pill {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.85);
}

[data-theme='light'] .hud-highest-pill {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.7);
}

[data-theme='light'] .hud-gauge-bg-circle {
  stroke: rgba(0, 0, 0, 0.08);
}
</style>
