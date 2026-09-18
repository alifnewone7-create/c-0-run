/**
 * Instant image layer.
 *
 * Every local image (and every flag icon that gets used) is fetched once,
 * converted to a base64 data URL and stored in localStorage. After the first
 * visit each image renders from local storage, so it paints instantly with
 * zero network round trips.
 */

export const CACHE_KEY = 'coco:asset-cache:v1'

/** Images shipped with the app - warmed on the very first visit. */
export const CORE_ASSETS = [
  '/coco-ai.jpg',
  '/coco-profile.png',
  '/sweetex-logo.jpg',
  '/sweetex-profile.png',
  '/broker-binolla.png',
  '/broker-quotex.png',
  '/broker-pocketoption.png',
]

/** Flags used across the signal tables / news feed. */
const FLAG_CODES = [
  'us', 'eu', 'gb', 'jp', 'ch', 'ca', 'au', 'nz', 'br', 'in',
  'za', 'tr', 'mx', 'sg', 'cn', 'ng', 'ar', 'pk', 'bd', 'id',
  'ma', 'dz', 'tn', 'eg', 'sa', 'ae', 'ru', 'no', 'se', 'pl',
]

export const FLAG_ASSETS = FLAG_CODES.map((c) => (c === 'eu' ? '/flags/eu.svg' : `https://flagcdn.com/${c}.svg`))

export const ALL_ASSETS = [...CORE_ASSETS, ...FLAG_ASSETS]

type CacheMap = Record<string, string>

let memory: CacheMap | null = null

function isBrowser() {
  return typeof window !== 'undefined'
}

export function loadCache(): CacheMap {
  if (memory) return memory
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    memory = raw ? (JSON.parse(raw) as CacheMap) : {}
  } catch {
    memory = {}
  }
  return memory
}

let flushTimer: ReturnType<typeof setTimeout> | null = null

function flush() {
  if (!isBrowser() || !memory) return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(memory))
  } catch {
    // Quota exceeded - drop the flags first, keep the core artwork.
    try {
      const trimmed: CacheMap = {}
      for (const key of CORE_ASSETS) {
        if (memory[key]) trimmed[key] = memory[key]
      }
      memory = trimmed
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
    } catch {
      /* give up silently - images still load from the network */
    }
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, 300)
}

export function getCached(src: string): string | undefined {
  if (!src) return undefined
  return loadCache()[normalize(src)]
}

/** Same-origin absolute URLs are stored by their pathname. */
export function normalize(src: string): string {
  if (!src) return src
  if (src.startsWith('data:')) return src
  if (!isBrowser()) return src
  try {
    const url = new URL(src, window.location.origin)
    return url.origin === window.location.origin ? url.pathname : url.href
  } catch {
    return src
  }
}

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { cache: 'force-cache' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.size > 1_200_000) return null
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const inflight = new Set<string>()

/** Fetch + store a single asset (no-op when already cached). */
export async function cacheAsset(src: string): Promise<string | null> {
  if (!isBrowser() || !src || src.startsWith('data:')) return null
  const key = normalize(src)
  const cache = loadCache()
  if (cache[key]) return cache[key]
  if (inflight.has(key)) return null
  inflight.add(key)
  const dataUrl = await toDataUrl(src)
  inflight.delete(key)
  if (!dataUrl) return null
  cache[key] = dataUrl
  memory = cache
  scheduleFlush()
  return dataUrl
}

/** Warm every known asset, reporting 0..1 progress. */
export async function warmAssetCache(
  onProgress?: (ratio: number) => void,
): Promise<void> {
  if (!isBrowser()) return
  const list = ALL_ASSETS
  let done = 0
  const step = () => {
    done += 1
    onProgress?.(done / list.length)
  }

  // Core artwork first (that is what the user sees immediately).
  await Promise.all(
    CORE_ASSETS.map(async (src) => {
      await cacheAsset(src)
      step()
    }),
  )
  flush()

  await Promise.all(
    FLAG_ASSETS.map(async (src) => {
      await cacheAsset(src)
      step()
    }),
  )
  flush()
}

export function isCacheWarm(): boolean {
  const cache = loadCache()
  return CORE_ASSETS.every((src) => Boolean(cache[src]))
}
