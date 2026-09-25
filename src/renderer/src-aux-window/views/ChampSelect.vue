<template>
  <NScrollbar class="box-border px-3 py-2">
    <!-- Current Champion Header -->
    <div
      class="mb-2 flex min-h-12 items-center gap-2 rounded border border-black/10 bg-black/5 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5"
    >
      <ChampionIcon
        class="size-9 shrink-0 rounded-full border border-black/10 dark:border-white/10"
        :champion-id="currentChampionId"
      />
      <div class="min-w-0 flex-1">
        <div class="truncate text-xs font-bold text-black/90 dark:text-white/90">
          {{ currentChampionName }}
        </div>
        <div class="text-[10px] text-black/55 dark:text-white/55">
          {{ t('opgg.champSelectAssistant.status', 'Trợ thủ chọn tướng') }}
        </div>
      </div>
      <NTag size="tiny" :bordered="false" type="info">
        {{ t('opgg.champSelectAssistant.active', 'Đang diễn ra') }}
      </NTag>
    </div>

    <!-- ARAM Mayhem Guide Quick Access Banner -->
    <div
      v-if="isAramMayhem && currentChampionId > 0"
      class="mb-2 flex cursor-pointer items-center justify-between gap-1.5 rounded border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2.5 py-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all hover:bg-[#00f0ff]/20"
      @click="switchToAramGuideTab"
    >
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="text-xs text-[#00f0ff]">⚡</span>
        <div class="truncate text-[10.5px] font-bold text-[#38bdf8]">
          ARAM Hỗn Loạn: Xem mẹo tối ưu tướng & Lõi
        </div>
      </div>
      <span class="shrink-0 text-[9.5px] font-bold text-[#00f0ff]">Chi tiết ▸</span>
    </div>

    <BenchChampionsMini style="margin-bottom: 4px" />
    <ChampSelectActions style="margin-bottom: 4px" />
    <AutomationPlan style="margin-bottom: 4px" />
    <SkinSelectionMini style="margin-bottom: 4px" />
    <ChampSelectOperations />
  </NScrollbar>
</template>

<script setup lang="ts">
import {
  AutomationPlan,
  BenchChampionsMini,
  ChampSelectActions,
  ChampSelectOperations,
  SkinSelectionMini
} from '@renderer-shared/components/champ-select-assistant'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, NTag } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()
const leagueClientStore = useLeagueClientStore()
const resources = useAkariResourceProvider()

const currentChampionId = computed(() => leagueClientStore.champSelect.currentChampion ?? -1)
const currentChampionName = computed(() => {
  if (currentChampionId.value <= 0) {
    return t('opgg.champSelectAssistant.waitingForChampion', 'Đang chờ chọn tướng')
  }

  return resources.champions.name(currentChampionId.value)
})

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

  return isKiwi || isAram
})

function switchToAramGuideTab() {
  try {
    const channel = new BroadcastChannel('akari-aux-window-nav')
    channel.postMessage({ tab: 'radar' })
    channel.close()
  } catch {
    // ignore
  }
}
</script>
