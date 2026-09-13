<template>
  <div class="flex flex-col gap-3">
    <PlayerTabCol2 />
    <div class="my-1 border-t border-black/10 dark:border-white/10" />
    <PlayerTabCol1 />
  </div>
</template>

<script setup lang="ts">
import PlayerTabCol1 from './widgets/PlayerTabCol1.vue'
import PlayerTabCol2 from './widgets/PlayerTabCol2.vue'
</script>
