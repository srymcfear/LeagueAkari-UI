<template>
  <div class="flex flex-col gap-2.5">
    <MatchHistoryPagination />
    <NormalTagBlock />
    <SummaryPane />
    <RecentlyPlayers side="ally" />
    <RecentlyPlayers side="enemy" />
    <EncounteredGames />
  </div>
</template>

<script setup lang="ts">
import EncounteredGames from './EncounteredGames.vue'
import MatchHistoryPagination from './match-history-pagination'
import NormalTagBlock from './NormalTagBlock.vue'
import RecentlyPlayers from './RecentlyPlayers.vue'
import SummaryPane from './SummaryPane.vue'
</script>
