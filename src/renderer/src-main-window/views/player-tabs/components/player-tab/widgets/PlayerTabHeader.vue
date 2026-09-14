<template>
  <div class="flex items-center justify-between gap-4">
    <!-- name & something (Left) -->
    <div class="flex h-16 min-w-0 flex-1 basis-0 items-center">
      <!-- profile icon / summoner level -->
      <div class="relative size-14 shrink-0">
        <LcuImage
          class="size-full rounded-full ring-2 ring-purple-500/20"
          :src="summoner ? profileIconUri(summoner.profileIconId) : undefined"
        />
        <div
          v-if="summoner"
          class="absolute -right-1 -bottom-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {{ summoner.level }}
        </div>
      </div>

      <!-- name & tag -->
      <StreamerModeMaskedText>
        <template #masked>
          <div class="ml-3 flex min-w-0 flex-col justify-center">
            <span class="truncate text-lg leading-tight font-bold text-black dark:text-white">{{
              maskedName
            }}</span>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ maskedTagLine }}
            </div>
          </div>
        </template>
        <div class="ml-3 flex min-w-0 flex-col justify-center">
          <CopyableText
            class="truncate text-lg leading-tight font-bold text-black dark:text-white"
            :text="summoner ? `${summoner.gameName}#${summoner.tagLine}` : '—'"
          >
            {{ summoner?.gameName || '—' }}
          </CopyableText>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ summoner ? `#${summoner.tagLine}` : '—' }}
          </div>
        </div>
      </StreamerModeMaskedText>
    </div>

    <!-- ranked (Center) -->
    <div class="flex shrink-0 items-center justify-center">
      <RankedPane />
    </div>

    <!-- buttons (Right) -->
    <div class="flex flex-1 basis-0 items-center justify-end gap-1.5">
      <!-- tag edit -->
      <NPopover
        v-if="!isSelfTab && !isCrossRegion"
        v-model:show="isTagEditPopoverShowing"
        trigger="click"
        placement="bottom-end"
      >
        <template #trigger>
          <NButton secondary size="small" circle>
            <template #icon>
              <NIcon><Edit20Filled /></NIcon>
            </template>
          </NButton>
        </template>

        <PlayerTagEditPanel
          :puuid="puuid"
          :summoner="summoner"
          @cancel="isTagEditPopoverShowing = false"
          @saved="handleTagSaved"
        />
      </NPopover>

      <!-- refresh -->
      <NButton secondary size="small" circle :loading="isSomethingLoading" @click="refresh">
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { PlayerTagEditPanel } from '@renderer-shared/components/player-tag-edit'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { Edit20Filled } from '@vicons/fluent'
import { RefreshSharp } from '@vicons/ionicons5'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useSummoner } from '../data/summoner'
import { useTags } from '../data/tags'
import { useRefresh } from '../utils/refresh'
import RankedPane from './RankedPane.vue'

const { puuid, isSelfTab, isCrossRegion } = usePlayerTab()
const { summoner } = useSummoner()
const { loadTags } = useTags()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const { refresh, isSomethingLoading } = useRefresh()

const isTagEditPopoverShowing = ref(false)

const maskedName = computed(() => {
  const seed = summoner.value?.gameName || summoner.value?.puuid || puuid.value
  return streamerSummonerName(seed, 0)
})

const maskedTagLine = computed(() => masked(summoner.value?.tagLine || '—', '#####'))

const handleTagSaved = async () => {
  isTagEditPopoverShowing.value = false
  await loadTags()
}
</script>
