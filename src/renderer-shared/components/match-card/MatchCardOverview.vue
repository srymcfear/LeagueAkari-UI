<template>
  <div
    v-if="participant && team"
    class="match-card"
    :class="{
      win: winStyleType === 'win',
      loss: winStyleType === 'loss',
      remake: winStyleType === 'neutral'
    }"
    :style="cardStyle"
  >
    <div class="match-card-inner">
      <div class="champion-block">
        <div class="champion-icon">
          <ChampionIcon :champion-id="participant.championId" class="champ-img" />
          <span class="champion-level">{{ participant.level }}</span>
          <div v-if="shouldShowCrown" class="champ-crown">
            <NIcon class="text-orange-600 dark:text-yellow-500 text-xs"><Crown /></NIcon>
          </div>
        </div>
        <div class="spells-row">
          <SummonerSpellDisplay :spell-id="participant.spells[0]" :size="20" />
          <SummonerSpellDisplay :spell-id="participant.spells[1]" :size="20" />
        </div>
        <div v-if="displayParts.runes && perks" class="runes-row">
          <PerkDisplay :perk-id="perks.primaryPerkId" :size="16" />
          <PerkstyleDisplay :perkstyle-id="perks.subPerkStyleId" :size="16" />
        </div>
        <div v-if="displayParts.augments" class="augments-row">
          <AugmentDisplay v-for="aug in participant.augments" :key="aug" :augment-id="aug" :size="20" />
        </div>
      </div>

      <div class="match-info">
        <div class="match-header">
          <div class="summoner-name">
            <span v-if="!hidePrivacy && participant.gameName" class="sname-text">{{ participant.gameName }}</span>
            <span v-else class="sname-text">{{ resources.champions.name(participant.championId) }}</span>
            <span class="result-badge">{{ resultLabel }}</span>
          </div>
          <div class="result-meta">
            <span>{{ resources.queues.name(basicInfo.queueId) }}</span>
            <span class="sep">·</span>
            <span>{{ formatSeconds(basicInfo.gameDuration) }}</span>
            <span class="sep">·</span>
            <span>{{ formattedRelativeTime }}</span>
          </div>
        </div>

        <div class="kda-stats-row">
          <div class="kda-numbers">
            <span class="kills">{{ participant.kills }}</span>
            <span class="sep">/</span>
            <span class="deaths">{{ participant.deaths }}</span>
            <span class="sep">/</span>
            <span class="assists">{{ participant.assists }}</span>
          </div>
          <span class="kda-ratio">
            {{
              participant.deaths === 0 && (participant.kills > 0 || participant.assists > 0)
                ? t('matchCard.overview.perfect')
                : participant.kda.toFixed(1) + ' KDA'
            }}
          </span>
          <div class="stats-mini">
          <div class="stat-item">
            <span class="stat-value">{{ formatExtremeNumber(participant.cs) }}</span>
            <span class="stat-label">CS</span>
            <span v-if="displayParts.cs" class="stat-sub">({{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }}/m)</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatExtremeNumber(participant.totalDamageDealtToChampions) }}</span>
            <span class="stat-label">DMG</span>
          </div>
          <div class="stat-item dmg-bar-item">
            <span class="stat-label">DMG Share</span>
            <div class="dmg-bar">
              <div
                class="dmg-bar-fill"
                :style="{ width: dmgSharePct + '%' }"
              />
            </div>
            <span class="stat-value dmg-pct">{{ dmgSharePct }}%</span>
          </div>
        </div>

        </div>

        <div class="items-row" style="margin-top: 2px">
          <ItemDisplay
            v-for="item of participant.items.slice(0, 6)"
            :key="item"
            :item-id="item"
            :size="28"
          />
          <ItemDisplay v-if="participant.items[6]" :item-id="participant.items[6]" :size="18" is-trinket />
        </div>

        <div v-if="basicInfo.isTwoTeam" class="players-section">
          <div class="teammates-row" v-if="teammateChips.length">
            <div
              v-for="t in teammateChips"
              :key="t.puuid"
              class="teammate-chip chip-ally"
              @click="navigateToSummonerByPuuid(t.puuid)"
              @mousedown="handleMouseDown"
              @mouseup="handleMouseUp($event, t.puuid)"
            >
              <ChampionIcon :champion-id="t.championId" class="chip-champ" />
              <span class="chip-name" :class="{ 'chip-self': t.puuid === puuid }">
                {{ hidePrivacy ? resources.champions.name(t.championId) : t.gameName }}
              </span>
            </div>
          </div>
          <div class="teammates-row" v-if="enemyChips.length">
            <div
              v-for="e in enemyChips"
              :key="e.puuid"
              class="teammate-chip chip-enemy"
              @click="navigateToSummonerByPuuid(e.puuid)"
              @mousedown="handleMouseDown"
              @mouseup="handleMouseUp($event, e.puuid)"
            >
              <ChampionIcon :champion-id="e.championId" class="chip-champ" />
              <span class="chip-name">{{ hidePrivacy ? resources.champions.name(e.championId) : e.gameName }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="basicInfo.isCherrySubteam" class="teammates-row">
          <template v-for="team of cherryTeams" :key="team[0].teamIdentifier">
            <div
              v-for="player in team"
              :key="player.puuid"
              class="teammate-chip"
              @click="navigateToSummonerByPuuid(player.puuid)"
              @mousedown="handleMouseDown"
              @mouseup="handleMouseUp($event, player.puuid)"
            >
              <span class="cherry-pl">{{ player.subteamPlacement }}</span>
              <ChampionIcon :champion-id="player.championId" class="chip-champ" />
              <span class="chip-name">{{ hidePrivacy ? resources.champions.name(player.championId) : player.gameName }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="match-card-footer" @click="$emit('toggle-expand')">
      <button class="expand-btn" :class="{ active: isExpanded }">
        {{ isExpanded ? 'Hide Details' : 'Details' }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { EMPTY_PUUID } from '@shared/constants/common'
import { getCherryWinningTeamCount } from '@shared/data-adapter/match-history/cherry'
import { Crown, Robot } from '@vicons/fa'
import { ArrowBackIosFilled } from '@vicons/material'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed, ref, toValue } from 'vue'

import { useMatchCard } from './context'
import { useGameResultName } from './utils/text'
import { useWinResultStyleType } from './utils/theme'
import { formatSeconds } from './utils/time'

defineEmits<{
  'toggle-expand': []
}>()

const {
  puuid,
  basicInfo,
  teams,
  participants,
  isExpanded,
  hidePrivacy,
  matchCardOpacity,
  navigateToSummonerByPuuid
} = useMatchCard()

const cardStyle = computed(() => ({
  '--mc-bg-opacity': toValue(matchCardOpacity)
}))

const { formatExtremeNumber } = useNumberFormatter()
const gameResultName = useGameResultName()
const resources = useAkariResourceProvider()
const { t } = useTranslation()

const participant = computed(() => {
  return participants.value.find((s) => s.puuid === puuid.value)
})

const team = computed(() => {
  if (!participant.value) return null
  return teams.value.teamStatMap[participant.value.teamIdentifier]
})

const perks = computed(() => {
  if (!participant.value) return null
  const { styles } = participant.value.perks
  const primaryStyle = styles[0]
  const subStyle = styles[1]
  if (!primaryStyle || !subStyle || !primaryStyle.selections[0]?.perk || !subStyle.style) return null
  return {
    primaryPerkId: primaryStyle.selections[0].perk,
    subPerkStyleId: subStyle.style
  }
})

const displayParts = computed(() => ({
  spells: true,
  augments: basicInfo.value.gameMode === 'CHERRY' || basicInfo.value.gameMode === 'KIWI',
  runes: basicInfo.value.gameMode !== 'CHERRY' && basicInfo.value.gameMode !== 'KIWI',
  items: true,
  cs: basicInfo.value.gameMode === 'CLASSIC'
}))

const winStyleType = useWinResultStyleType()

const resultLabel = computed(() => {
  const r = gameResultName(
    team.value?.subteamPlacement ?? null,
    team.value?.winResult ?? 'remake',
    team.value?.isSurrender ?? false,
    resources.runtime.locale
  )
  return r
})

const dmgSharePct = computed(() => {
  if (!participant.value || !team.value) return 0
  const teamDmg = teams.value.teamStatMap[participant.value.teamIdentifier]?.totalDamageDealtToChampions
  if (!teamDmg) return 0
  return Math.min(100, Math.round((participant.value.totalDamageDealtToChampions / teamDmg) * 100))
})

const teammateChips = computed(() => {
  if (!basicInfo.value.isTwoTeam || !participant.value) return []
  return participants.value
    .filter((p) => p.teamIdentifier === participant.value!.teamIdentifier && p.puuid !== puuid.value)
    .slice(0, 4)
})

const enemyChips = computed(() => {
  if (!basicInfo.value.isTwoTeam || !participant.value) return []
  const enemyId = teams.value.teamStatsArr.find(
    (t) => t.teamIdentifier !== participant.value!.teamIdentifier
  )?.teamIdentifier
  if (!enemyId) return []
  return participants.value
    .filter((p) => p.teamIdentifier === enemyId)
    .slice(0, 5)
})

const cherryTeams = computed(() => {
  if (!basicInfo.value.isCherrySubteam) return []
  const teamIdentifiers = teams.value.teamStatsArr
    .toSorted((a, b) => a.subteamPlacement - b.subteamPlacement)
    .map((t) => t.teamIdentifier)
  return teamIdentifiers.map((i) =>
    participants.value
      .filter((s) => s.teamIdentifier === i)
      .toSorted((a, b) => a.participantId - b.participantId)
  )
})

const shouldShowCrown = computed(() => participant.value?.subteamPlacement === 1)

const formattedRelativeTime = ref('')

useIntervalFn(
  () => {
    const date = dayjs(basicInfo.value.gameCreation).locale(resources.runtime.locale.toLowerCase())
    if (dayjs().diff(date, 'day', true) > 3) {
      formattedRelativeTime.value = date.format('YYYY-MM-DD HH:mm')
    } else {
      formattedRelativeTime.value = date.fromNow()
    }
  },
  60000,
  { immediateCallback: true, immediate: true }
)

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) event.preventDefault()
}

const handleMouseUp = (event: MouseEvent, tPuuid: string) => {
  if (event.button === 1) navigateToSummonerByPuuid(tPuuid, false)
}
</script>

<style scoped>
@import './match-card.css';
</style>
