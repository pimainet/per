'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppNav } from '@/components/app-nav'
import { ONBOARDING_QUESTIONS, SAMPLE_BRAND_PROFILE } from '@/lib/mock-data'
import { loadBrandProfile, saveBrandProfile } from '@/lib/supabase/db'

export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await loadBrandProfile()
      if (cancelled) return
      // Đã có hồ sơ → không bắt làm lại 8 câu
      if (result.ok && !result.empty) {
        router.replace('/brand-profile')
        return
      }
      setChecking(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const question = ONBOARDING_QUESTIONS[index]
  const progress = useMemo(() => ((index + 1) / ONBOARDING_QUESTIONS.length) * 100, [index])

  function isTooGeneric(text: string) {
    const t = text.trim().toLowerCase()
    if (t.length < 40) return true
    const vague = ['doanh nghiệp', 'hiệu quả', 'phát triển', 'ai', 'công cụ', 'năng suất']
    const hits = vague.filter((w) => t.includes(w)).length
    return hits >= 2 && t.length < 120
  }

  async function finish(nextAnswers: string[]) {
    setSaving(true)
    setError(null)
    try {
      localStorage.setItem('pba_answers', JSON.stringify(nextAnswers))
      localStorage.setItem('pba_onboarded', '1')
    } catch {}

    const result = await saveBrandProfile({
      answers: nextAnswers,
      profile: SAMPLE_BRAND_PROFILE,
      locked: false,
      source: 'mock',
    })

    setSaving(false)

    if (!result.ok && result.reason === 'not_logged_in') {
      setError('Bạn chưa đăng nhập. Hãy đăng nhập rồi làm lại onboarding.')
      return
    }
    if (!result.ok && result.reason === 'db_error') {
      setError(result.message || 'Lưu hồ sơ thất bại. Thử lại.')
      return
    }

    router.push('/brand-profile')
  }

  async function submit() {
    const text = answer.trim()
    if (!text || saving) return

    if (!showFollowUp && isTooGeneric(text) && question.followUp) {
      setShowFollowUp(true)
      return
    }

    const nextAnswers = [...answers, text]
    setAnswers(nextAnswers)
    setAnswer('')
    setShowFollowUp(false)

    if (index < ONBOARDING_QUESTIONS.length - 1) {
      setIndex(index + 1)
    } else {
      await finish(nextAnswers)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra hồ sơ...
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="page-shell space-y-3 py-4">
          <AppNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (index > 0) {
                  setIndex(index - 1)
                  setAnswer(answers[index - 1] || '')
                  setAnswers(answers.slice(0, index - 1))
                  setShowFollowUp(false)
                } else {
                  router.push('/')
                }
              }}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted"
              aria-label="Quay lại"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">
                  Câu {index + 1}/{ONBOARDING_QUESTIONS.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-shell flex flex-1 flex-col gap-5 py-8">
        <div className="card-elevated p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
              AI
            </span>
            <span className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
              Nhân viên AI
            </span>
          </div>
          <p className="text-[15px] leading-7 sm:text-base">{question.text}</p>
          {question.hint ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.hint}</p>
          ) : null}
        </div>

        {showFollowUp ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-xs font-semibold text-amber-800">Cần cụ thể hơn một chút</p>
            <p className="mt-2 text-sm leading-6 text-foreground/90">{question.followUp}</p>
          </div>
        ) : null}

        <div className="mt-auto space-y-3 pb-6">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-input bg-card p-4 text-[15px] leading-7 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            className="h-11 w-full rounded-2xl text-[15px]"
            onClick={submit}
            disabled={!answer.trim() || saving}
          >
            <Send className="size-4" />
            {saving
              ? 'Đang lưu...'
              : index === ONBOARDING_QUESTIONS.length - 1
                ? 'Hoàn thành & tạo hồ sơ'
                : 'Gửi câu trả lời'}
          </Button>
        </div>
      </div>
    </main>
  )
}
