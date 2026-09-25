import type { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import type { AxiosInstance } from 'axios'

import type { AppCommonMain } from '../app-common'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { NetworkMain } from '../network'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AkariApiState } from './state'

export const AKARI_API_CACHED_RESOURCE_UPDATE_INTERVAL = 2 * 60 * 60 * 1000
export const AKARI_API_FEATURE_GATES_UPDATE_INTERVAL = 2 * 60 * 60 * 1000
export const AKARI_API_NOTICE_UPDATE_INTERVAL = 60 * 60 * 1000

export const GITHUB_RELEASE_REPO = 'srymcfear/LeagueAkari-UI'
export const GITHUB_RELEASE_API_URL = `https://api.github.com/repos/${GITHUB_RELEASE_REPO}/releases/latest`

export interface AkariApiMainContext {
  state: AkariApiState
  logger: AkariLogger
  settingService: SetterSettingService
  mobxUtils: MobxUtilsMain
  appCommon: AppCommonMain
  api: AkariApiHttpApiAxiosHelper
  network?: NetworkMain
  githubHttp?: AxiosInstance
}
