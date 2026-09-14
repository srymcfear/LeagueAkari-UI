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
      <!-- 1. Meta Column: Mode, Result, Duration, Time -->
      <div class="meta-col">
        <div class="meta-queue" :title="resources.queues.name(basicInfo.queueId)">
          {{ resources.queues.name(basicInfo.queueId) }}
        </div>
        <div class="meta-time">{{ formattedRelativeTime }}</div>
        <div class="meta-result" :class="winStyleType">{{ resultLabel }}</div>
        <div class="meta-duration">{{ formatSeconds(basicInfo.gameDuration) }}</div>
      </div>

      <!-- 2. Champion Column: Icon + Spells & Runes -->
      <div class="champion-col">
        <div class="champion-icon">
          <ChampionIcon :champion-id="participant.championId" class="champ-img" />
          <span class="champion-level">{{ participant.level }}</span>
          <div v-if="shouldShowCrown" class="champ-crown">
            <NIcon class="text-xs text-orange-500"><Crown /></NIcon>
          </div>
        </div>
        <div class="spells-runes-wrap">
          <div class="spells-col">
            <SummonerSpellDisplay :spell-id="participant.spells[0]" :size="16" />
            <SummonerSpellDisplay :spell-id="participant.spells[1]" :size="16" />
          </div>
          <div v-if="displayParts.runes && perks" class="runes-col">
            <PerkDisplay :perk-id="perks.primaryPerkId" :size="15" />
            <PerkstyleDisplay :perkstyle-id="perks.subPerkStyleId" :size="15" />
          </div>
          <div v-if="displayParts.augments" class="augments-col">
            <AugmentDisplay
              v-for="aug in participant.augments.slice(0, 4)"
              :key="aug"
              :augment-id="aug"
              :size="15"
            />
          </div>
        </div>
      </div>

      <!-- 3. KDA & Items Column -->
      <div class="kda-items-col">
        <div class="kda-header">
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
        </div>
        <div class="items-row">
          <ItemDisplay
            v-for="item of participant.items.slice(0, 6)"
            :key="item"
            :item-id="item"
            :size="20"
          />
          <ItemDisplay
            v-if="participant.items[6]"
            :item-id="participant.items[6]"
            :size="16"
            is-trinket
          />
        </div>
      </div>

      <!-- 4. Stats Column (Damage + CS) -->
      <div class="stats-col">
        <div class="stat-line">
          <span class="stat-label">Sát thương</span>
          <span class="stat-value">{{
            formatExtremeNumber(participant.totalDamageDealtToChampions)
          }}</span>
        </div>
        <div class="dmg-bar-wrap">
          <div class="dmg-bar">
            <div class="dmg-bar-fill" :style="{ width: dmgSharePct + '%' }" />
          </div>
          <span class="dmg-pct">{{ dmgSharePct }}%</span>
        </div>
        <div class="stat-line">
          <span class="stat-label">Chỉ số lính</span>
          <span class="stat-value">
            {{ formatExtremeNumber(participant.cs) }}
            <span v-if="displayParts.cs" class="stat-sub"
              >({{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }})</span
            >
          </span>
        </div>
      </div>

      <!-- 5. Players Column (5 allies on left, 5 enemies on right) -->
      <div v-if="basicInfo.isTwoTeam" class="players-col">
        <div class="players-team">
          <div
            v-for="p in allyTeamPlayers"
            :key="p.puuid"
            class="player-item"
            :class="{ 'player-self': p.puuid === puuid }"
            @click="navigateToSummonerByPuuid(p.puuid)"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp($event, p.puuid)"
          >
            <ChampionIcon :champion-id="p.championId" class="player-icon" />
            <span class="player-name">{{
              hidePrivacy ? resources.champions.name(p.championId) : p.gameName
            }}</span>
          </div>
        </div>
        <div class="players-team">
          <div
            v-for="p in enemyTeamPlayers"
            :key="p.puuid"
            class="player-item"
            @click="navigateToSummonerByPuuid(p.puuid)"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp($event, p.puuid)"
          >
            <ChampionIcon :champion-id="p.championId" class="player-icon" />
            <span class="player-name">{{
              hidePrivacy ? resources.champions.name(p.championId) : p.gameName
            }}</span>
          </div>
        </div>
      </div>

      <!-- Cherry Arena Players -->
      <div v-else-if="basicInfo.isCherrySubteam" class="cherry-col">
        <template v-for="team of cherryTeams.slice(0, 4)" :key="team[0].teamIdentifier">
          <div class="cherry-team-row">
            <span class="cherry-rank">{{ team[0].subteamPlacement }}</span>
            <div
              v-for="player in team"
              :key="player.puuid"
              class="player-item"
              @click="navigateToSummonerByPuuid(player.puuid)"
              @mousedown="handleMouseDown"
              @mouseup="handleMouseUp($event, player.puuid)"
            >
              <ChampionIcon :champion-id="player.championId" class="player-icon" />
              <span class="player-name">{{
                hidePrivacy ? resources.champions.name(player.championId) : player.gameName
              }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 6. Expand Action -->
      <div class="action-col" @click="$emit('toggle-expand')">
        <button class="expand-btn-icon" :class="{ active: isExpanded }">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
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
import { Crown } from '@vicons/fa'
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
  if (!primaryStyle || !subStyle || !primaryStyle.selections[0]?.perk || !subStyle.style)
    return null
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
  const teamDmg =
    teams.value.teamStatMap[participant.value.teamIdentifier]?.totalDamageDealtToChampions
  if (!teamDmg) return 0
  return Math.min(100, Math.round((participant.value.totalDamageDealtToChampions / teamDmg) * 100))
})

const allyTeamPlayers = computed(() => {
  if (!basicInfo.value.isTwoTeam || !participant.value) return []
  return participants.value
    .filter((p) => p.teamIdentifier === participant.value!.teamIdentifier)
    .slice(0, 5)
})

const enemyTeamPlayers = computed(() => {
  if (!basicInfo.value.isTwoTeam || !participant.value) return []
  const enemyId = teams.value.teamStatsArr.find(
    (t) => t.teamIdentifier !== participant.value!.teamIdentifier
  )?.teamIdentifier
  if (!enemyId) return []
  return participants.value.filter((p) => p.teamIdentifier === enemyId).slice(0, 5)
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
