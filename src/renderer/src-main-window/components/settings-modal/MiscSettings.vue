<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection
        setting-id="misc.respawn-timer"
        :title="t('settings.misc.respawnTimer.title')"
      >
        <SettingsRow
          setting-id="misc.respawn-timer.enabled"
          :label="t('settings.misc.respawnTimer.enabled.label')"
          :label-description="t('settings.misc.respawnTimer.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="rts.settings.enabled"
            @update:value="(val) => rt.setEnabled(val)"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="misc.streamer-mode"
        :title="t('settings.misc.streamerMode.title')"
      >
        <SettingsRow
          setting-id="misc.streamer-mode.enabled"
          :label="t('settings.misc.streamerMode.streamerMode.label')"
          :label-description="t('settings.misc.streamerMode.streamerMode.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="as.settings.streamerMode"
            @update:value="(val) => a.setStreamerMode(val)"
          />
        </SettingsRow>
        <NCollapseTransition :show="as.settings.streamerMode">
          <SettingsRow
            setting-id="misc.streamer-mode.akari-name"
            :label="t('settings.misc.streamerMode.useAkariStyledName.label')"
            :label-description="t('settings.misc.streamerMode.useAkariStyledName.description')"
            :label-width="400"
            style="border-bottom-width: 1px"
          >
            <NSwitch
              size="small"
              :value="as.settings.streamerModeUseAkariStyledName"
              @update:value="(val) => a.setStreamerModeUseAkariStyledName(val)"
            />
          </SettingsRow>
        </NCollapseTransition>
        <SettingsRow
          setting-id="misc.streamer-mode.content-protection"
          :label="t('settings.misc.streamerMode.contentProtection.label')"
          :label-description="t('settings.misc.streamerMode.contentProtection.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="wms.settings.contentProtection"
            @update:value="(val) => wm.setContentProtection(val)"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        setting-id="misc.champ-select-ai"
        :title="t('settings.misc.champSelectAi.title')"
      >
        <SettingsRow
          setting-id="misc.champ-select-ai.enabled"
          :label="t('settings.misc.champSelectAi.enabled.label')"
          :label-description="t('settings.misc.champSelectAi.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="aiStore.settings.enabled"
            @update:value="(val) => aiRenderer.setEnabled(val)"
          />
        </SettingsRow>

        <NCollapseTransition :show="aiStore.settings.enabled">
          <SettingsRow
            setting-id="misc.champ-select-ai.ui-style"
            :label="t('settings.misc.champSelectAi.uiStyle.label')"
            :label-description="t('settings.misc.champSelectAi.uiStyle.description')"
            :label-width="400"
          >
            <NSelect
              size="small"
              class="w-64"
              :value="aiStore.settings.uiStyle"
              :options="uiStyleOptions"
              @update:value="(val) => aiRenderer.setUiStyle(val)"
            />
          </SettingsRow>

          <SettingsRow
            setting-id="misc.champ-select-ai.model"
            :label="t('settings.misc.champSelectAi.model.label')"
            :label-description="t('settings.misc.champSelectAi.model.description')"
            :label-width="400"
          >
            <NSelect
              size="small"
              class="w-72"
              filterable
              tag
              :value="aiStore.settings.model"
              :options="modelOptions"
              @update:value="(val) => aiRenderer.setModel(val)"
            />
          </SettingsRow>

          <SettingsRow
            setting-id="misc.champ-select-ai.api-key"
            :label="t('settings.misc.champSelectAi.apiKey.label')"
            :label-description="t('settings.misc.champSelectAi.apiKey.description')"
            :label-width="400"
          >
            <div class="flex items-center gap-2">
              <NInput
                size="small"
                type="password"
                show-password-on="click"
                class="w-56"
                :value="aiStore.settings.apiKey"
                :placeholder="t('settings.misc.champSelectAi.apiKey.placeholder')"
                @update:value="(val) => aiRenderer.setApiKey(val)"
              />
              <NButton size="small" secondary :loading="isTestingKey" @click="handleTestApiKey">
                {{ t('settings.misc.champSelectAi.apiKey.testButton') }}
              </NButton>
            </div>
          </SettingsRow>

          <SettingsRow
            setting-id="misc.champ-select-ai.auto-popup"
            :label="t('settings.misc.champSelectAi.autoPopup.label')"
            :label-description="t('settings.misc.champSelectAi.autoPopup.description')"
            :label-width="400"
            style="border-bottom-width: 1px"
          >
            <NSwitch
              size="small"
              :value="aiStore.settings.autoPopup"
              @update:value="(val) => aiRenderer.setAutoPopup(val)"
            />
          </SettingsRow>
        </NCollapseTransition>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@main-window/settings-navigation/NavigableSettingsRow.vue'
import SettingsSection from '@main-window/settings-navigation/NavigableSettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAkariNavigationStep } from '@renderer-shared/shards/akari-navigation'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ChampSelectAiRenderer } from '@renderer-shared/shards/champ-select-ai'
import { useChampSelectAiStore } from '@renderer-shared/shards/champ-select-ai/store'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCollapseTransition,
  NInput,
  NScrollbar,
  NSelect,
  NSwitch,
  useMessage
} from 'naive-ui'
import { computed, ref } from 'vue'

import { MISC_SETTINGS_NAVIGATION_STEP_KEY, type MiscSettingsNavigationPayload } from './navigation'

const { t } = useTranslation()
const message = useMessage()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)

const wm = useInstance(WindowManagerRenderer)
const wms = useWindowManagerStore()

const aiRenderer = useInstance(ChampSelectAiRenderer)
const aiStore = useChampSelectAiStore()

const isTestingKey = ref(false)

const uiStyleOptions = computed(() => [
  {
    label: t('settings.misc.champSelectAi.uiStyle.cyberpunk'),
    value: 'cyberpunk'
  },
  {
    label: t('settings.misc.champSelectAi.uiStyle.tactical'),
    value: 'tactical'
  }
])

const modelOptions = computed(() => [
  {
    label: t('settings.misc.champSelectAi.model.gemini31FlashLite'),
    value: 'gemini-3.1-flash-lite'
  },
  {
    label: t('settings.misc.champSelectAi.model.gemini38Flash'),
    value: 'gemini-3.8-flash'
  },
  {
    label: t('settings.misc.champSelectAi.model.gemini36Flash'),
    value: 'gemini-3.6-flash'
  },
  {
    label: t('settings.misc.champSelectAi.model.gemini25FlashLite'),
    value: 'gemini-2.5-flash-lite'
  },
  {
    label: t('settings.misc.champSelectAi.model.gemini20Flash'),
    value: 'gemini-2.0-flash'
  }
])

async function handleTestApiKey() {
  if (!aiStore.settings.apiKey || aiStore.settings.apiKey.trim().length === 0) {
    message.warning(t('settings.misc.champSelectAi.apiKey.placeholder'))
    return
  }

  isTestingKey.value = true
  try {
    const res = await aiRenderer.testApiKey(aiStore.settings.apiKey, aiStore.settings.model)
    if (res.success) {
      message.success(t('settings.misc.champSelectAi.apiKey.testSuccess'))
    } else {
      message.error(
        `${t('settings.misc.champSelectAi.apiKey.testFailed')}: ${res.message || 'Error'}`
      )
    }
  } catch (err: any) {
    message.error(
      `${t('settings.misc.champSelectAi.apiKey.testFailed')}: ${err?.message || 'Error'}`
    )
  } finally {
    isTestingKey.value = false
  }
}

useAkariNavigationStep<MiscSettingsNavigationPayload>({
  key: MISC_SETTINGS_NAVIGATION_STEP_KEY,
  activate: () => {
    if (!as.settings.streamerMode) {
      return { status: 'unavailable', reason: 'streamer-mode-details-hidden' }
    }

    return undefined
  }
})
</script>
