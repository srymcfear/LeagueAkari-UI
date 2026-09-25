export type ChampSelectAiUiStyle = 'cyberpunk' | 'tactical'

export interface ChampSelectAiSettings {
  enabled: boolean
  apiKey: string
  uiStyle: ChampSelectAiUiStyle
  model: string
  autoPopup: boolean
}

export interface MatchupIntelBullet {
  title: string
  text: string
  type?: 'danger' | 'purple' | 'info'
}

export interface CounterChampionPick {
  name: string
  championId?: number
  winRate?: string
}

export interface MatchupIntel {
  myChampionId: number
  myChampionName: string
  enemyChampionId: number
  enemyChampionName: string
  enemyPosition: string
  threatLevel: string
  threatScore: string
  threatColor?: string
  bullets: MatchupIntelBullet[]
  counters: CounterChampionPick[]
  recommendedItems: string[]
  cached?: boolean
  timestamp?: number
}

export interface ChampSelectEnemySlot {
  cellId: number
  championId: number
  championName: string
  position: string
}

export interface AramAugmentTip {
  name: string
  tier?: 'S' | 'A' | 'B'
  desc: string
  synergy: string
}

export interface AramTacticsBullet {
  title: string
  text: string
  type?: 'danger' | 'purple' | 'info'
}

export interface AramChampionIntel {
  championId: number
  championName: string
  buildStyle: string
  tierGrade: string
  augments: AramAugmentTip[]
  coreItems: string[]
  summonerSpells: string[]
  tactics: AramTacticsBullet[]
  combatTips: string[]
  mayhemBuffNotes?: string
  cached?: boolean
  timestamp?: number
}
