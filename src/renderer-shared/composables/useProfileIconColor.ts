import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { type Ref, ref, watch } from 'vue'

const cache = new Map<number, string | null>()
const pending = new Map<number, Promise<string | null>>()

function quantize(pixels: number[][], k: number): number[][] {
  if (pixels.length <= k) return pixels.slice()

  let centers = pixels.slice(0, k)

  for (let iter = 0; iter < 12; iter++) {
    const clusters: number[][][] = Array.from({ length: k }, () => [])

    for (const p of pixels) {
      let minDist = Infinity,
        closest = 0
      for (let i = 0; i < k; i++) {
        const d =
          (p[0] - centers[i][0]) ** 2 + (p[1] - centers[i][1]) ** 2 + (p[2] - centers[i][2]) ** 2
        if (d < minDist) {
          minDist = d
          closest = i
        }
      }
      clusters[closest].push(p)
    }

    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue
      const sum = [0, 0, 0]
      for (const p of clusters[i]) {
        sum[0] += p[0]
        sum[1] += p[1]
        sum[2] += p[2]
      }
      const n = clusters[i].length
      centers[i] = [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)]
    }
  }

  const sizes = centers.map((c, i) => ({
    center: c,
    count: pixels.filter((p) => {
      let minDist = Infinity,
        closest = 0
      for (let j = 0; j < k; j++) {
        const d =
          (p[0] - centers[j][0]) ** 2 + (p[1] - centers[j][1]) ** 2 + (p[2] - centers[j][2]) ** 2
        if (d < minDist) {
          minDist = d
          closest = j
        }
      }
      return closest === i
    }).length
  }))

  sizes.sort((a, b) => b.count - a.count)
  return sizes.map((s) => s.center)
}

function extractColorFromImage(img: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const W = 60,
    H = 60
  canvas.width = W
  canvas.height = H
  ctx.drawImage(img, 0, 0, W, H)

  const data = ctx.getImageData(0, 0, W, H).data
  const samples: number[][] = []

  for (let y = 0; y < H; y += 3) {
    for (let x = 0; x < W; x += 3) {
      const i = (y * W + x) * 4
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2]
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      if (brightness < 35) continue
      const saturation = Math.max(r, g, b) - Math.min(r, g, b)
      if (saturation < 15) continue
      samples.push([r, g, b])
    }
  }

  if (samples.length < 8) return null

  const colors = quantize(samples, 2)
  if (colors.length < 1) return null

  const c = colors[0]
  return `${c[0]},${c[1]},${c[2]}`
}

function loadAndExtract(iconId: number): Promise<string | null> {
  const existing = pending.get(iconId)
  if (existing) return existing

  const p = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const color = extractColorFromImage(img)
      cache.set(iconId, color)
      pending.delete(iconId)
      resolve(color)
    }
    img.onerror = () => {
      cache.set(iconId, null)
      pending.delete(iconId)
      resolve(null)
    }
    img.src = profileIconUri(iconId)
  })

  pending.set(iconId, p)
  return p
}

export function useProfileIconColor(iconIdRef: Ref<number | null>) {
  const color = ref<string | null>(null)

  watch(
    iconIdRef,
    (id) => {
      if (id == null) {
        color.value = null
        return
      }
      if (cache.has(id)) {
        color.value = cache.get(id)!
        return
      }
      loadAndExtract(id).then((c) => {
        if (iconIdRef.value === id) {
          color.value = c
        }
      })
    },
    { immediate: true }
  )

  return color
}
