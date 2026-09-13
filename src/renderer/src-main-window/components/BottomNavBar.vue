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
  margin: 0 16px 12px 16px;
  height: var(--la-bottom-nav-height, 52px);
  background: var(--la-hud-dock-bg, rgba(14, 11, 24, 0.8));
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--la-hud-dock-border, rgba(166, 124, 255, 0.24));
  border-radius: 16px;
  box-shadow: var(--la-hud-dock-shadow, 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 74, 255, 0.15));
  padding: 0 10px;
  gap: 6px;
  position: relative;
  z-index: 100;
  -webkit-app-region: no-drag;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &.blurred {
    filter: brightness(0.75);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin: 0 4px 0 2px;
  flex-shrink: 0;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(166, 124, 255, 0.12);
    .nav-logo-icon {
      opacity: 1;
      filter: drop-shadow(0 0 8px rgba(166, 124, 255, 0.7));
      transform: scale(1.08) rotate(-4deg);
    }
  }
}

.nav-logo-icon {
  width: 22px;
  height: 22px;
  opacity: 0.75;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 68px;
  height: 44px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  position: relative;
  color: var(--la-color-text-muted, rgba(240, 235, 255, 0.45));
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  font-family: inherit;
  -webkit-app-region: no-drag;

  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 22px;
    height: 2px;
    border-radius: 4px 4px 0 0;
    background: var(--la-hud-cyan, #38bdf8);
    box-shadow: 0 0 10px var(--la-hud-cyan, #38bdf8);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &.active::before {
    transform: translateX(-50%) scaleX(1);
  }

  &:hover:not(.disabled) {
    color: var(--la-color-text-primary, #ffffff);
    background: rgba(166, 124, 255, 0.1);
    border-color: rgba(166, 124, 255, 0.15);
    transform: translateY(-2px);

    .nav-icon :deep(svg) {
      filter: drop-shadow(0 0 6px rgba(166, 124, 255, 0.5));
    }
  }

  &.active {
    color: var(--la-color-text-primary, #ffffff);
    background: radial-gradient(ellipse at 50% 120%, rgba(139, 74, 255, 0.25) 0%, rgba(139, 74, 255, 0.05) 75%, transparent 100%);
    border-color: rgba(166, 124, 255, 0.25);
    transform: translateY(-1px);
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.25s ease;
}

.nav-item.active .nav-icon :deep(svg) {
  color: var(--la-color-link, #a67cff);
  filter: drop-shadow(0 0 8px rgba(166, 124, 255, 0.65));
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.nav-dot {
  position: absolute;
  top: -2px;
  right: -5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--la-hud-cyan, #38bdf8);
  box-shadow: 0 0 10px var(--la-hud-cyan, #38bdf8), 0 0 16px rgba(56, 189, 248, 0.5);
  animation: pulse-dot 1.8s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.35);
  }
}
</style>
