'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Map, Sparkles, User } from 'lucide-react'

import {
  companionGreeting,
  companionMessage,
  companionMotivation,
} from '@/lib/companion'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { ensureUserProfile, getUserProgress, type UserProgress } from '@/lib/supabase/db'

export default function WelcomePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [firstName, setFirstName] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    let settled = false
    const timer = window.setTimeout(() => {
      if (!cancelled && !settled) {
        setProgress({
          loggedIn: false,
          hasProfile: false,
          profileLocked: false,
          hasRoadmap: false,
          draftCount: 0,
        })
      }
    }, 4000)

    ;(async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient()
          const { data } = await supabase.auth.getUser()
          if (!cancelled && data.user) {
            const meta = data.user.user_metadata || {}
            const name =
              (meta.full_name as string) ||
              (meta.name as string) ||
              data.user.email?.split('@')[0]
            if (name) setFirstName(String(name).split(' ')[0])
          }
        }
      } catch {}

      try {
        const p = await getUserProgress()
        if (cancelled) return
        settled = true
        setProgress(p)
        if (p.loggedIn) ensureUserProfile().catch(() => {})
      } catch {
        if (!cancelled) {
          settled = true
          setProgress({
            loggedIn: false,
            hasProfile: false,
            profileLocked: false,
            hasRoadmap: false,
            draftCount: 0,
          })
        }
      } finally {
        window.clearTimeout(timer)
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  const loggedIn = Boolean(progress?.loggedIn)

  const ctx = {
    firstName,
    hasProfile: Boolean(progress?.hasProfile),
    profileLocked: Boolean(progress?.profileLocked),
    hasRoadmap: Boolean(progress?.hasRoadmap),
    draftCount: progress?.draftCount ?? 0,
  }

  const ctaHref = !loggedIn
    ? '/login'
    : !ctx.hasProfile
      ? '/onboarding'
      : !ctx.profileLocked
        ? '/brand-profile'
        : !ctx.hasRoadmap
          ? '/roadmap'
          : '/drafts'

  const ctaLabel = !loggedIn
    ? 'Đăng nhập để bắt đầu'
    : !ctx.hasProfile
      ? 'Bắt đầu trò chuyện với mình'
      : !ctx.profileLocked
        ? 'Xem hồ sơ cùng mình'
        : !ctx.hasRoadmap
          ? 'Thiết kế lộ trình'
          : ctx.draftCount > 0
            ? `Duyệt ${ctx.draftCount} bài đang chờ`
            : 'Xem bài chờ duyệt'

  // Guest landing
  if (!loggedIn) {
    return (
      <main className="relative flex min-h-svh flex-col items-center justify-center px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-foreground">
        <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_32px_-12px_rgba(30,58,138,0.55)]">
            <Sparkles className="size-6" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="rounded-full border border-primary/15 bg-primary/8 px-3.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
              Bạn đồng hành AI
            </span>
            <h1 className="text-balance text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              Tôi đi cùng bạn xây thương hiệu cá nhân
            </h1>
            <p className="max-w-md text-pretty text-[15px] leading-7 text-muted-foreground">
              Không phải tool đăng bài. Mà là người giữ đúng giọng, đúng chiến lược — và nhắc bạn khi cần tiến một bước.
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.7)]"
            >
              Bắt đầu cùng mình
              <ArrowRight className="size-4" />
            </Link>
            <p className="text-xs text-muted-foreground">Đăng nhập một lần · Mình nhớ bạn lần sau</p>
          </div>
        </div>
      </main>
    )
  }

  // Logged-in companion home
  return (
    <main className="min-h-svh px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 py-4">
        {/* Greeting card */}
        <section className="card-elevated overflow-hidden">
          <div className="bg-primary px-5 py-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">
                  Bạn đồng hành
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  {companionGreeting(ctx)}
                </h1>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-7 opacity-95">{companionMessage(ctx)}</p>
          </div>
          <div className="border-t border-border/60 bg-card px-5 py-4">
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">Góc nhỏ hôm nay: </span>
              {companionMotivation()}
            </p>
          </div>
        </section>

        {/* Primary CTA */}
        <Link
          href={ctaHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.55)]"
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>

        {/* Quick nav — large touch targets */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { href: '/brand-profile', label: 'Hồ sơ', icon: User },
            { href: '/roadmap', label: 'Lộ trình', icon: Map },
            { href: '/drafts', label: 'Chờ duyệt', icon: FileText },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-card px-2 py-3 text-center transition active:scale-[0.98]"
            >
              <item.icon className="size-5 text-primary" />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

        <p className="px-1 text-center text-[11px] leading-5 text-muted-foreground">
          Mình không thay bạn xuất hiện. Mình giúp bạn xuất hiện đúng và đều.
        </p>
      </div>
    </main>
  )
}
