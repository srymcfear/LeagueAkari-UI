<template>
  <div ref="playerTabRootEl" class="relative h-full">
    <NScrollbar x-scrollable :theme-overrides="{ width: '8px' }" ref="scrollbarEl">
      <div ref="layoutContainerEl" class="@container w-full">
        <div
          class="mx-auto w-full max-w-[760px] px-3 pt-4 pb-6 @[1100px]:max-w-[1260px] @[1280px]:px-5"
        >
          <PlayerTabHeader class="mb-4 min-h-[90px]" />

          <div class="box-border">
            <div ref="stickySentinelEl" class="h-0 w-full"></div>

            <div
              class="grid grid-cols-1 items-start gap-2.5 transition-all"
              :style="{ gridTemplateColumns: gridTemplateColumns }"
            >
              <!-- Cột Bên Trái: Chế độ , Tổng quan , Đồng đội - đối thủ gần đây -->
              <StickyBox v-if="!isCompactLayout" class="w-full" :offset-top="8" :offset-bottom="8">
                <!-- Collapsed State: Slim Rail -->
                <div
                  v-if="isCol2Collapsed"
                  class="group flex min-h-[180px] cursor-pointer flex-col items-center rounded-lg border border-black/5 bg-black/5 px-1 py-3 transition-all select-none hover:border-purple-500/40 dark:border-white/5 dark:bg-white/5"
                  @click="isCol2Collapsed = false"
                >
                  <NTooltip placement="right">
                    <template #trigger>
                      <div
                        class="mb-3 flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-600 transition-all group-hover:bg-purple-500/30 group-hover:text-purple-700 dark:text-purple-300 dark:group-hover:text-purple-200"
                      >
                        <NIcon size="14"><ChevronRight20Regular /></NIcon>
                      </div>
                    </template>
                    Mở rộng Tổng quan & Chế độ
                  </NTooltip>
                  <div
                    class="text-[10px] font-bold tracking-widest text-neutral-400 uppercase transition-colors select-none group-hover:text-neutral-800 dark:text-white/40 dark:group-hover:text-white/90"
                    style="writing-mode: vertical-rl; text-orientation: mixed"
                  >
                    TỔNG QUAN
                  </div>
                </div>

                <!-- Expanded State -->
                <div v-else class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between px-1">
                    <span
                      class="text-[10px] font-bold tracking-wider text-purple-700 uppercase dark:text-purple-400/80"
                    >
                      Tổng quan & Chế độ
                    </span>
                    <NTooltip placement="left">
                      <template #trigger>
                        <button
                          type="button"
                          class="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-800 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                          @click="isCol2Collapsed = true"
                        >
                          <NIcon size="13"><ChevronLeft20Regular /></NIcon>
                        </button>
                      </template>
                      Thu gọn (Ẩn)
                    </NTooltip>
                  </div>
                  <PlayerTabCol2 />
                </div>
              </StickyBox>

              <!-- Cột Ở Giữa: List lịch sử đấu -->
              <div class="min-w-0">
                <div
                  v-if="isCompactLayout || isCol2Collapsed"
                  class="sticky top-2 z-10 mb-2 flex min-w-0 items-start gap-2"
                >
                  <NTooltip v-if="isCompactLayout" placement="bottom-start">
                    <template #trigger>
                      <NButton
                        class="shrink-0"
                        size="small"
                        secondary
                        circle
                        :focusable="false"
                        :aria-label="t('playerTabs.matchHistory.sidebar.open')"
                        @click="showSidebarDrawer = true"
                      >
                        <template #icon>
                          <NIcon><PanelLeftExpand20Regular /></NIcon>
                        </template>
                      </NButton>
                    </template>
                    {{ t('playerTabs.matchHistory.sidebar.open') }}
                  </NTooltip>

                  <MatchHistoryPagination
                    class="min-w-0 flex-1"
                    :is-floating="!frozenSentinelVisible"
                  />
                </div>

                <MatchHistoryList />
              </div>

              <!-- Cột Bên Phải: Vật phẩm , Thành thạo tướng -->
              <StickyBox v-if="!isCompactLayout" class="w-full" :offset-top="8" :offset-bottom="8">
                <!-- Collapsed State: Slim Rail -->
                <div
                  v-if="isCol1Collapsed"
                  class="group flex min-h-[180px] cursor-pointer flex-col items-center rounded-lg border border-black/5 bg-black/5 px-1 py-3 transition-all select-none hover:border-purple-500/40 dark:border-white/5 dark:bg-white/5"
                  @click="isCol1Collapsed = false"
                >
                  <NTooltip placement="left">
                    <template #trigger>
                      <div
                        class="mb-3 flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-600 transition-all group-hover:bg-purple-500/30 group-hover:text-purple-700 dark:text-purple-300 dark:group-hover:text-purple-200"
                      >
                        <NIcon size="14"><ChevronLeft20Regular /></NIcon>
                      </div>
                    </template>
                    Mở rộng Vật phẩm & Tướng
                  </NTooltip>
                  <div
                    class="text-[10px] font-bold tracking-widest text-neutral-400 uppercase transition-colors select-none group-hover:text-neutral-800 dark:text-white/40 dark:group-hover:text-white/90"
                    style="writing-mode: vertical-rl; text-orientation: mixed"
                  >
                    VẬT PHẨM
                  </div>
                </div>

                <!-- Expanded State -->
                <div v-else class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between px-1">
                    <span
                      class="text-[10px] font-bold tracking-wider text-purple-700 uppercase dark:text-purple-400/80"
                    >
                      Vật phẩm & Tướng
                    </span>
                    <NTooltip placement="right">
                      <template #trigger>
                        <button
                          type="button"
                          class="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-800 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                          @click="isCol1Collapsed = true"
                        >
                          <NIcon size="13"><ChevronRight20Regular /></NIcon>
                        </button>
                      </template>
                      Thu gọn (Ẩn)
                    </NTooltip>
                  </div>
                  <PlayerTabCol1 />
                </div>
              </StickyBox>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>

    <CollectModeProgress />

    <NDrawer
      v-if="isCompactLayout"
      v-model:show="showSidebarDrawer"
      :to="playerTabRootEl ?? undefined"
      width="min(320px, calc(100% - 32px))"
      placement="left"
      class="bg-neutral-900/90! backdrop-blur-xl"
    >
      <NDrawerContent :native-scrollbar="false" body-content-style="padding: 8px">
        <PlayerTabSidebarContent />
      </NDrawerContent>
    </NDrawer>

    <div
      :class="{
        'pointer-events-auto opacity-80': shouldShowScrollToTopButton,
        'pointer-events-none opacity-0': !shouldShowScrollToTopButton
      }"
      class="absolute! right-8 bottom-8 z-10 transition-opacity hover:opacity-100"
    >
      <NButton size="large" type="primary" circle :focusable="false" @click="scrollToTop">
        <NIcon>
          <ArrowUp20Regular />
        </NIcon>
      </NButton>
    </div>

    <ConnectedMatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
      :details="previewingGame.details"
      :hide-privacy="as.settings.streamerMode"
      :can-dry-run-ongoing-game="canDryRunOngoingGame"
      @navigate-to-summoner-by-puuid="(puuid) => navigateToTabByPuuid(puuid)"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
    />

    <!-- 这个组件不会生成 DOM，但用来保证全局状态同步 -->
    <GlobalStateTracker />
  </div>
</template>

<script setup lang="ts">
import ConnectedMatchPreviewer from '@renderer-shared/components/match-preview/ConnectedMatchPreviewer.vue'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import StickyBox from '@renderer-shared/components/sticky-box/StickyBox.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { DraftOptions } from '@shared/shards/ongoing-game'
import {
  ArrowUp20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  PanelLeftExpand20Regular
} from '@vicons/fluent'
import { useElementSize, useElementVisibility, useStorage, useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NDrawer, NDrawerContent, NIcon, NScrollbar, NTooltip } from 'naive-ui'
import { computed, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import GlobalStateTracker from './GlobalStateTracker'
import { PLAYER_TAB_WIDE_MIN_WIDTH } from './constants'
import { providePlayerTab } from './context'
import { useFreezeValue } from './utils/freeze'
import MatchHistoryList from './widgets/MatchHistoryList.vue'
import { provideMatchHistoryCardViewport } from './widgets/match-history-card'
import MatchHistoryPagination from './widgets/match-history-pagination'
import PlayerTabHeader from './widgets/PlayerTabHeader.vue'
import CollectModeProgress from './widgets/match-history-filters/CollectModeProgress.vue'
import PlayerTabSidebarContent from './PlayerTabSidebarContent.vue'
import PlayerTabCol1 from './widgets/PlayerTabCol1.vue'
import PlayerTabCol2 from './widgets/PlayerTabCol2.vue'

const { id, puuid, sgpServerId } = defineProps<{
  id: string
  puuid: string
  sgpServerId: string
}>()

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)
const router = useRouter()
const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()
const pts = usePlayerTabsStore()
const sgps = useSgpStore()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const playerTabRootEl = useTemplateRef('playerTabRootEl')
const layoutContainerEl = useTemplateRef('layoutContainerEl')
const { width: layoutWidth } = useElementSize(layoutContainerEl)
const isCompactLayout = computed(() => layoutWidth.value < PLAYER_TAB_WIDE_MIN_WIDTH)
const showSidebarDrawer = ref(false)

const isCol1Collapsed = useStorage('league-akari:player-tab:col1-collapsed', false)
const isCol2Collapsed = useStorage('league-akari:player-tab:col2-collapsed', false)

const gridTemplateColumns = computed(() => {
  if (isCompactLayout.value) {
    return '1fr'
  }
  const isWide = layoutWidth.value >= 1360
  const colLeft = isCol2Collapsed.value ? '36px' : isWide ? '225px' : '210px'
  const colRight = isCol1Collapsed.value ? '36px' : isWide ? '205px' : '190px'
  return `${colLeft} minmax(0, 1fr) ${colRight}`
})

const isCurrentTab = computed(() => {
  return pts.currentTabId === id
})

const isActivated = useActivated()

const isInvisible = computed(() => {
  return !isCurrentTab.value || !isActivated.value
})

provideMatchHistoryCardViewport({
  active: () => !isInvisible.value
})

const scrollbarEl = useTemplateRef('scrollbarEl')
const stickySentinelEl = useTemplateRef('stickySentinelEl')
const isSentinelVisible = useElementVisibility(stickySentinelEl, {
  initialValue: true
})

const {
  value: frozenSentinelVisible,
  freeze: freezeSentinel,
  unfreeze: unfreezeSentinel
} = useFreezeValue(isSentinelVisible)

const shouldShowScrollToTopButton = computed(() => !frozenSentinelVisible.value)

const showPreviewModal = ref(false)
const previewingGame = shallowRef<MatchPreviewState>({
  gameId: 0,
  source: 'sgp'
})

const handlePreviewGame = (payload: MatchPreviewPayload) => {
  previewingGame.value = toMatchPreviewState(
    payload,
    as.settings.preferredLolSource,
    lcs.summoner.me?.puuid
  )
  showPreviewModal.value = true
}

// The analysis draft relies on local-region data loaded by ongoing-game.
const canDryRunOngoingGame = computed(() => sgpServerId === sgps.availability.sgpServerId)

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  if (!canDryRunOngoingGame.value) {
    return
  }

  await og.setDraft(draft)
  await router.replace({ name: 'ongoing-game' })
}

const scrollToTop = () => {
  scrollbarEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 一个粗糙的解决闪烁问题的方式
// 我们假设浏览器在 50ms 内可以完成异步的 intersection observer 的回调
const { start, stop } = useTimeoutFn(() => {
  unfreezeSentinel()
}, 50)

watchEffect(() => {
  if (isInvisible.value) {
    stop()
    freezeSentinel()
  } else {
    start()
  }
})

watchEffect(() => {
  if (isInvisible.value || !isCompactLayout.value) {
    showSidebarDrawer.value = false
  }
})

providePlayerTab({
  id: () => id,
  puuid: () => puuid,
  sgpServerId: () => sgpServerId,
  isCurrentTab,
  previewGame: handlePreviewGame
})
</script>
