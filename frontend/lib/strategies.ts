// Signal strategies shared by Live Signals, Coco Injector and Future Signals.

export type StrategyId = 'smartflow' | 'alphagrid' | 'auralis' | 'zenx' | 'algoryx'

export type Strategy = {
  id: StrategyId
  name: string
  tagline: string
  note: string
  /** 480x720 artwork (no baked title — the title is rendered as text) */
  img: string
  /** 240x360 variant used on phones + the small field thumb */
  imgSm: string
  accent: string
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'smartflow',
    name: 'Coco SmartFlow',
    tagline: 'Momentum flow read',
    note: 'Follows the dominant liquidity stream and rides confirmed momentum.',
    img: '/strategy/card-smartflow-v3.webp',
    imgSm: '/strategy/card-smartflow-v3-sm.webp',
    accent: '#8b5cff',
  },
  {
    id: 'alphagrid',
    name: 'Coco AlphaGrid',
    tagline: 'Structure grid scan',
    note: 'Maps support, resistance and volatility cells before every call.',
    img: '/strategy/card-alphagrid-v3.webp',
    imgSm: '/strategy/card-alphagrid-v3-sm.webp',
    accent: '#4fd1ff',
  },
  {
    id: 'auralis',
    name: 'Coco Auralis',
    tagline: 'Sentiment aura model',
    note: 'Blends pressure, sentiment and reversal aura for contrarian entries.',
    img: '/strategy/card-auralis-v3.webp',
    imgSm: '/strategy/card-auralis-v3-sm.webp',
    accent: '#6ee7b7',
  },
  {
    id: 'zenx',
    name: 'Coco Zenx',
    tagline: 'Calm range balance',
    note: 'Waits for quiet, balanced ranges and plays the clean mean reversion.',
    img: '/strategy/card-zenx-v3.webp',
    imgSm: '/strategy/card-zenx-v3-sm.webp',
    accent: '#c4a6ff',
  },
  {
    id: 'algoryx',
    name: 'Coco Algoryx',
    tagline: 'Algorithmic core',
    note: 'Runs a multi-factor algorithmic core that stacks every confirmation.',
    img: '/strategy/card-algoryx-v3.webp',
    imgSm: '/strategy/card-algoryx-v3-sm.webp',
    accent: '#ffb457',
  },
]

export const DEFAULT_STRATEGY: StrategyId = 'smartflow'

export function getStrategy(id: StrategyId): Strategy {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0]
}
