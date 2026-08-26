'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    authError === 'auth' ? 'Đăng nhập chưa thành công. Thử lại bằng Google hoặc email.' : null,
  )

  const configured = isSupabaseConfigured()

  async function signInWithGoogle() {
    setError(null)
    setMessage(null)
    if (!configured) {
      setError('Chưa cấu hình Supabase. Xem file AUTH_SETUP.md')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const origin = window.location.origin
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!configured) {
      setError('Chưa cấu hình Supabase. Xem file AUTH_SETUP.md')
      return
    }
    if (!email.trim()) return
    setLoading(true)
    const supabase = createClient()
    const origin = window.location.origin
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setMessage('Đã gửi link đăng nhập vào email. Hãy kiểm tra hộp thư.')
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12 text-foreground">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>

        <div className="card-elevated p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
            Nhân viên AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Đăng nhập để bắt đầu</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Để nhớ đúng hồ sơ, giọng viết và bài của bạn — cần đăng nhập một lần.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              className="h-11 w-full rounded-2xl"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading ? 'Đang mở Google...' : 'Tiếp tục với Google'}
            </Button>
            {loading ? (
              <p className="text-center text-xs text-muted-foreground">
                Giữ màn hình này — sắp chuyển sang Google, rồi quay lại app.
              </p>
            ) : null}

            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">hoặc email</span>
            </div>

            <form onSubmit={signInWithEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="submit"
                variant="outline"
                className="h-11 w-full rounded-2xl"
                disabled={loading}
              >
                <Mail className="size-4" />
                Gửi link đăng nhập
              </Button>
            </form>

            {message && <p className="text-sm text-primary">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Đăng nhập xong bạn sẽ vào onboarding hoặc tiếp tục đúng hồ sơ của mình.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Đang tải...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
