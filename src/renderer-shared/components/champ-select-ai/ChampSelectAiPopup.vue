<template>
  <div v-if="show && aiStore.settings.enabled" class="champ-select-ai-wrapper">
    <!-- STYLE 01: CYBERPUNK NEON HUD -->
    <div v-if="aiStore.settings.uiStyle === 'cyberpunk'" class="cyberpunk-hud-frame">
      <div class="cyber-header">
        <div class="cyber-title-group">
          <div class="cyber-badge">
            <span class="cyber-pulse"></span>
            GEMINI 2.5 FLASH
          </div>
          <span class="cyber-title">CHAMP-SELECT AI TACTICAL HUD</span>
        </div>
        <div class="cyber-header-actions">
          <div class="cyber-player-tag">
            <span>BẠN:</span>
            <span class="highlight">{{ myChampionName || 'Đang chọn...' }}</span>
          </div>
          <button class="cyber-close-btn" @click="show = false">✕</button>
        </div>
      </div>

      <!-- 5 Enemy Strip -->
      <div class="cyber-enemy-strip">
        <div
          v-for="enemy in enemySlots"
          :key="enemy.cellId || enemy.name"
          class="cyber-champ-card"
          :class="{ active: selectedEnemy?.name === enemy.name }"
          @click="selectEnemy(enemy)"
        >
          <div class="cyber-avatar-wrapper">
            <img :src="getChampionIconUrl(enemy.championId, enemy.name)" :alt="enemy.name" />
            <span class="cyber-lane-badge">{{ enemy.position }}</span>
          </div>
          <div class="cyber-card-info">
            <span class="cyber-champ-name">{{ enemy.name }}</span>
            <span
              class="cyber-threat-tag"
              :class="{
                'threat-high': enemy.threatLevel === 'CRITICAL' || enemy.threatLevel === 'HIGH',
                'threat-med': enemy.threatLevel === 'ELEVATED',
                'threat-low': enemy.threatLevel === 'MODERATE'
              }"
            >
              {{ enemy.threatLevel || 'TARGET' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Analysis Body -->
      <div class="cyber-body">
        <div class="cyber-meta-row">
          <div class="cyber-target-title">
            MỤC TIÊU:
            <span class="cyan-glow"
              >{{ selectedEnemy?.name?.toUpperCase() }} ({{ selectedEnemy?.position }})</span
            >
            <span v-if="intel?.cached" class="cyber-cache-badge">⚡ CACHE (0ms)</span>
          </div>
          <button
            class="cyber-rescan-btn"
            :disabled="aiStore.isAnalyzing"
            @click="handleAnalyze(true)"
          >
            {{ aiStore.isAnalyzing ? 'ĐANG PHÂN TÍCH...' : '⚡ PHÂN TÍCH LẠI' }}
          </button>
        </div>

        <!-- Error banner if missing API Key or failed -->
        <div v-if="errorMessage" class="cyber-error-box">
          <span>⚠️ {{ errorMessage }}</span>
          <button
            v-if="!aiStore.settings.apiKey"
            class="cyber-config-btn"
            @click="emit('openSettings')"
          >
            Vào Cài Đặt Nhập Key
          </button>
        </div>

        <!-- Intel Grid -->
        <div v-else class="cyber-grid">
          <div class="cyber-box">
            <div class="cyber-box-title">
              // CHIẾN THUẬT ĐỐI ĐẦU ({{ myChampionName || 'BẠN' }} vs {{ selectedEnemy?.name }})
            </div>
            <ul v-if="intel?.bullets?.length" class="cyber-bullet-list">
              <li v-for="(bullet, idx) in intel.bullets" :key="idx" class="cyber-bullet-item">
                <span class="cyber-bullet-arrow">▸</span>
                <span class="cyber-bullet-content">
                  <b>{{ bullet.title }}:</b> {{ bullet.text }}
                </span>
              </li>
            </ul>
            <div v-else-if="aiStore.isAnalyzing" class="cyber-loading">
              Đang kết nối vệ tinh AI Gemini và tính toán đối đầu...
            </div>
            <div v-else class="cyber-placeholder">
              Bấm nút "Phân Tích Lại" để bắt đầu nhận phân tích kèo.
            </div>
          </div>

          <div class="cyber-box">
            <div class="cyber-box-title">// TƯỚNG KHẮC CHẾ CỨNG</div>
            <div class="cyber-counters-row">
              <div
                v-for="(counter, idx) in intel?.counters || defaultCounters"
                :key="idx"
                class="cyber-counter-chip"
              >
                <img
                  :src="getChampionIconUrl(counter.championId, counter.name)"
                  :alt="counter.name"
                />
                <div class="counter-text">
                  <span class="name">{{ counter.name }}</span>
                  <span v-if="counter.winRate" class="winrate">{{ counter.winRate }}</span>
                </div>
              </div>
            </div>

            <div class="cyber-box-title" style="margin-top: 14px">// TRANG BỊ ĐỀ XUẤT</div>
            <div class="cyber-items-row">
              <span
                v-for="(item, idx) in intel?.recommendedItems || defaultItems"
                :key="idx"
                class="cyber-item-badge"
              >
                🛡️ {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="cyber-footer">
        <div class="cyber-stats">
          <span
            >THREAT RATING:
            <b :style="{ color: intel?.threatColor || '#00f0ff' }"
              >{{ intel?.threatLevel }} ({{ intel?.threatScore }})</b
            ></span
          >
          <span
            >LATENCY: <b>{{ intel?.cached ? '0ms' : '0.6s' }}</b></span
          >
        </div>
        <div>FEΔR AI ENGINE • STYLE 01 // CYBERPUNK HUD</div>
      </div>
    </div>

    <!-- STYLE 03: TACTICAL GAME HUD OVERLAY -->
    <div v-else-if="aiStore.settings.uiStyle === 'tactical'" class="tactical-hud-frame">
      <div class="tactical-header">
        <div class="tactical-title-group">
          <span class="tactical-light"></span>
          <span class="tactical-title">TACTICAL OPPONENT COUNTER RADAR</span>
        </div>
        <div class="tactical-header-right">
          <div class="tactical-threat-badge">
            <span>THREAT:</span>
            <span :style="{ color: intel?.threatColor || '#fb7185' }">
              {{ intel?.threatLevel || 'MONITORING' }} ({{ intel?.threatScore || '7.5/10' }})
            </span>
          </div>
          <button class="tactical-close-btn" @click="show = false">[ X ]</button>
        </div>
      </div>

      <!-- 5 Matrix Slots -->
      <div class="tactical-matrix">
        <div
          v-for="enemy in enemySlots"
          :key="enemy.cellId || enemy.name"
          class="tactical-slot"
          :class="{ selected: selectedEnemy?.name === enemy.name }"
          @click="selectEnemy(enemy)"
        >
          <div class="tactical-avatar-box">
            <img :src="getChampionIconUrl(enemy.championId, enemy.name)" :alt="enemy.name" />
          </div>
          <span class="tactical-pos">{{ enemy.position }}</span>
          <span class="tactical-name">{{ enemy.name }}</span>
        </div>
      </div>

      <!-- Tactical Body -->
      <div class="tactical-body">
        <div class="tactical-main-col">
          <div class="tactical-action-row">
            <span class="tactical-code"
              >[ TARGET_ID: {{ selectedEnemy?.name?.toUpperCase() }} // MATCHUP ]</span
            >
            <button
              class="tactical-btn"
              :disabled="aiStore.isAnalyzing"
              @click="handleAnalyze(true)"
            >
              {{ aiStore.isAnalyzing ? '[ SCANNING... ]' : '[ ↻ RESCAN INTEL ]' }}
            </button>
          </div>

          <!-- Error banner -->
          <div v-if="errorMessage" class="tactical-error-banner">
            <span>! ERROR: {{ errorMessage }}</span>
            <button
              v-if="!aiStore.settings.apiKey"
              class="tactical-btn"
              @click="emit('openSettings')"
            >
              [ CẤU HÌNH API KEY ]
            </button>
          </div>

          <div v-else class="tactical-logs">
            <div
              v-for="(bullet, idx) in intel?.bullets || []"
              :key="idx"
              class="tactical-log-item"
              :class="bullet.type || 'info'"
            >
              <div class="tactical-log-title">// {{ bullet.title }}</div>
              <div class="tactical-log-desc">{{ bullet.text }}</div>
            </div>

            <div v-if="aiStore.isAnalyzing" class="tactical-loading-log">
              [ RADAR SCANNING: Querying Gemini 2.5 Flash neural models... ]
            </div>
            <div v-else-if="!intel?.bullets?.length" class="tactical-loading-log">
              [ Sẵn sàng phân tích mục tiêu. Bấm RESCAN INTEL để khởi tạo. ]
            </div>
          </div>
        </div>

        <div class="tactical-side-col">
          <div class="tactical-side-card">
            <div class="tactical-side-title">// HARD-COUNTER PICKS</div>
            <div class="tactical-counters-list">
              <div
                v-for="(counter, idx) in intel?.counters || defaultCounters"
                :key="idx"
                class="tactical-counter-row"
              >
                <div class="counter-left">
                  <img
                    :src="getChampionIconUrl(counter.championId, counter.name)"
                    :alt="counter.name"
                  />
                  <span>{{ counter.name }}</span>
                </div>
                <span class="counter-win">{{ counter.winRate || 'FAVOR' }}</span>
              </div>
            </div>
          </div>

          <div class="tactical-side-card">
            <div class="tactical-side-title">// TACTICAL ITEMS</div>
            <div class="tactical-item-chips">
              <span
                v-for="(item, idx) in intel?.recommendedItems || defaultItems"
                :key="idx"
                class="tactical-chip"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="tactical-footer">
        <div>AI ENGINE: GEMINI 2.5 FLASH • ZERO-TOKEN TIER</div>
        <div>FEΔR PROTOCOL • STYLE 03 // TACTICAL HUD</div>
      </div>
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
import { computed, ref, watch } from 'vue'

const show = defineModel<boolean>('show', { default: false })
const emit = defineEmits<{
  (e: 'openSettings'): void
}>()

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

// Fallback test enemies if not in active LCU ChampSelect
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

// Live LCU Champ Select enemy slots
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

// Local player's picked champion
const myChampionId = computed(() => leagueClientStore.champSelect.currentChampion ?? 0)
const myChampionName = computed(() => {
  if (myChampionId.value <= 0) return 'Tướng của bạn'
  return resources.champions.name(myChampionId.value) || 'Tướng của bạn'
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
    errorMessage.value = 'Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để nhập Key miễn phí.'
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
.champ-select-ai-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  max-width: 820px;
  width: calc(100vw - 48px);
  user-select: none;
  font-family: inherit;
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7));
}

/* ============================================================
   STYLE 01: CYBERPUNK NEON HUD
============================================================ */
.cyberpunk-hud-frame {
  background: rgba(11, 15, 25, 0.95);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: 10px;
  box-shadow:
    0 0 30px rgba(0, 240, 255, 0.15),
    inset 0 0 20px rgba(0, 240, 255, 0.05);
  overflow: hidden;
  backdrop-filter: blur(16px);
  color: #f1f5f9;
}

.cyber-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(0, 240, 255, 0.06);
  border-bottom: 1px solid rgba(0, 240, 255, 0.3);
}

.cyber-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cyber-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(217, 70, 239, 0.15);
  border: 1px solid #d946ef;
  color: #fae8ff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.cyber-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d946ef;
  box-shadow: 0 0 8px #d946ef;
}

.cyber-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #00f0ff;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
}

.cyber-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cyber-player-tag {
  font-size: 11.5px;
  color: #94a3b8;
}

.cyber-player-tag .highlight {
  color: #a855f7;
  font-weight: 700;
  margin-left: 4px;
}

.cyber-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}

.cyber-close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.cyber-enemy-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px 16px;
  background: rgba(4, 6, 12, 0.6);
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
}

.cyber-champ-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
}

.cyber-champ-card:hover {
  border-color: #00f0ff;
  transform: translateY(-2px);
  background: rgba(0, 240, 255, 0.08);
}

.cyber-champ-card.active {
  border-color: #d946ef;
  background: rgba(217, 70, 239, 0.12);
  box-shadow: 0 0 16px rgba(217, 70, 239, 0.35);
}

.cyber-avatar-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.6), transparent 60%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyber-champ-card.active .cyber-avatar-wrapper {
  background: linear-gradient(135deg, #d946ef, #a855f7);
}

.cyber-avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.cyber-lane-badge {
  position: absolute;
  bottom: -4px;
  background: #090d16;
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: #00f0ff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
}

.cyber-card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cyber-champ-name {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.cyber-threat-tag {
  font-size: 9px;
  font-weight: 700;
}

.threat-high {
  color: #f43f5e;
}
.threat-med {
  color: #a855f7;
}
.threat-low {
  color: #00f0ff;
}

.cyber-body {
  padding: 16px;
}

.cyber-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.cyber-target-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cyan-glow {
  color: #00f0ff;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.cyber-cache-badge {
  font-size: 10px;
  background: rgba(0, 240, 255, 0.15);
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: #00f0ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.cyber-rescan-btn {
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: #00f0ff;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.cyber-rescan-btn:hover:not(:disabled) {
  background: rgba(0, 240, 255, 0.2);
  color: #ffffff;
}

.cyber-rescan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cyber-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
}

.cyber-box {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 14px;
}

.cyber-box-title {
  font-size: 11px;
  color: #00f0ff;
  letter-spacing: 1px;
  margin-bottom: 10px;
  font-weight: 700;
}

.cyber-bullet-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.4;
}

.cyber-bullet-item {
  display: flex;
  gap: 8px;
  color: #cbd5e1;
}

.cyber-bullet-arrow {
  color: #d946ef;
  font-weight: bold;
}

.cyber-counters-row {
  display: flex;
  gap: 8px;
}

.cyber-counter-chip {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.35);
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #f3e8ff;
  flex: 1;
}

.cyber-counter-chip img {
  width: 22px;
  height: 22px;
  border-radius: 4px;
}

.cyber-items-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cyber-item-badge {
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.25);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #e0f2fe;
}

.cyber-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 10.5px;
  color: #94a3b8;
}

.cyber-error-box {
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: #fecdd3;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.cyber-config-btn {
  background: rgba(244, 63, 94, 0.2);
  border: 1px solid rgba(244, 63, 94, 0.5);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

/* ============================================================
   STYLE 03: TACTICAL GAME HUD OVERLAY
============================================================ */
.tactical-hud-frame {
  background: #0f131a;
  border: 1px solid #1e2638;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(59, 130, 246, 0.2);
  color: #f1f5f9;
}

.tactical-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.8));
  border-bottom: 2px solid #1e2638;
}

.tactical-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tactical-light {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #06b6d4;
  box-shadow: 0 0 8px #06b6d4;
}

.tactical-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffffff;
}

.tactical-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tactical-threat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fecdd3;
  padding: 2px 8px;
  font-weight: 700;
}

.tactical-close-btn {
  background: transparent;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
}

.tactical-matrix {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: #1e2638;
  padding: 1px;
}

.tactical-slot {
  background: #0d1117;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tactical-slot:hover {
  background: #141b24;
}

.tactical-slot.selected {
  background: #192231;
}

.tactical-slot.selected::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #60a5fa;
  box-shadow: 0 0 8px #60a5fa;
}

.tactical-avatar-box {
  width: 44px;
  height: 44px;
}

.tactical-avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tactical-pos {
  font-size: 9px;
  color: #06b6d4;
  font-weight: 700;
}

.tactical-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #ffffff;
}

.tactical-body {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  padding: 16px;
  gap: 16px;
  background: #0b0e14;
}

.tactical-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #242e42;
}

.tactical-code {
  font-size: 12px;
  color: #60a5fa;
  font-weight: 700;
}

.tactical-btn {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #60a5fa;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.tactical-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  color: #fff;
}

.tactical-logs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tactical-log-item {
  background: rgba(18, 24, 38, 0.6);
  border-left: 3px solid #60a5fa;
  padding: 8px 12px;
}

.tactical-log-item.danger {
  border-left-color: #f43f5e;
}

.tactical-log-item.purple {
  border-left-color: #a855f7;
}

.tactical-log-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 2px;
}

.tactical-log-desc {
  font-size: 12.5px;
  color: #e2e8f0;
  line-height: 1.4;
}

.tactical-side-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tactical-side-card {
  background: rgba(18, 24, 38, 0.5);
  border: 1px solid #1f2a3e;
  padding: 10px;
}

.tactical-side-title {
  font-size: 10px;
  font-weight: 700;
  color: #06b6d4;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.tactical-counters-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tactical-counter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(11, 15, 25, 0.8);
  border: 1px solid #28354d;
  padding: 4px 8px;
  font-size: 11.5px;
}

.counter-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.counter-left img {
  width: 22px;
  height: 22px;
}

.counter-win {
  font-size: 10.5px;
  color: #60a5fa;
  font-weight: 700;
}

.tactical-item-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tactical-chip {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  font-size: 11px;
  padding: 3px 6px;
  color: #e2e8f0;
}

.tactical-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: #07090d;
  border-top: 1px solid #1a2232;
  font-size: 10px;
  color: #8492a6;
}

.tactical-error-banner {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fecdd3;
  padding: 10px;
  font-size: 11.5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tactical-loading-log {
  font-size: 12px;
  color: #60a5fa;
  font-style: italic;
  padding: 12px 0;
}
</style>
