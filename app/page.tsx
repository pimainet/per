'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { ensureUserProfile, getUserProgress, type UserProgress } from '@/lib/supabase/db'

export default function WelcomePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    getUserProgress().then((p) => {
    setProgress(p)
    if (p.loggedIn) ensureUserProfile()
  })
  }, [])

  const ctaHref = !progress?.loggedIn
    ? '/login'
    : !progress.hasProfile
      ? '/onboarding'
      : !progress.profileLocked
        ? '/brand-profile'
        : !progress.hasRoadmap
          ? '/roadmap'
          : '/drafts'

  const ctaLabel = !progress?.loggedIn
    ? 'Đăng nhập để bắt đầu'
    : !progress.hasProfile
      ? 'Tiếp tục onboarding'
      : !progress.profileLocked
        ? 'Xem & khóa hồ sơ'
        : !progress.hasRoadmap
          ? 'Xem lộ trình'
          : 'Xem bài chờ duyệt'

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 text-foreground">
      <div className="flex w-full max-w-lg flex-col items-center gap-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_32px_-12px_rgba(30,58,138,0.55)]">
          <Sparkles className="size-6" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="rounded-full border border-primary/15 bg-primary/8 px-3.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
            Nhân viên AI
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.15]">
            Tôi xây dựng và vận hành thương hiệu cá nhân của bạn
          </h1>
          <p className="max-w-md text-pretty text-[15px] leading-7 text-muted-foreground sm:text-base">
            Bạn không cần nghĩ hôm nay viết gì. Tôi duy trì đúng giọng, đúng chiến lược, và đưa bài chờ bạn
            duyệt.
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            href={ctaHref}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.7)] transition hover:bg-primary/92"
          >
            {ctaLabel}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="text-xs text-muted-foreground">
            {progress?.loggedIn ? 'Đã đăng nhập · Tiếp đúng chỗ bạn đang làm dở' : 'Cần đăng nhập để lưu hồ sơ'}
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-3 gap-2 pt-2">
          {[
            { href: '/brand-profile', label: 'Hồ sơ' },
            { href: '/roadmap', label: 'Lộ trình' },
            { href: '/drafts', label: 'Chờ duyệt' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border/80 bg-card/80 px-2 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-primary/25 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
