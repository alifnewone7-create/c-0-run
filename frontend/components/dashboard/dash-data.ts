import {
  LayoutDashboard,
  SatelliteDish,
  Syringe,
  Orbit,
  Megaphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type ToolCard = { id: string; name: string; tagline: string; href: string; img: string }

export const TOOL_CARDS: ToolCard[] = [
  { id: 'injector', name: 'Coco Injector', tagline: 'Timed 2 / 5 / 10 min injections', href: '/injector', img: '/dash/card-injector-v2.webp' },
  { id: 'analyzer', name: 'Chart Analyzer', tagline: 'AI verdict from a chart screenshot', href: '/otc-chart-analyzer', img: '/dash/card-analyzer-v2.webp' },
  { id: 'live', name: 'Live Signal', tagline: 'Real-time entries as they fire', href: '/live-signals', img: '/dash/card-live-v2.webp' },
  { id: 'future', name: 'Future Signal', tagline: 'Scheduled calls ahead of the move', href: '/future-signals', img: '/dash/card-future-v2.webp' },
  { id: 'news', name: 'News Signal', tagline: 'Trade the headline as it lands', href: '/news-signals', img: '/dash/card-news-v2.webp' },
  { id: 'money', name: 'Money Management', tagline: 'Risk, sizing and session plan', href: '/management', img: '/dash/card-money-v2.webp' },
]

export type NavLink = { label: string; href: string; icon: LucideIcon }
export type NavSection = { heading: string | null; links: NavLink[] }

export const SIDEBAR_SECTIONS: NavSection[] = [
  { heading: null, links: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  {
    heading: 'Signal System',
    links: [
      { label: 'Live Signals', href: '/live-signals', icon: SatelliteDish },
      { label: 'Coco Injector', href: '/injector', icon: Syringe },
      { label: 'Future Signals', href: '/future-signals', icon: Orbit },
      { label: 'News Signals', href: '/news-signals', icon: Megaphone },
    ],
  },
  { heading: 'Account', links: [{ label: 'Management', href: '/management', icon: Wallet }] },
]
