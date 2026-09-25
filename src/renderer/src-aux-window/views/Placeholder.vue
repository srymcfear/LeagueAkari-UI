<template>
  <div class="relative -mt-4 flex h-full flex-col items-center justify-center">
    <NIcon class="relative -left-2 mb-4 text-[80px] text-black/20 dark:text-white/20">
      <AkariLogo />
    </NIcon>
    <template v-if="lcs.gameflow.phase === 'InProgress' || lcs.gameflow.phase === 'GameStart'">
      <span class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400">
        {{ t('auxWindow.placeholder.inProgress') }}
      </span>
      <button
        class="mt-3 flex cursor-pointer items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 active:scale-95"
        @click="switchToRadar"
      >
        <span>⚡</span>
        <span>Xem Hướng Dẫn & Tối Ưu In-Game</span>
      </button>
    </template>
    <span
      class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400"
      v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating"
      >{{ t('auxWindow.placeholder.idle') }}</span
    >
    <span class="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400" v-else>{{
      t('auxWindow.placeholder.idle')
    }}</span>
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

const lcs = useLeagueClientStore()

function switchToRadar() {
  try {
    const channel = new BroadcastChannel('akari-aux-window-nav')
    channel.postMessage({ tab: 'radar' })
    channel.close()
  } catch {}
}
</script>

<style scoped></style>
