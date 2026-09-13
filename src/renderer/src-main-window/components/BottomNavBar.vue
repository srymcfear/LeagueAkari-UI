<template>
  <nav class="bottom-nav" :class="{ blurred: mws.focus === 'blurred' }">
    <div class="nav-brand" title="League Akari">
      <AkariLogo class="nav-brand-logo" />
    </div>

    <div class="nav-divider" />

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
          <span v-if="item.inProgress" class="nav-dot" />
          <NIcon :size="17"><component :is="item.icon" /></NIcon>
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
  align-self: center;
  margin: 0 auto 12px auto;
  width: fit-content;
  max-width: calc(100% - 32px);
  height: 44px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--la-hud-dock-bg, rgba(13, 11, 22, 0.88));
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--la-hud-dock-border, rgba(166, 124, 255, 0.22));
  border-radius: 9999px;
  box-shadow: var(--la-hud-dock-shadow, 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 16px rgba(139, 74, 255, 0.12)),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 100;
  -webkit-app-region: no-drag;
  transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &.blurred {
    opacity: 0.75;
  }
}

.nav-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  margin-left: 2px;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(166, 124, 255, 0.12);
    .nav-brand-logo {
      opacity: 1;
      filter: drop-shadow(0 0 8px rgba(166, 124, 255, 0.7));
      transform: scale(1.08);
    }
  }
}

.nav-brand-logo {
  width: 19px;
  height: 19px;
  opacity: 0.75;
  transition: all 0.2s ease;
}

.nav-divider {
  width: 1px;
  height: 18px;
  background: rgba(166, 124, 255, 0.18);
  margin: 0 4px;
  flex-shrink: 0;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 3px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  height: 34px;
  border-radius: 9999px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--la-color-text-muted, rgba(240, 235, 255, 0.55));
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-app-region: no-drag;

  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:hover:not(.disabled):not(.active) {
    color: var(--la-color-text-primary, #ffffff);
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    color: #ffffff;
    font-weight: 600;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(56, 189, 248, 0.12) 100%);
    border-color: rgba(168, 85, 247, 0.35);
    box-shadow: 0 2px 10px rgba(168, 85, 247, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1);

    .nav-icon {
      color: var(--la-hud-cyan, #38bdf8);
      filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6));
    }
  }
}

.nav-icon {
  width: 17px;
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: inherit;
  transition: color 0.2s ease, filter 0.2s ease;
}

.nav-label {
  line-height: 1;
}

.nav-dot {
  position: absolute;
  top: -2px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--la-hud-cyan, #38bdf8);
  box-shadow: 0 0 8px var(--la-hud-cyan, #38bdf8);
  animation: pulse-dot 1.8s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 0.65;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}
</style>
