'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getUserProgress } from '@/lib/supabase/db'

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Đang hoàn tất đăng nhập...')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const supabase = createClient()
      const code = searchParams.get('code')
      const nextParam = searchParams.get('next')

      try {
        if (code) {
          setStatus('Đang xác thực tài khoản...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error(error)
            if (!cancelled) router.replace('/login?error=auth')
            return
          }
        } else {
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            if (!cancelled) router.replace('/login?error=auth')
            return
          }
        }

        setStatus('Đang mở workspace của bạn...')
        let target = nextParam || '/'
        if (!nextParam || nextParam === '/onboarding' || nextParam === '/') {
          try {
            const progress = await Promise.race([
              getUserProgress(),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
            ])
            if (progress && progress.loggedIn) {
              if (!progress.hasProfile) target = '/onboarding'
              else if (!progress.profileLocked) target = '/brand-profile'
              else if (!progress.hasRoadmap) target = '/roadmap'
              else target = '/drafts'
            } else {
              target = '/onboarding'
            }
          } catch {
            target = '/onboarding'
          }
        }

        if (!cancelled) window.location.replace(target)
      } catch (e) {
        console.error(e)
        if (!cancelled) router.replace('/login?error=auth')
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-base font-semibold tracking-tight">Đang đăng nhập</p>
        <p className="mt-2 text-sm text-muted-foreground">{status}</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Đang đăng nhập...
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
