'use client'

import { useEffect } from 'react'
import {
  cacheAsset,
  getCached,
  loadCache,
  normalize,
  warmAssetCache,
} from '@/lib/asset-cache'

/**
 * Swaps every <img> src with its cached data URL (when available) and caches
 * anything new it runs into. Works for next/image output too, because the app
 * runs with `images.unoptimized`, so the rendered src is the raw asset path.
 */
function patch(img: HTMLImageElement) {
  const raw = img.getAttribute('src')
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return

  const key = normalize(raw)
  const isLocal = key.startsWith('/')
  const isFlag = key.includes('flagcdn.com')
  if (!isLocal && !isFlag) return

  const hit = getCached(raw)
  if (hit) {
    if (img.dataset.cachedSrc !== key) {
      img.dataset.cachedSrc = key
      img.setAttribute('src', hit)
      img.removeAttribute('srcset')
      img.setAttribute('loading', 'eager')
      img.setAttribute('decoding', 'sync')
    }
    return
  }

  if (img.dataset.cachePending === key) return
  img.dataset.cachePending = key
  void cacheAsset(raw).then((dataUrl) => {
    if (!dataUrl) return
    if (img.getAttribute('src') === raw) {
      img.dataset.cachedSrc = key
      img.setAttribute('src', dataUrl)
      img.removeAttribute('srcset')
    }
  })
}

function patchAll(root: ParentNode = document) {
  root.querySelectorAll?.('img').forEach((el) => patch(el as HTMLImageElement))
}

export function AssetCacheProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    loadCache()
    patchAll()

    // Warm every image into localStorage in the background (no loading screen).
    void warmAssetCache().then(() => patchAll())

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
          patch(record.target)
          continue
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) patch(node)
          else if (node instanceof HTMLElement) patchAll(node)
        })
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
