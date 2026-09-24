import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { MatchupIntel } from '@shared/types/champ-select-ai'
import { z } from 'zod'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { GeminiClient } from './gemini-client'
import { ChampSelectAiRuntimeState, ChampSelectAiSettingsState } from './state'

export const CHAMP_SELECT_AI_NAMESPACE = 'champ-select-ai'

@Shard(ChampSelectAiMain.id)
export class ChampSelectAiMain implements IAkariShardInitDispose {
  static id = CHAMP_SELECT_AI_NAMESPACE

  public readonly settings = new ChampSelectAiSettingsState()
  public readonly state = new ChampSelectAiRuntimeState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<ChampSelectAiSettingsState>
  private readonly _cache = new Map<string, MatchupIntel>()

  constructor(
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._logger = _loggerFactory.create(ChampSelectAiMain.id)
    this._settingService = _settingFactory.register(
      ChampSelectAiMain.id,
      {
        enabled: {
          default: true,
          schema: z.boolean()
        },
        apiKey: {
          default: '',
          schema: z.string()
        },
        uiStyle: {
          default: 'cyberpunk',
          schema: z.enum(['cyberpunk', 'tactical'])
        },
        model: {
          default: 'gemini-3.6-flash',
          schema: z.string()
        },
        autoPopup: {
          default: true,
          schema: z.boolean()
        }
      },
      this.settings
    )
  }

  async onInit() {
    await this._settingService.applyToState()

    if (!this.settings.model || this.settings.model === 'gemini-2.5-flash') {
      this.settings.setModel('gemini-3.6-flash')
      await this._settingService.set('model', 'gemini-3.6-flash')
    }

    this._mobxUtils.propSync(ChampSelectAiMain.id, 'settings', this.settings, [
      'enabled',
      'apiKey',
      'uiStyle',
      'model',
      'autoPopup'
    ])

    this._mobxUtils.propSync(ChampSelectAiMain.id, 'state', this.state, [
      'isAnalyzing',
      'lastError'
    ])

    this._setupIpcHandlers()
    this._setupChampSelectListener()
  }

  async onDispose(): Promise<void> {
    this._cache.clear()
  }

  private _setupIpcHandlers() {
    this._ipc.onCall(
      ChampSelectAiMain.id,
      'testApiKey',
      async (_, apiKey?: string, model?: string) => {
        const key = apiKey ?? this.settings.apiKey
        const targetModel = model ?? this.settings.model
        return await GeminiClient.testApiKey(key, targetModel)
      }
    )

    this._ipc.onCall(
      ChampSelectAiMain.id,
      'analyzeMatchup',
      async (
        _,
        params: {
          myChampionName: string
          myChampionId: number
          enemyChampionName: string
          enemyChampionId: number
          enemyPosition?: string
          forceRefresh?: boolean
        }
      ) => {
        const {
          myChampionName,
          myChampionId,
          enemyChampionName,
          enemyChampionId,
          enemyPosition = 'MID',
          forceRefresh = false
        } = params

        const cacheKey = `${myChampionId || myChampionName}:${enemyChampionId || enemyChampionName}:${enemyPosition}`

        if (!forceRefresh && this._cache.has(cacheKey)) {
          const cached = this._cache.get(cacheKey)!
          return { ...cached, cached: true }
        }

        this.state.setIsAnalyzing(true)
        this.state.setLastError(null)

        try {
          const intel = await GeminiClient.analyzeMatchup({
            apiKey: this.settings.apiKey,
            model: this.settings.model,
            myChampionName,
            myChampionId,
            enemyChampionName,
            enemyChampionId,
            enemyPosition
          })

          this._cache.set(cacheKey, intel)
          return intel
        } catch (err: any) {
          const message = err?.message || 'Lỗi không xác định khi phân tích đối đầu'
          this.state.setLastError(message)
          this._logger.error(`Error analyzing matchup: ${message}`)
          throw err
        } finally {
          this.state.setIsAnalyzing(false)
        }
      }
    )

    this._ipc.onCall(ChampSelectAiMain.id, 'clearCache', async () => {
      this._cache.clear()
      return true
    })
  }

  private _setupChampSelectListener() {
    // Clear cache when entering a new champ select session
    this._mobxUtils.reaction(
      () => this._leagueClient.data.champSelect.session?.gameId,
      (gameId) => {
        if (gameId) {
          this._cache.clear()
        }
      }
    )
  }
}
