'use client'

import { CocoAppFrame } from '@/components/coco/coco-app-frame'
import { CocoBottomNav } from '@/components/coco/coco-bottom-nav'
import { CocoHeroBg } from '@/components/coco/coco-hero-bg'
import { AuthGuard } from '@/components/auth-guard'
import { ChartAnalyzer } from '@/components/chart-analyzer'
import { AnalyzerModeSwitch } from '@/components/analyzer-mode-switch'

type Mode = 'otc' | 'real'

export function AnalyzerView({ mode }: { mode: Mode }) {
  return (
    <AuthGuard>
      {() => (
        <CocoAppFrame>
          <div
            className="coco coco-analyzer relative min-h-dvh bg-[#0b0618]"
            data-testid={`analyzer-page-${mode}`}
          >
            <CocoBottomNav />

            <div className="coco-dark min-h-dvh">
              <div className="relative overflow-hidden pt-0">
                <CocoHeroBg candles={false} />

                <div className="relative z-10 mx-auto flex max-w-[980px] flex-col gap-5 px-4 pb-32 pt-6 sm:px-6 sm:pt-8 md:px-8 md:pb-20 md:pt-10">
                  <AnalyzerModeSwitch mode={mode} />

                  <ChartAnalyzer mode={mode} />
                </div>
              </div>
            </div>
          </div>
        </CocoAppFrame>
      )}
    </AuthGuard>
  )
}
