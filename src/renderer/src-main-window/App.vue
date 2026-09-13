<template>
  <div class="app-frame">
    <SettingsModal
      ref="settingsModal"
      v-model:show="isShowingSettingModal"
      v-model:tab-name="settingModelTab"
      v-model:storage-tab-name="storageSettingsTab"
    />
    <SearchPane
      v-model:show="isShowingSearchPane"
      v-model:page="searchPanePage"
      @navigate-to-summoner="handleSummonerSearchNavigate"
      @navigate-to-setting="handleSettingsSearchNavigate"
    />
    <MainWindowCloseConfirmModal />

    <SetupInAppScope />
    <MainWindowBackground />

    <div class="app-frame__center">
      <MainWindowTitlebar />

      <div class="app-frame__center-content" ref="contentEl">
        <RouterView v-slot="{ Component }">
          <Transition name="fade">
            <KeepAlive>
              <component :is="Component" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </div>

      <BottomNavBar />
    </div>

    <!-- watermark -->
    <div v-if="as.isRabiVersion" class="version-watermark">
      {{ t('appName', { ns: 'common' }) }} {{ as.version }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import {
  useAkariNavigation,
  useAkariNavigationStep
} from '@renderer-shared/shards/akari-navigation'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { greeting } from '@renderer-shared/utils/greeting'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

import BottomNavBar from './components/BottomNavBar.vue'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

import { SearchPane, type SearchPanePage } from './components/search-pane'
import MainWindowCloseConfirmModal from './components/MainWindowCloseConfirmModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import type { SettingsTabName } from './components/settings-modal/navigation'
import type { StorageSettingsTabName } from './components/settings-modal/storage-settings/navigation'
import MainWindowTitlebar from './components/titlebar/MainWindowTitlebar.vue'
import { provideMainWindowAppContext } from './context'
import {
  MAIN_WINDOW_NAVIGATION_STEP_KEY,
  type MainWindowNavigationPayload
} from './navigation-steps'
import { type SettingsNavigationTargetId, navigateToSetting } from './settings-navigation'
import MainWindowBackground from './shards/main-window-ui/MainWindowBackground.vue'

const navigation = useAkariNavigation()

const app = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const leagueClient = useLeagueClientStore()
const sgp = useSgpStore()
const playerTabs = useInstance(PlayerTabsRenderer)
const { navigateToTabByPuuidAndSgpServerId } = playerTabs.useNavigateToTab()

const { t } = useTranslation()
const router = useRouter()

greeting(as.version)

const contentEl = useTemplateRef('contentEl')
const { width, height } = useElementSize(contentEl)

const isShowingSettingModal = ref(false)
const isShowingSearchPane = ref(false)
const searchPanePage = ref<SearchPanePage>('settings')
const settingModelTab = ref<SettingsTabName>('basic')
const storageSettingsTab = ref<StorageSettingsTabName>('tagged-players')
const settingsModal = useTemplateRef<InstanceType<typeof SettingsModal>>('settingsModal')

useAkariNavigationStep<MainWindowNavigationPayload>({
  key: MAIN_WINDOW_NAVIGATION_STEP_KEY,
  activate: async (payload, { signal }) => {
    if (payload.surface === 'settings-modal') {
      isShowingSettingModal.value = true
      await nextTick()

      await settingsModal.value!.waitUntilEntered(signal)
      await nextTick()
      return undefined
    }

    isShowingSettingModal.value = false
    await router.replace({
      name: payload.route.name,
      params: { section: payload.route.section }
    })
    if (!signal.aborted) {
      await nextTick()
    }
    return undefined
  }
})

const handleSettingsSearchNavigate = (targetId: SettingsNavigationTargetId) => {
  isShowingSearchPane.value = false
  void navigateToSetting(navigation, targetId)
}

const handleSummonerSearchNavigate = (
  puuid: string,
  sgpServerId: string | null,
  setCurrent = true
) => {
  const targetSgpServerId = sgpServerId || sgp.availability.sgpServerId

  if (setCurrent) {
    isShowingSearchPane.value = false
    navigateToTabByPuuidAndSgpServerId(puuid, targetSgpServerId)
  } else {
    playerTabs.createTab(puuid, targetSgpServerId, { setCurrent: false })
  }
}

const openSearchPane = (page?: SearchPanePage) => {
  if (page) {
    searchPanePage.value = page
  } else if (!isShowingSearchPane.value) {
    searchPanePage.value = leagueClient.isConnected ? 'summoner' : 'settings'
  }

  isShowingSearchPane.value = true
}

provideMainWindowAppContext({
  contentWidth: width,
  contentHeight: height,
  openSearch: openSearchPane,
  openSettingsModal: () => {
    isShowingSettingModal.value = true
  }
})

app.onApplicationMenuAboutClick(() => {
  isShowingSettingModal.value = true
  settingModelTab.value = 'about'
})

app.onApplicationMenuSettingsClick(() => {
  isShowingSettingModal.value = true
  settingModelTab.value = 'basic'
})
</script>

<style scoped>
.app-frame {
  position: relative;
  height: 100%;
  display: flex;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);
  isolation: isolate;

  .app-frame__center {
    display: flex;
    flex-direction: column;
    z-index: 5;
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .app-frame__center-content {
      height: 0;
      flex: 1;
      overflow: hidden;

      [data-theme-id='neon'] & {
        padding: 0 20px 20px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(139, 74, 255, 0.3) transparent;

        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background: rgba(139, 74, 255, 0.3);
          border-radius: 4px;
        }
        &::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 74, 255, 0.5);
        }
      }
    }

    [data-theme-id='neon'] &::before {
      content: '';
      position: fixed;
      top: -30%;
      right: -15%;
      width: 70%;
      height: 80%;
      pointer-events: none;
      z-index: 0;
      background: radial-gradient(ellipse at center, rgba(139, 74, 255, 0.12) 0%, transparent 70%);
    }

    [data-theme-id='neon'] &::after {
      content: '';
      position: fixed;
      bottom: -20%;
      left: -10%;
      width: 50%;
      height: 60%;
      pointer-events: none;
      z-index: 0;
      background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.08) 0%, transparent 70%);
    }
  }

  .version-watermark {
    position: absolute;
    bottom: 8px;
    right: 16px;
    z-index: 10;
    font-size: 12px;
    opacity: 0.4;
    pointer-events: none;
  }
}
</style>
