<template>
  <div class="rounded-lg bg-black/5 p-3 dark:bg-white/5 border border-black/5 dark:border-white/5" v-if="items.length > 0 || isLoading">
    <div class="mb-2.5 text-sm font-bold text-gray-900 dark:text-white">
      {{ t('playerTabs.challenges.titleAssets') }}
    </div>
    <div v-if="isLoading" class="grid grid-cols-2 gap-2">
      <div v-for="i of 6" :key="i" class="flex flex-col gap-1">
        <NSkeleton :sharp="false" text :height="11" :width="50" />
        <NSkeleton :sharp="false" text :height="16" :width="40" />
      </div>
    </div>
    <div v-else class="grid grid-cols-2 gap-2">
      <div class="flex flex-col" v-for="item of items" :key="item.id">
        <div class="text-[11px] text-black/60 dark:text-white/60 font-medium">{{ item.name }}</div>
        <div class="text-base font-bold tabular-nums text-black dark:text-white">{{ item.currentValue }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayerChallenge } from '@shared/types/sgp/challenges-client'
import { useTranslation } from 'i18next-vue'
import { NSkeleton } from 'naive-ui'
import { computed } from 'vue'

import {
  CHALLENGES_CHAMPIONS_ID,
  CHALLENGES_CHAMPION_SKINS_ID,
  CHALLENGES_CHROMA_SKINS_ID,
  CHALLENGES_EMOTES_ID,
  CHALLENGES_SUMMONER_ICONS_ID,
  CHALLENGES_WARD_SKINS_ID
} from '../constants'
import { useChallengesPlayerData } from '../data/challenges'

const { t } = useTranslation()

const { challengesPlayerData, isLoading } = useChallengesPlayerData()

const challengeMap = computed(() => {
  if (!challengesPlayerData.value) {
    return {}
  }

  return challengesPlayerData.value.playerChallenges.reduce(
    (acc, cur) => {
      acc[cur.id] = cur
      return acc
    },
    {} as Record<number, PlayerChallenge>
  )
})

const items = computed(() => {
  return [
    [CHALLENGES_CHAMPIONS_ID, 'champions'],
    [CHALLENGES_CHAMPION_SKINS_ID, 'championSkins'],
    [CHALLENGES_CHROMA_SKINS_ID, 'chromaSkins'],
    [CHALLENGES_WARD_SKINS_ID, 'wardSkins'],
    [CHALLENGES_SUMMONER_ICONS_ID, 'summonerIcons'],
    [CHALLENGES_EMOTES_ID, 'emotes']
  ]
    .map(([id, nameKey]) => {
      const challenge = challengeMap.value[id]

      if (!challenge) return null

      return {
        id: challenge.id,
        currentValue: challenge.currentValue,
        name: t(`playerTabs.challenges.${nameKey}`)
      }
    })
    .filter((i) => i !== null)
})
</script>
