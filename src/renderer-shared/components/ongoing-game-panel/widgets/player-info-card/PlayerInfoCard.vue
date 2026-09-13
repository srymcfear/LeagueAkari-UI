<template>
  <div
    :class="[
      'relative box-border flex flex-col overflow-hidden rounded-lg border border-neutral-900/20 bg-neutral-100/90 p-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(139,74,255,0.15)] dark:border-purple-500/15 dark:bg-neutral-950/80 dark:backdrop-blur-md',
      premadeTeamId && 'border-transparent'
    ]"
    :style="{
      width: FIXED_CARD_WIDTH_PX_LITERAL,
      boxShadow: premadeTeamId
        ? `0 0 0 1.5px ${premadeColors[premadeTeamId]?.borderColor}, 0 0 12px ${premadeColors[premadeTeamId]?.borderColor?.replace(/d0$/, '35')}`
        : undefined
    }"
  >

    <PlayerInfoCardHeader :puuid="puuid" />
    <PlayerInfoCardStats :puuid="puuid" />
    <PlayerInfoCardJunglePathing :puuid="puuid" />

    <PlayerCardTagsArea :puuid="puuid" />
    <PlayerInfoCardChampionUsage :puuid="puuid" />
    <PlayerInfoCardMatchHistory :puuid="puuid" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useAkariResourceProvider } from '../../../../providers/akari-resource'
import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT
} from '../../constants'
import { useOngoingGamePanel } from '../../context'
import PlayerCardTagsArea from './player-card-tags/TagsArea.vue'
import PlayerInfoCardChampionUsage from './PlayerInfoCardChampionUsage.vue'
import PlayerInfoCardHeader from './PlayerInfoCardHeader.vue'
import PlayerInfoCardJunglePathing from './PlayerInfoCardJunglePathing.vue'
import PlayerInfoCardMatchHistory from './PlayerInfoCardMatchHistory.vue'
import PlayerInfoCardStats from './PlayerInfoCardStats.vue'

const { puuid } = defineProps<{
  puuid: string
}>()

const { mergedPremadeTeams } = useOngoingGamePanel()
const resources = useAkariResourceProvider()

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const premadeColors = computed(() => {
  return resources.runtime.colorMode === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})
</script>

<style scoped></style>
