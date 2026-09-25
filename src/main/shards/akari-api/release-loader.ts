import {
  type AkariApiLanguage,
  type AkariRelease,
  type AkariReleaseArtifact,
  AkariReleaseSchema
} from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'
import semver from 'semver'

import { type AkariApiMainContext, GITHUB_RELEASE_API_URL } from './context'

export interface GitHubReleaseAsset {
  name: string
  size: number
  content_type?: string
  browser_download_url: string
}

export interface GitHubReleaseResponse {
  tag_name?: string
  name?: string
  body?: string
  published_at?: string
  assets?: GitHubReleaseAsset[]
}

export function parseGitHubReleaseToAkariRelease(data: any): AkariRelease | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  // 1. Resolve version from tag_name or release title
  let version: string | null = null
  if (data.tag_name && data.tag_name !== 'main' && data.tag_name !== 'latest') {
    version = semver.clean(data.tag_name) || semver.coerce(data.tag_name)?.version || null
  }
  if (!version && data.name) {
    version = semver.coerce(data.name)?.version || null
  }
  if (!version && data.tag_name) {
    version = semver.coerce(data.tag_name)?.version || null
  }

  if (!version || !semver.valid(version)) {
    return null
  }

  const publishedAt = data.published_at
    ? new Date(data.published_at).toISOString()
    : new Date().toISOString()
  const description = data.body || data.name || ''

  const artifacts: AkariReleaseArtifact[] = []
  if (Array.isArray(data.assets)) {
    for (const asset of data.assets) {
      const fileName: string = asset.name || ''
      const lower = fileName.toLowerCase()
      // Look for .7z files intended for Windows x64
      if (lower.endsWith('.7z')) {
        artifacts.push({
          platform: 'win32',
          arch: 'x64',
          fileName,
          size: typeof asset.size === 'number' ? asset.size : 0,
          contentType: 'application/x-7z-compressed',
          sha256: null,
          downloadUrl: asset.browser_download_url
        })
      }
    }
  }

  return {
    version,
    publishedAt,
    description,
    artifacts
  }
}

export class AkariApiReleaseLoader {
  private _updatePromise: Promise<AkariRelease> | null = null
  private _githubHttp: AxiosInstance | null = null

  constructor(private readonly _context: AkariApiMainContext) {
    if (_context.githubHttp) {
      this._githubHttp = _context.githubHttp
    } else if (_context.network) {
      this._githubHttp = _context.network.createAxiosClient({
        timeout: 10_000,
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'LeagueAkari'
        }
      })
    }
  }

  updateLatestRelease(language: AkariApiLanguage) {
    if (this._updatePromise) {
      return this._updatePromise
    }

    this._context.state.setUpdatingLatestRelease(true)

    const updatePromise = this._fetchLatestRelease(language)
      .then((release) => {
        this._context.state.setLatestRelease(release)
        this._context.logger.info(`Updated latest release: v${release.version}`)
        return release
      })
      .catch((error) => {
        this._context.logger.warn('Update latest release failed', error)
        throw error
      })
      .finally(() => {
        this._context.state.setUpdatingLatestRelease(false)
        if (this._updatePromise === updatePromise) {
          this._updatePromise = null
        }
      })

    this._updatePromise = updatePromise
    return updatePromise
  }

  private async _fetchLatestRelease(language: AkariApiLanguage): Promise<AkariRelease> {
    // 1. First, attempt to fetch from GitHub Releases of srymcfear/LeagueAkari-UI
    try {
      const release = await this._fetchFromGitHub()
      if (release) {
        return AkariReleaseSchema.parse(release)
      }
    } catch (err) {
      this._context.logger.warn(
        'Failed to fetch latest release from GitHub, falling back to upstream Akari API',
        err
      )
    }

    // 2. Fallback to upstream Akari API
    const response = await this._context.api.getLatestRelease(language)
    return AkariReleaseSchema.parse(response.data)
  }

  private async _fetchFromGitHub(): Promise<AkariRelease | null> {
    if (!this._githubHttp) {
      return null
    }

    const response = await this._githubHttp.get<GitHubReleaseResponse>(GITHUB_RELEASE_API_URL)
    return parseGitHubReleaseToAkariRelease(response.data)
  }
}
