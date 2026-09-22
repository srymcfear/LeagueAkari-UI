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
