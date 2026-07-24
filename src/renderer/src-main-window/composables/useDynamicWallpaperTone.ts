import { onUnmounted, watch, type Ref } from 'vue'

function quantize(pixels: number[][], k: number): number[][] {
  if (pixels.length <= k) return pixels.slice()

  let centers = pixels.slice(0, k)

  for (let iter = 0; iter < 12; iter++) {
    const clusters: number[][][] = Array.from({ length: k }, () => [])

    for (const p of pixels) {
      let minDist = Infinity, closest = 0
      for (let i = 0; i < k; i++) {
        const d = (p[0] - centers[i][0]) ** 2 + (p[1] - centers[i][1]) ** 2 + (p[2] - centers[i][2]) ** 2
        if (d < minDist) { minDist = d; closest = i }
      }
      clusters[closest].push(p)
    }

    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue
      const sum = [0, 0, 0]
      for (const p of clusters[i]) { sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2] }
      const n = clusters[i].length
      centers[i] = [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)]
    }
  }

  const sizes = centers.map((c, i) => ({
    center: c,
    count: pixels.filter((p) => {
      let minDist = Infinity, closest = 0
      for (let j = 0; j < k; j++) {
        const d = (p[0] - centers[j][0]) ** 2 + (p[1] - centers[j][1]) ** 2 + (p[2] - centers[j][2]) ** 2
        if (d < minDist) { minDist = d; closest = j }
      }
      return closest === i
    }).length
  }))

  sizes.sort((a, b) => b.count - a.count)
  return sizes.map(s => s.center)
}

function extractColors(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): [string, string] | null {
  const W = 120, H = 90
  canvas.width = W
  canvas.height = H
  ctx.drawImage(img, 0, 0, W, H)

  const data = ctx.getImageData(0, 0, W, H).data
  const samples: number[][] = []

  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const i = (y * W + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
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

  const c1 = colors[0]
  const s1 = `${c1[0]},${c1[1]},${c1[2]}`

  if (colors.length < 2) return [`${s1}`, `${s1}`]

  const c2 = colors[1]
  return [`${s1}`, `${c2[0]},${c2[1]},${c2[2]}`]
}

export function useDynamicWallpaperTone(imageUrl: Ref<string | null>) {
  let destroyed = false

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const apply = (c1: string, c2: string) => {
    const root = document.documentElement
    root.style.setProperty('--la-wallpaper-dynamic-glow-1', c1)
    root.style.setProperty('--la-wallpaper-dynamic-glow-2', c2)
  }

  const clear = () => {
    const root = document.documentElement
    root.style.removeProperty('--la-wallpaper-dynamic-glow-1')
    root.style.removeProperty('--la-wallpaper-dynamic-glow-2')
  }

  watch(imageUrl, (url, _, onCleanup) => {
    clear()
    if (!url) return

    let cancelled = false
    onCleanup(() => { cancelled = true })

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled || destroyed) return
      const result = extractColors(canvas, ctx, img)
      if (result) apply(result[0], result[1])
    }
    img.onerror = clear
    img.src = url
  })

  onUnmounted(() => {
    destroyed = true
    clear()
  })
}
