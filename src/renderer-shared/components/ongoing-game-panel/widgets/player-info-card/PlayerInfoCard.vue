<template>
  <div
    :class="[
      'relative box-border flex flex-col overflow-hidden rounded border border-neutral-900/20 bg-neutral-100/90 p-2 transition-transform duration-200 hover:scale-[1.02] dark:border-white/10 dark:bg-neutral-900/90',
      premadeTeamId && 'border-transparent'
    ]"
    :style="{
      width: FIXED_CARD_WIDTH_PX_LITERAL,
      boxShadow: premadeTeamId
        ? `0 0 0 1.5px ${premadeColors[premadeTeamId]?.borderColor}, 0 0 10px ${premadeColors[premadeTeamId]?.borderColor?.replace(/d0$/, '30')}`
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

import { useGameResourceProvider } from '../../../../providers/game-resource'
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
const resources = useGameResourceProvider()

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const premadeColors = computed(() => {
  return resources.runtime.colorMode === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})
</script>

<style scoped></style>
