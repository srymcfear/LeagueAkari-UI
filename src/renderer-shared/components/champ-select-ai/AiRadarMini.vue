<template>
  <div class="ai-radar-mini-container" :class="aiStore.settings.uiStyle">
    <!-- Top Enemy Strip (5 slots) -->
    <div class="enemy-strip">
      <div
        v-for="enemy in enemySlots"
        :key="enemy.cellId || enemy.name"
        class="enemy-card"
        :class="{ active: selectedEnemy?.name === enemy.name }"
        @click="selectEnemy(enemy)"
      >
        <div class="avatar-ring">
          <img :src="getChampionIconUrl(enemy.championId, enemy.name)" :alt="enemy.name" />
          <span class="role-badge">{{ enemy.position }}</span>
        </div>
        <span class="enemy-name">{{ enemy.name }}</span>
      </div>
    </div>

    <!-- Target Meta Bar -->
    <div class="target-bar">
      <div class="target-info">
        <span class="target-label">MỤC TIÊU:</span>
        <span class="target-name">{{ selectedEnemy?.name || '---' }}</span>
        <span class="target-role">({{ selectedEnemy?.position || 'LANER' }})</span>
      </div>
      <div class="target-actions">
        <span
          class="threat-badge"
          :class="{
            'threat-crit': intel?.threatLevel === 'CRITICAL' || intel?.threatLevel === 'HIGH',
            'threat-mid': intel?.threatLevel === 'ELEVATED',
            'threat-mod': intel?.threatLevel === 'MODERATE'
          }"
        >
          {{ intel?.threatLevel || 'THEO DÕI' }}
        </span>
        <button
          class="rescan-btn"
          :disabled="aiStore.isAnalyzing"
          @click="handleAnalyze(true)"
          title="Phân tích lại với Gemini AI"
        >
          {{ aiStore.isAnalyzing ? '...' : '⚡ SCAN' }}
        </button>
      </div>
    </div>

    <!-- Scrollable Intel Body -->
    <NScrollbar class="intel-body-scroll">
      <div class="intel-content">
        <!-- Error / Missing Key State -->
        <div v-if="errorMessage" class="error-panel">
          <div class="error-msg">⚠️ {{ errorMessage }}</div>
          <div v-if="!aiStore.settings.apiKey" class="error-hint">
            Vào <b>Cài đặt</b> > <b>Khác</b> trong cửa sổ chính để nhập Gemini API Key miễn phí.
          </div>
        </div>

        <!-- Intel Loaded State -->
        <template v-else>
          <!-- Matchup Tactics -->
          <div class="intel-card">
            <div class="card-header">
              <span class="header-icon">▸</span>
              <span class="header-title">CHIẾN THUẬT ĐỐI ĐẦU</span>
              <span v-if="intel?.cached" class="cache-tag">⚡ CACHE (0ms)</span>
            </div>
            <div v-if="aiStore.isAnalyzing" class="loading-state">
              <span class="loading-pulse"></span>
              Đang kết nối Gemini 2.5 Flash phân tích kèo...
            </div>
            <div v-else-if="intel?.bullets?.length" class="bullet-list">
              <div v-for="(bullet, idx) in intel.bullets" :key="idx" class="bullet-item">
                <span class="bullet-dot">◆</span>
                <div class="bullet-text">
                  <span class="bullet-title">{{ bullet.title }}:</span>
                  <span>{{ bullet.text }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              Bấm nút <b>⚡ SCAN</b> để Gemini AI phân tích chi tiết kèo đấu này.
            </div>
          </div>

          <!-- Hard Counters -->
          <div class="intel-card">
            <div class="card-header">
              <span class="header-icon">▸</span>
              <span class="header-title">TƯỚNG KHẮC CHẾ ĐỀ XUẤT</span>
            </div>
            <div class="counters-grid">
              <div
                v-for="(counter, idx) in intel?.counters || defaultCounters"
                :key="idx"
                class="counter-chip"
              >
                <img
                  :src="getChampionIconUrl(counter.championId, counter.name)"
                  :alt="counter.name"
                  class="counter-avatar"
                />
                <div class="counter-meta">
                  <span class="counter-name">{{ counter.name }}</span>
                  <span class="counter-win">{{ counter.winRate || 'FAVOR' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recommended Items -->
          <div class="intel-card">
            <div class="card-header">
              <span class="header-icon">▸</span>
              <span class="header-title">TRANG BỊ ĐỐI ĐẦU</span>
            </div>
            <div class="items-wrap">
              <span
                v-for="(item, idx) in intel?.recommendedItems || defaultItems"
                :key="idx"
                class="item-pill"
              >
                🛡️ {{ item }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </NScrollbar>

    <!-- Footer Bar -->
    <div class="radar-footer">
      <span>AI ENGINE: GEMINI 2.5 FLASH</span>
      <span class="my-champ">BẠN: {{ myChampionName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { ChampSelectAiRenderer } from '@renderer-shared/shards/champ-select-ai'
import { useChampSelectAiStore } from '@renderer-shared/shards/champ-select-ai/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { CounterChampionPick, MatchupIntel } from '@shared/types/champ-select-ai'
import { NScrollbar } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const aiStore = useChampSelectAiStore()
const aiRenderer = useInstance(ChampSelectAiRenderer)
const leagueClientStore = useLeagueClientStore()
const resources = useAkariResourceProvider()

const intel = ref<MatchupIntel | null>(null)
const errorMessage = ref<string | null>(null)

interface EnemySlotDisplay {
  cellId: number
  championId: number
  name: string
  position: string
  threatLevel?: string
}

const defaultMockEnemies: EnemySlotDisplay[] = [
  { cellId: 1, championId: 266, name: 'Aatrox', position: 'TOP', threatLevel: 'ELEVATED' },
  { cellId: 2, championId: 64, name: 'LeeSin', position: 'JUG', threatLevel: 'HIGH' },
  { cellId: 3, championId: 157, name: 'Yasuo', position: 'MID', threatLevel: 'CRITICAL' },
  { cellId: 4, championId: 145, name: 'Kaisa', position: 'ADC', threatLevel: 'HIGH' },
  { cellId: 5, championId: 111, name: 'Nautilus', position: 'SUP', threatLevel: 'MODERATE' }
]

const defaultCounters: CounterChampionPick[] = [
  { name: 'Renekton', winRate: '57.4% WIN' },
  { name: 'Pantheon', winRate: '56.1% WIN' },
  { name: 'Vex', winRate: '54.8% WIN' }
]

const defaultItems: string[] = ['Đồng Hồ Cát Zhonya', 'Giày Thép Gai', 'Dây Chuyền Chữ Thập']

const enemySlots = computed<EnemySlotDisplay[]>(() => {
  const session = leagueClientStore.champSelect.session
  if (!session || !session.theirTeam || session.theirTeam.length === 0) {
    return defaultMockEnemies
  }

  const result: EnemySlotDisplay[] = []
  session.theirTeam.forEach((member, index) => {
    const champId = member.championId || member.championPickIntent || 0
    let champName = champId > 0 ? resources.champions.name(champId) : `Enemy ${index + 1}`
    if (!champName || champName.length === 0) {
      champName = `Enemy ${index + 1}`
    }

    result.push({
      cellId: member.cellId,
      championId: champId,
      name: champName,
      position: member.assignedPosition?.toUpperCase() || `P${index + 1}`
    })
  })

  return result.length > 0 ? result : defaultMockEnemies
})

const myChampionId = computed(() => leagueClientStore.champSelect.currentChampion ?? 0)
const myChampionName = computed(() => {
  if (myChampionId.value <= 0) return 'Đang chọn...'
  return resources.champions.name(myChampionId.value) || 'Đang chọn...'
})

const selectedEnemy = ref<EnemySlotDisplay>(enemySlots.value[2] || enemySlots.value[0])

watch(
  () => enemySlots.value,
  (newSlots) => {
    if (
      newSlots.length > 0 &&
      (!selectedEnemy.value || !newSlots.some((s) => s.name === selectedEnemy.value.name))
    ) {
      selectedEnemy.value = newSlots[0]
    }
  },
  { immediate: true }
)

function selectEnemy(enemy: EnemySlotDisplay) {
  selectedEnemy.value = enemy
  handleAnalyze(false)
}

function getChampionIconUrl(champId?: number, name?: string) {
  if (champId && champId > 0) {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champId}.png`
  }
  const cleanName = name?.replace(/[^a-zA-Z0-9]/g, '') || 'Yasuo'
  return `https://ddragon.leagueoflegends.com/cdn/14.18.1/img/champion/${cleanName}.png`
}

async function handleAnalyze(forceRefresh = false) {
  if (!selectedEnemy.value) return

  errorMessage.value = null

  if (!aiStore.settings.apiKey || aiStore.settings.apiKey.trim().length === 0) {
    errorMessage.value = 'Chưa cấu hình Gemini API Key'
    return
  }

  try {
    const result = await aiRenderer.analyzeMatchup({
      myChampionName: myChampionName.value,
      myChampionId: myChampionId.value,
      enemyChampionName: selectedEnemy.value.name,
      enemyChampionId: selectedEnemy.value.championId,
      enemyPosition: selectedEnemy.value.position,
      forceRefresh
    })
    intel.value = result
  } catch (err: any) {
    errorMessage.value = err?.message || 'Lỗi khi gọi Gemini API'
  }
}
</script>

<style scoped>
.ai-radar-mini-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: inherit;
  font-size: 12px;
  user-select: none;
}

/* ============================================================
   SHARED LAYOUT
============================================================ */
.enemy-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 6px 8px;
  flex-shrink: 0;
}

.enemy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.avatar-ring {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  padding: 1.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge {
  position: absolute;
  bottom: -3px;
  font-size: 8px;
  font-weight: 700;
  padding: 0 3px;
  border-radius: 3px;
}

.enemy-name {
  font-size: 10px;
  font-weight: 600;
  max-width: 54px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.target-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  flex-shrink: 0;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
}

.target-label {
  opacity: 0.6;
  font-size: 10px;
  font-weight: 700;
}

.target-name {
  font-weight: 800;
}

.target-role {
  opacity: 0.7;
  font-size: 10px;
}

.target-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.threat-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.rescan-btn {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.rescan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.intel-body-scroll {
  flex: 1;
  height: 0;
}

.intel-content {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intel-card {
  border-radius: 6px;
  padding: 8px 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  margin-bottom: 6px;
}

.header-icon {
  font-size: 11px;
}

.header-title {
  letter-spacing: 0.5px;
}

.cache-tag {
  margin-left: auto;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
}

.bullet-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bullet-item {
  display: flex;
  gap: 6px;
  font-size: 11px;
  line-height: 1.4;
}

.bullet-dot {
  font-size: 8px;
  margin-top: 3px;
  flex-shrink: 0;
}

.bullet-title {
  font-weight: 700;
  margin-right: 4px;
}

.counters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.counter-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 5px;
}

.counter-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.counter-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.counter-name {
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.counter-win {
  font-size: 8.5px;
  opacity: 0.8;
}

.items-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.item-pill {
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
}

.radar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  font-size: 9.5px;
  flex-shrink: 0;
}

.my-champ {
  font-weight: 600;
}

.loading-state,
.empty-state {
  font-size: 11px;
  opacity: 0.7;
  padding: 6px 0;
}

.loading-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse-dot 1s infinite alternate;
  margin-right: 4px;
}

@keyframes pulse-dot {
  from {
    opacity: 0.3;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1.2);
  }
}

.error-panel {
  padding: 10px;
  border-radius: 6px;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.35);
  color: #fecdd3;
  font-size: 11px;
}

.error-msg {
  font-weight: 700;
  margin-bottom: 4px;
}

.error-hint {
  opacity: 0.85;
  font-size: 10px;
  line-height: 1.4;
}

/* ============================================================
   STYLE 01: CYBERPUNK (NO GREEN, NO YELLOW)
============================================================ */
.ai-radar-mini-container.cyberpunk {
  background: #090d16;
  color: #e2e8f0;
}

.cyberpunk .enemy-strip {
  background: rgba(15, 23, 42, 0.7);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}

.cyberpunk .enemy-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cyberpunk .enemy-card:hover {
  border-color: #00f0ff;
  background: rgba(0, 240, 255, 0.08);
}

.cyberpunk .enemy-card.active {
  border-color: #d946ef;
  background: rgba(217, 70, 239, 0.15);
  box-shadow: 0 0 10px rgba(217, 70, 239, 0.3);
}

.cyberpunk .avatar-ring {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.5), transparent);
}

.cyberpunk .enemy-card.active .avatar-ring {
  background: linear-gradient(135deg, #d946ef, #a855f7);
}

.cyberpunk .role-badge {
  background: #090d16;
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: #00f0ff;
}

.cyberpunk .target-bar {
  background: rgba(0, 240, 255, 0.05);
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
}

.cyberpunk .target-name {
  color: #00f0ff;
  text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
}

.cyberpunk .threat-crit {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.4);
}

.cyberpunk .threat-mid {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.cyberpunk .threat-mod {
  background: rgba(0, 240, 255, 0.15);
  color: #00f0ff;
  border: 1px solid rgba(0, 240, 255, 0.3);
}

.cyberpunk .rescan-btn {
  background: rgba(0, 240, 255, 0.12);
  color: #00f0ff;
  border-color: rgba(0, 240, 255, 0.4);
}

.cyberpunk .rescan-btn:hover:not(:disabled) {
  background: #00f0ff;
  color: #090d16;
}

.cyberpunk .intel-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.12);
}

.cyberpunk .card-header {
  color: #00f0ff;
}

.cyberpunk .header-icon {
  color: #d946ef;
}

.cyberpunk .cache-tag {
  background: rgba(0, 240, 255, 0.15);
  color: #00f0ff;
  border: 1px solid rgba(0, 240, 255, 0.3);
}

.cyberpunk .bullet-dot {
  color: #d946ef;
}

.cyberpunk .bullet-title {
  color: #e0f2fe;
}

.cyberpunk .counter-chip {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.cyberpunk .counter-name {
  color: #f3e8ff;
}

.cyberpunk .counter-win {
  color: #c084fc;
}

.cyberpunk .item-pill {
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.25);
  color: #e0f2fe;
}

.cyberpunk .radar-footer {
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #64748b;
}

.cyberpunk .loading-pulse {
  background: #00f0ff;
}

/* ============================================================
   STYLE 03: TACTICAL HUD (NO GREEN, NO YELLOW)
============================================================ */
.ai-radar-mini-container.tactical {
  background: #0c1017;
  color: #cbd5e1;
}

.tactical .enemy-strip {
  background: #0f141e;
  border-bottom: 1px solid #1e2638;
}

.tactical .enemy-card {
  background: #141b28;
  border: 1px solid #232d42;
}

.tactical .enemy-card:hover {
  border-color: #3b82f6;
  background: #1a2334;
}

.tactical .enemy-card.active {
  border-color: #3b82f6;
  background: #1e293b;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.tactical .avatar-ring {
  background: #232d42;
}

.tactical .enemy-card.active .avatar-ring {
  background: #3b82f6;
}

.tactical .role-badge {
  background: #0c1017;
  border: 1px solid #3b82f6;
  color: #60a5fa;
}

.tactical .target-bar {
  background: #101622;
  border-bottom: 1px solid #1e2638;
}

.tactical .target-name {
  color: #93c5fd;
}

.tactical .threat-crit {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid #f43f5e;
}

.tactical .threat-mid {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid #3b82f6;
}

.tactical .threat-mod {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid #64748b;
}

.tactical .rescan-btn {
  background: #1e293b;
  color: #93c5fd;
  border-color: #3b82f6;
}

.tactical .rescan-btn:hover:not(:disabled) {
  background: #3b82f6;
  color: #ffffff;
}

.tactical .intel-card {
  background: #111723;
  border: 1px solid #1e2638;
}

.tactical .card-header {
  color: #93c5fd;
}

.tactical .header-icon {
  color: #3b82f6;
}

.tactical .cache-tag {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid #3b82f6;
}

.tactical .bullet-dot {
  color: #3b82f6;
}

.tactical .bullet-title {
  color: #f1f5f9;
}

.tactical .counter-chip {
  background: #161e2e;
  border: 1px solid #232d42;
}

.tactical .counter-name {
  color: #e2e8f0;
}

.tactical .counter-win {
  color: #93c5fd;
}

.tactical .item-pill {
  background: #161e2e;
  border: 1px solid #232d42;
  color: #cbd5e1;
}

.tactical .radar-footer {
  background: #090c12;
  border-top: 1px solid #1e2638;
  color: #64748b;
}

.tactical .loading-pulse {
  background: #3b82f6;
}
</style>
