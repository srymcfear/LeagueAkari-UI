<template>
  <div
    class="app-frame"
    :class="{
      mica: preferMica,
      'use-plain-bg': !backgroundImageUrl
    }"
  >
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <MainWindowCloseConfirmModal />

    <SetupInAppScope />

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

    <!--transition background profile skin -->
    <Transition name="bg-fade">
      <div
        v-if="backgroundImageUrl && !preferMica"
        :key="backgroundImageUrl"
        class="background-wallpaper"
        :class="{
          'no-image': !backgroundImageUrl
        }"
        :style="{
          backgroundImage: `url('${backgroundImageUrl}')`
        }"
      ></div>
    </Transition>

    <!-- watermark -->
    <div v-if="as.isRabiVersion" class="version-watermark">
      {{ t('appName', { ns: 'common' }) }} {{ as.version }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { greeting } from '@renderer-shared/utils/greeting'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { onBeforeUnmount, ref, useTemplateRef, watchEffect } from 'vue'

import BottomNavBar from './components/BottomNavBar.vue'

import MainWindowCloseConfirmModal from './components/MainWindowCloseConfirmModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import MainWindowTitlebar from './components/titlebar/MainWindowTitlebar.vue'
import { useDynamicWallpaperTone } from './composables/useDynamicWallpaperTone'
import { useMicaAvailability } from './composables/useMicaAvailability'
import { provideMainWindowAppContext } from './context'
import { MainWindowUiRenderer } from './shards/main-window-ui'

const mui = useInstance(MainWindowUiRenderer)

const app = useInstance(AppCommonRenderer)
const as = useAppCommonStore()

const { t } = useTranslation()

greeting(as.version)

const contentEl = useTemplateRef('contentEl')
const { width, height } = useElementSize(contentEl)

provideMainWindowAppContext({
  contentWidth: width,
  contentHeight: height,
  openSettingsModal: (tabName?: string) => {
    isShowingSettingModal.value = true
    if (tabName) {
      settingModelTab.value = tabName
    }
  }
})

const isShowingSettingModal = ref(false)
const settingModelTab = ref('basic')

const preferMica = useMicaAvailability()
const backgroundImageUrl = mui.usePreferredBackgroundImageUrl()

useDynamicWallpaperTone(backgroundImageUrl)

const toggleMicaClass = (enabled: boolean) => {
  document.documentElement.classList.toggle('mica-enabled', enabled)
  document.body.classList.toggle('mica-enabled', enabled)
}

watchEffect(() => {
  toggleMicaClass(preferMica.value)
})

onBeforeUnmount(() => {
  toggleMicaClass(false)
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

  &.use-plain-bg:not(.mica) {
    background-color: var(--la-background-color-primary);
  }

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

.background-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    background: linear-gradient(
      180deg,
      rgba(243, 243, 244, 0.9) 0%,
      rgba(243, 243, 244, 0.95) 75%,
      rgba(243, 243, 244, 0.95) 100%
    );
  }

  &.no-image::before {
    background: none;
  }

  [data-theme='dark'] &::before {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.88) 0%,
      rgba(0, 0, 0, 0.92) 75%,
      rgba(0, 0, 0, 0.92) 100%
    );
  }

  [data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) &::before {
    background: linear-gradient(
      180deg,
      var(--la-wallpaper-overlay-start) 0%,
      var(--la-wallpaper-overlay-mid) 72%,
      var(--la-wallpaper-overlay-end) 100%
    );
  }
}

.app-background {
  position: relative;
  height: 100%;
  display: flex;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);

  &.use-plain-bg:not(.mica) {
    background-color: var(--la-background-color-primary);
  }
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 0.3s;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

.bg-fade-enter-to,
.bg-fade-leave-from {
  opacity: 1;
}
</style>
