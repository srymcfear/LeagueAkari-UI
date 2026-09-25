<template>
  <div class="aram-guide-mini-container" :class="aiStore.settings.uiStyle">
    <!-- Champion Header Bar -->
    <div class="champ-header-card">
      <div class="champ-avatar-box">
        <img :src="currentChampionIconUrl" :alt="currentChampionName" class="champ-avatar" />
        <span class="tier-badge">{{ intel?.tierGrade || 'S TIER' }}</span>
      </div>

      <div class="champ-meta-box">
        <div class="champ-title-row">
          <span class="champ-name">{{ currentChampionName }}</span>
          <span class="mayhem-tag">ARAM HỖN LOẠN</span>
        </div>
        <div class="champ-build-style">
          <span class="style-icon">◈</span>
          <span class="style-text">{{ intel?.buildStyle || 'Đột Biến Sức Mạnh Vực Gió Hú' }}</span>
        </div>
      </div>

      <button
        class="rescan-btn"
        :disabled="aiStore.isAnalyzing || currentChampionId <= 0"
        @click="handleOptimize(true)"
        title="Phân tích lại tối ưu tướng bằng Gemini AI"
      >
        <span v-if="aiStore.isAnalyzing" class="btn-spinner"></span>
        <span v-else>⚡ TỐI ƯU</span>
      </button>
    </div>

    <!-- Scrollable Content -->
    <NScrollbar class="guide-scroll-body">
      <div class="guide-content-wrap">
        <!-- Analyzing State -->
        <div v-if="aiStore.isAnalyzing" class="analyzing-state">
          <div class="cyber-pulse"></div>
          <div class="analyzing-text">
            Gemini AI đang phân tích Lõi Nâng Cấp & lối đánh đột biến cho
            <b>{{ currentChampionName }}</b
            >...
          </div>
        </div>

        <template v-else>
          <!-- Missing champion warning -->
          <div v-if="currentChampionId <= 0" class="no-champ-state">
            <span class="empty-icon">⏳</span>
            <span>Vui lòng chọn hoặc khóa tướng trong ARAM để xem hướng dẫn tối ưu.</span>
          </div>

          <template v-else>
            <!-- 1. Augments (Lõi Nâng Cấp Đột Biến) -->
            <div class="guide-section-card">
              <div class="section-title-bar">
                <span class="title-glyph">✦</span>
                <span class="title-text">LÕI NÂNG CẤP ĐỘT BIẾN (TOP AUGMENTS)</span>
                <span v-if="intel?.cached" class="cache-badge">⚡ CACHED</span>
              </div>

              <div class="augments-list">
                <div
                  v-for="(aug, idx) in intel?.augments || []"
                  :key="idx"
                  class="augment-item"
                  :class="`tier-${aug.tier?.toLowerCase() || 's'}`"
                >
                  <div class="aug-header">
                    <span class="aug-tier">{{ aug.tier || 'S' }}</span>
                    <span class="aug-name">{{ aug.name }}</span>
                  </div>
                  <div class="aug-desc">{{ aug.desc }}</div>
                  <div v-if="aug.synergy" class="aug-synergy">
                    <span class="synergy-label">⚡ Cộng Hưởng:</span>
                    <span>{{ aug.synergy }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Core Items & Summoner Spells -->
            <div class="guide-section-card">
              <div class="section-title-bar">
                <span class="title-glyph">✦</span>
                <span class="title-text">TRANG BỊ & PHÉP BỔ TRỢ KHUYÊN DÙNG</span>
              </div>

              <!-- Spells -->
              <div class="spells-row">
                <span class="row-subtitle">Phép Bổ Trợ:</span>
                <div class="spells-list">
                  <span
                    v-for="(spell, idx) in intel?.summonerSpells || [
                      'Tốc Biến',
                      'Đánh Dấu (Cầu Tuyết)'
                    ]"
                    :key="idx"
                    class="spell-pill"
                  >
                    ✨ {{ spell }}
                  </span>
                </div>
              </div>

              <!-- Items -->
              <div class="items-row">
                <span class="row-subtitle">Trấn Phái:</span>
                <div class="items-chips">
                  <span v-for="(item, idx) in intel?.coreItems || []" :key="idx" class="item-chip">
                    🛡️ {{ item }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 3. Combat Tactics (Mẹo Giao Tranh) -->
            <div class="guide-section-card">
              <div class="section-title-bar">
                <span class="title-glyph">✦</span>
                <span class="title-text">CHIẾN THUẬT & COMBO HỖN LOẠN</span>
              </div>

              <div class="tactics-list">
                <div
                  v-for="(tactic, idx) in intel?.tactics || []"
                  :key="idx"
                  class="tactic-item"
                  :class="tactic.type || 'info'"
                >
                  <span class="tactic-bullet">◆</span>
                  <div class="tactic-body">
                    <div class="tactic-title">{{ tactic.title }}</div>
                    <div class="tactic-desc">{{ tactic.text }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Mayhem Combat Quick Tips -->
            <div v-if="intel?.combatTips?.length" class="guide-section-card">
              <div class="section-title-bar">
                <span class="title-glyph">✦</span>
                <span class="title-text">MẸO KHAI THÁC CƠ CHẾ MAYHEM</span>
              </div>

              <div class="quick-tips-list">
                <div v-for="(tip, idx) in intel.combatTips" :key="idx" class="quick-tip-row">
                  <span class="tip-dot">▸</span>
                  <span class="tip-text">{{ tip }}</span>
                </div>
              </div>

              <div v-if="intel?.mayhemBuffNotes" class="mayhem-buff-footer">
                <span>💬 {{ intel.mayhemBuffNotes }}</span>
              </div>
            </div>
          </template>
        </template>
      </div>
    </NScrollbar>

    <!-- Footer Bar -->
    <div class="guide-footer-bar">
      <span>AI ENGINE: GEMINI TACTICAL ARAM</span>
      <span class="footer-status">CHẾ ĐỘ: ARAM HỖN LOẠN</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { ChampSelectAiRenderer } from '@renderer-shared/shards/champ-select-ai'
import { useChampSelectAiStore } from '@renderer-shared/shards/champ-select-ai/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { AramChampionIntel } from '@shared/types/champ-select-ai'
import { NScrollbar } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const aiStore = useChampSelectAiStore()
const aiRenderer = useInstance(ChampSelectAiRenderer)
const leagueClientStore = useLeagueClientStore()
const resources = useAkariResourceProvider()

const intel = ref<AramChampionIntel | null>(null)

const currentChampionId = computed(() => leagueClientStore.champSelect.currentChampion ?? 0)

const currentChampionName = computed(() => {
  if (currentChampionId.value <= 0) return 'Đang chờ chọn tướng...'
  return resources.champions.name(currentChampionId.value) || `Tướng #${currentChampionId.value}`
})

const currentChampionIconUrl = computed(() => {
  if (currentChampionId.value > 0) {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${currentChampionId.value}.png`
  }
  return 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png'
})

async function handleOptimize(forceRefresh = false) {
  if (currentChampionId.value <= 0) return

  try {
    const result = await aiRenderer.optimizeAramChampion({
      championName: currentChampionName.value,
      championId: currentChampionId.value,
      forceRefresh
    })
    intel.value = result
  } catch {
    // fallback is handled by backend service
  }
}

// Watch champion pick changes in ARAM Champ Select
watch(
  () => currentChampionId.value,
  (newChampId) => {
    if (newChampId > 0) {
      handleOptimize(false)
    } else {
      intel.value = null
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.aram-guide-mini-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: inherit;
  font-size: 11.5px;
  background: #090d16;
  color: #e2e8f0;
}

/* Header Card */
.champ-header-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  flex-shrink: 0;
  backdrop-filter: blur(12px);
}

.champ-avatar-box {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.champ-avatar {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1.5px solid #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
  object-fit: cover;
}

.tier-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.5px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #d946ef;
  color: #ffffff;
  box-shadow: 0 0 6px rgba(217, 70, 239, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.champ-meta-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.champ-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.champ-name {
  font-weight: 800;
  font-size: 13px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
}

.mayhem-tag {
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(0, 240, 255, 0.15);
  color: #00f0ff;
  border: 1px solid rgba(0, 240, 255, 0.4);
  white-space: nowrap;
}

.champ-build-style {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #c084fc;
}

.style-icon {
  font-size: 8px;
  color: #00f0ff;
}

.style-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.rescan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid #00f0ff;
  color: #00f0ff;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
  flex-shrink: 0;
}

.rescan-btn:hover:not(:disabled) {
  background: #00f0ff;
  color: #000000;
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.5);
  transform: translateY(-1px);
}

.rescan-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-top-color: #00f0ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Scroll Body */
.guide-scroll-body {
  flex: 1;
  height: 0;
}

.guide-content-wrap {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* State screens */
.analyzing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 16px;
  text-align: center;
}

.cyber-pulse {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #00f0ff;
  box-shadow: 0 0 12px #00f0ff;
  animation: cyber-ring 1s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes cyber-ring {
  from {
    transform: scale(0.85);
    opacity: 0.4;
  }
  to {
    transform: scale(1.25);
    opacity: 1;
  }
}

.analyzing-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.no-champ-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  font-size: 24px;
}

/* Section Cards */
.guide-section-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 4px;
}

.title-glyph {
  font-size: 9px;
  color: #00f0ff;
}

.title-text {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #00f0ff;
  flex: 1;
}

.cache-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(217, 70, 239, 0.2);
  color: #d946ef;
  border: 1px solid rgba(217, 70, 239, 0.4);
}

/* Augments */
.augments-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.augment-item {
  padding: 6px 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #3b82f6;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all 0.15s ease;
}

.augment-item.tier-s {
  border-left-color: #d946ef;
  background: rgba(217, 70, 239, 0.05);
}

.augment-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.aug-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aug-tier {
  font-size: 8.5px;
  font-weight: 900;
  padding: 0 4px;
  border-radius: 2px;
  background: #d946ef;
  color: #ffffff;
}

.augment-item.tier-a .aug-tier {
  background: #3b82f6;
}

.aug-name {
  font-weight: 700;
  font-size: 11px;
  color: #ffffff;
}

.aug-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.35;
}

.aug-synergy {
  font-size: 9.5px;
  color: #38bdf8;
  line-height: 1.3;
}

.synergy-label {
  font-weight: 700;
  color: #00f0ff;
  margin-right: 3px;
}

/* Spells and Items */
.spells-row,
.items-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-subtitle {
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.3px;
}

.spells-list,
.items-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.spell-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.item-chip {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #93c5fd;
}

/* Tactics */
.tactics-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tactic-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.tactic-bullet {
  font-size: 8px;
  margin-top: 2px;
  color: #00f0ff;
  flex-shrink: 0;
}

.tactic-item.danger .tactic-bullet {
  color: #f43f5e;
}

.tactic-item.purple .tactic-bullet {
  color: #d946ef;
}

.tactic-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tactic-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
}

.tactic-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

/* Quick Tips */
.quick-tips-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-tip-row {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.tip-dot {
  font-size: 8px;
  color: #00f0ff;
  flex-shrink: 0;
  margin-top: 1px;
}

.mayhem-buff-footer {
  margin-top: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  background: rgba(0, 240, 255, 0.08);
  border: 1px dashed rgba(0, 240, 255, 0.3);
  font-size: 9.5px;
  color: #38bdf8;
  line-height: 1.35;
}

/* Footer Bar */
.guide-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.footer-status {
  color: #00f0ff;
}
</style>
