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
</script>
