// Currency -> ISO 3166-1 alpha-2 country code (for flagcdn SVG flags)
export const currencyCountry: Record<string, string> = {
  USD: 'us',
  EUR: 'eu',
  GBP: 'gb',
  JPY: 'jp',
  CHF: 'ch',
  AUD: 'au',
  NZD: 'nz',
  CAD: 'ca',
  CNY: 'cn',
  SGD: 'sg',
  HKD: 'hk',
  BDT: 'bd',
  COP: 'co',
  PHP: 'ph',
  PKR: 'pk',
  DZD: 'dz',
  ARS: 'ar',
  EGP: 'eg',
  ZAR: 'za',
  BRL: 'br',
  IDR: 'id',
  INR: 'in',
  MXN: 'mx',
  NGN: 'ng',
}

export type MarketType = 'otc' | 'real'
export type MarketCategory = 'major' | 'minor' | 'exotic'

export type Market = {
  id: string
  base: string
  quote: string
  type: MarketType
  category: MarketCategory
}

const MAJORS = new Set(['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD'])
const EXOTIC_CCY = new Set(['BDT', 'COP', 'PHP', 'PKR', 'DZD', 'ARS', 'EGP', 'ZAR', 'BRL', 'IDR', 'INR', 'MXN', 'NGN'])

function categorize(base: string, quote: string): MarketCategory {
  if (EXOTIC_CCY.has(base) || EXOTIC_CCY.has(quote)) return 'exotic'
  if (MAJORS.has(`${base}/${quote}`)) return 'major'
  return 'minor'
}

export const CATEGORY_ORDER: MarketCategory[] = ['major', 'minor', 'exotic']

export const CATEGORY_META: Record<MarketCategory, { label: string; hint: string; short: string }> = {
  major: { label: 'Major pairs', hint: 'Highest liquidity · USD crosses', short: 'Major' },
  minor: { label: 'Minor pairs', hint: 'Cross rates without USD', short: 'Minor' },
  exotic: { label: 'Exotic pairs', hint: 'Emerging-market currencies', short: 'Exotic' },
}

export type MarketSection = { category: MarketCategory; markets: Market[] }

export function groupMarkets(markets: Market[]): MarketSection[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    markets: markets.filter((m) => m.category === category),
  })).filter((s) => s.markets.length > 0)
}

function build(pairs: string[], type: MarketType): Market[] {
  return pairs.map((p) => {
    const [base, quote] = p.split('/')
    return { id: `${type}:${p}`, base, quote, type, category: categorize(base, quote) }
  })
}

// OTC pairs (from the Quotex OTC list)
const otcPairs = [
  'NZD/CHF',
  'CHF/JPY',
  'EUR/AUD',
  'EUR/NZD',
  'EUR/USD',
  'GBP/CAD',
  'GBP/CHF',
  'USD/BDT',
  'USD/CAD',
  'USD/CHF',
  'USD/COP',
  'USD/PHP',
  'USD/PKR',
  'AUD/NZD',
  'EUR/CAD',
  'AUD/CAD',
  'CAD/CHF',
  'GBP/USD',
  'CAD/JPY',
  'GBP/JPY',
  'NZD/JPY',
  'AUD/JPY',
  'USD/DZD',
  'EUR/GBP',
  'USD/ARS',
  'USD/EGP',
  'USD/ZAR',
  'EUR/CHF',
  'USD/JPY',
  'GBP/AUD',
  'AUD/CHF',
  'AUD/USD',
  'USD/BRL',
  'EUR/JPY',
  'NZD/CAD',
  'USD/IDR',
  'USD/INR',
  'USD/MXN',
  'USD/NGN',
  'NZD/USD',
  'GBP/NZD',
]

// Real market pairs (majors + minors, no OTC)
const realPairs = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'USD/CAD',
  'AUD/USD',
  'NZD/USD',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'EUR/CHF',
  'AUD/JPY',
  'EUR/AUD',
  'EUR/CAD',
  'GBP/CHF',
  'GBP/CAD',
  'AUD/CAD',
  'AUD/CHF',
  'AUD/NZD',
  'CAD/JPY',
  'CHF/JPY',
  'NZD/JPY',
  'EUR/NZD',
  'GBP/AUD',
  'GBP/NZD',
  'NZD/CAD',
  'NZD/CHF',
  'CAD/CHF',
]

export const otcMarkets = build(otcPairs, 'otc')
export const realMarkets = build(realPairs, 'real')

// Display label — OTC markets are suffixed with "(OTC)"
export function marketLabel(m: Market): string {
  return m.type === 'otc' ? `${m.base}/${m.quote} (OTC)` : `${m.base}/${m.quote}`
}

const LOCAL_FLAGS = new Set(['eu'])

export function flagUrl(currency: string): string {
  const code = currencyCountry[currency] ?? 'un'
  return LOCAL_FLAGS.has(code) ? `/flags/${code}.svg` : `https://flagcdn.com/${code}.svg`
}
