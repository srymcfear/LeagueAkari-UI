<template>
  <NScrollbar class="h-full">
    <SettingsSection :title="t('settings.matchHistory.title')">
      <SettingsRow
        :label="t('settings.matchHistory.refreshTabsAfterGameEnds.label')"
        :label-description="t('settings.matchHistory.refreshTabsAfterGameEnds.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="pts.frontendSettings.refreshTabsAfterGameEnds" />
      </SettingsRow>
      <SettingsRow
        :label="t('settings.matchHistory.loadCount.label')"
        :label-description="t('settings.matchHistory.loadCount.description')"
        :label-width="400"
      >
        <NSelect
          class="w-30!"
          size="small"
          v-model:value="pts.frontendSettings.loadCount"
          :options="pageSizeOptions"
        />
      </SettingsRow>
      <SettingsRow
        :label="t('settings.matchHistory.matchCardOpacity.label')"
        :label-description="t('settings.matchHistory.matchCardOpacity.description')"
        :label-width="400"
      >
        <NSlider
          class="w-48!"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()}%`"
          :value="pts.frontendSettings.matchCardOpacity"
          @update:value="(val) => { pts.frontendSettings.matchCardOpacity = val }"
        />
      </SettingsRow>
    </SettingsSection>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, NSelect, NSlider, NSwitch } from 'naive-ui'

import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

const { t } = useTranslation()

const pts = usePlayerTabsStore()

const pageSizeOptions = usePageSizeOptions()
</script>
