<template>
  <nav class="bottom-nav" :class="{ blurred: mws.focus === 'blurred' }">
    <div class="nav-logo">
      <AkariLogo class="nav-logo-icon" />
    </div>
    <div class="nav-items">
      <button
        v-for="item in displayMenu"
        :key="item.key"
        class="nav-item"
        :class="{ active: currentMenu === item.key, disabled: item.isDisabled }"
        :disabled="item.isDisabled"
        @click="handleNav(item)"
      >
        <div class="nav-icon">
          <span v-if="item.inProgress" class="nav-dot"></span>
          <NIcon :size="20"><component :is="item.icon" /></NIcon>
        </div>
        <span class="nav-label">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="tsx">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useMainWindowStore } from '@renderer-shared/shards/window-manager/store'
import { ToolFilled as ToolFilledIcon } from '@vicons/antd'
import { AiStatus as AiStatusIcon } from '@vicons/carbon'
import {
  AnimalRabbit28Filled as AnimalRabbit28FilledIcon,
  Games24Filled as Games24FilledIcon,
  Settings28Filled as Settings28FilledIcon
} from '@vicons/fluent'
import { AnalyticsRound as AnalyticsRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import type { Component as ComponentC } from 'vue'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'
import { useMainWindowAppContext } from '@main-window/context'
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'

const { t } = useTranslation()

const router = useRouter()
const route = useRoute()

const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()
const mws = useMainWindowStore()
const mui = useMainWindowUiStore()
const { openSettingsModal } = useMainWindowAppContext()

const shouldShowOngoingGameBadge = ref(false)

const isInCombatPhase = computed(() => {
  return ogs.queryStage.phase !== 'unavailable' && ogs.queryStage.phase !== 'lobby'
})

const currentMenu = ref('player-tabs')

const renderIcon = (icon: ComponentC) => {
  const Icon = icon as any
  return Icon
}

const menu = computed(() => [
  {
    key: 'player-tabs',
    icon: renderIcon(AnalyticsRoundIcon),
    name: t('navigation.sidebar.menu.match-history')
  },
  {
    key: 'ongoing-game',
    icon: renderIcon(Games24FilledIcon),
    name: t('navigation.sidebar.menu.ongoing-game'),
    inProgress: shouldShowOngoingGameBadge.value,
    isDisabled: !lcs.isConnected
  },
  {
    key: 'automation',
    icon: renderIcon(AiStatusIcon),
    name: t('navigation.sidebar.menu.automation')
  },
  {
    key: 'toolkit',
    icon: renderIcon(ToolFilledIcon),
    name: t('navigation.sidebar.menu.toolkit')
  },
  {
    key: 'test',
    icon: renderIcon(AnimalRabbit28FilledIcon),
    name: t('navigation.sidebar.menu.test'),
    show: mui.frontendSettings.showTestPage
  },
  {
    key: 'settings',
    icon: renderIcon(Settings28FilledIcon),
    name: t('navigation.sidebar.status.settings'),
    isModal: true
  }
])

const displayMenu = computed(() => menu.value.filter((m) => m.show !== false))

const handleNav = (item: (typeof menu.value)[number]) => {
  if (item.isModal) {
    openSettingsModal()
    return
  }
  router.replace({ name: item.key }).catch(() => {})
}

watchEffect(() => {
  currentMenu.value = route.name as string
  if (route.name === 'ongoing-game') {
    shouldShowOngoingGameBadge.value = false
  }
})

watchEffect(() => {
  if (isInCombatPhase.value && currentMenu.value !== 'ongoing-game') {
    shouldShowOngoingGameBadge.value = true
  }
})
</script>

<style scoped>
.bottom-nav {
  display: flex;
  align-items: center;
  height: var(--la-bottom-nav-height, 56px);
  background: var(--la-bottom-nav-bg, rgba(13, 11, 21, 0.72));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--la-card-border-rgb, rgba(139, 74, 255, 0.12));
  padding: 0 4px;
  gap: 2px;
  position: relative;
  z-index: 100;
  -webkit-app-region: no-drag;

  &.blurred {
    filter: brightness(0.8);
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 4px;
  flex-shrink: 0;
}

.nav-logo-icon {
  width: 22px;
  height: 22px;
  opacity: 0.6;
}

.nav-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 64px;
  height: 48px;
  border-radius: 10px;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  color: var(--la-color-text-muted, rgba(240, 236, 255, 0.35));
  transition: all 0.3s ease;
  font-family: inherit;
  -webkit-app-region: no-drag;

  &.disabled {
    opacity: 0.35;
    cursor: default;
  }

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 2px;
    border-radius: 0 0 4px 4px;
    background: var(--la-color-link, var(--purple-500));
    box-shadow: 0 0 10px var(--la-glow-primary);
    transition: all 0.3s ease;
  }

  &.active::before {
    transform: translateX(-50%) scaleX(1);
  }

  &:hover:not(.disabled) {
    color: var(--la-color-text-secondary, rgba(240, 236, 255, 0.6));
    background: color-mix(in oklch, var(--la-color-link) 10%, transparent);
  }

  &.active {
    color: var(--la-color-link, var(--purple-400));
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.nav-item.active .nav-icon :deep(svg) {
  filter: drop-shadow(0 0 6px var(--la-glow-primary));
}

.nav-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.nav-dot {
  position: absolute;
  top: -1px;
  right: -4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--la-color-link, var(--purple-500));
  box-shadow: 0 0 8px var(--la-glow-primary);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
</style>
