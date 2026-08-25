'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react'

import { AppNav } from '@/components/app-nav'
import { Button } from '@/components/ui/button'
import { SAMPLE_ROADMAP } from '@/lib/mock-data'
import {
  loadBrandProfile,
  loadRoadmap,
  replaceDraftsWith,
  saveRoadmap,
} from '@/lib/supabase/db'

type Roadmap = typeof SAMPLE_ROADMAP

export default function RoadmapPage() {
  const router = useRouter()
  const [r, setR] = useState<Roadmap>(SAMPLE_ROADMAP)
  const [profile, setProfile] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'claude' | 'db' | 'empty'>('empty')

  async function generateFromProfile(prof: unknown) {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: prof }),
      })
      const data = await res.json()
      if (!res.ok || !data.roadmap) {
        setError(data.error || 'Không tạo được lộ trình bằng AI')
        setGenerating(false)
        return false
      }
      setR(data.roadmap)
      setSource('claude')
      await saveRoadmap(data.roadmap)
      setGenerating(false)
      return true
    } catch {
      setError('Lỗi kết nối khi tạo lộ trình')
      setGenerating(false)
      return false
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [rm, bp] = await Promise.all([loadRoadmap(), loadBrandProfile()])
      if (cancelled) return

      const prof =
        bp.ok && !bp.empty && bp.data?.profile ? bp.data.profile : null
      setProfile(prof)

      if (rm.ok && !rm.empty && rm.data) {
        setR(rm.data)
        setSource('db')
        setLoading(false)
        return
      }

      // Chưa có lộ trình → tạo bằng Claude từ profile
      setLoading(false)
      if (prof) {
        await generateFromProfile(prof)
      } else {
        setError('Chưa có Brand Profile. Hãy hoàn thành hồ sơ trước.')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirm() {
    setSaving(true)
    setError(null)
    const saveRes = await saveRoadmap(r)
    if (!saveRes.ok && saveRes.reason === 'db_error') {
      setError(saveRes.message || 'Không lưu được lộ trình')
      setSaving(false)
      return
    }

    // Tạo bài theo profile + lộ trình
    if (profile) {
      try {
        const res = await fetch('/api/drafts/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ profile, roadmap: r }),
        })
        const data = await res.json()
        if (res.ok && Array.isArray(data.drafts)) {
          await replaceDraftsWith(data.drafts)
        } else {
          setError(
            (data.error || 'Chưa tạo được bài bằng AI') +
              ' — vẫn chuyển sang Chờ duyệt.',
          )
        }
      } catch {
        setError('Lỗi tạo bài — vẫn chuyển sang Chờ duyệt.')
      }
    }

    setSaving(false)
    router.push('/drafts')
  }

  if (loading || generating) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">
          {generating ? 'Claude đang thiết kế lộ trình theo hồ sơ của bạn...' : 'Đang tải...'}
        </span>
      </main>
    )
  }

  return (
    <main className="min-h-svh pb-28 text-foreground">
      <div className="page-shell">
        <header className="space-y-3 border-b border-border/60 py-4">
          <AppNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/brand-profile')}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted"
              aria-label="Quay lại"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-semibold tracking-tight">Lộ trình giai đoạn</h1>
              <p className="text-xs text-muted-foreground">
                {source === 'claude' ? 'Vừa tạo bằng AI từ hồ sơ của bạn' : 'Đã lưu trong tài khoản'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!profile || generating}
              onClick={() => profile && generateFromProfile(profile)}
            >
              <RefreshCw className="size-3.5" />
              Tạo lại
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-4 py-6">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <section className="card-elevated overflow-hidden">
            <div className="bg-primary px-5 py-5 text-primary-foreground">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">
                Giai đoạn hiện tại
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{r.tenGiaiDoan}</h2>
              <p className="mt-2 text-sm leading-6 opacity-90">{r.mucTieu}</p>
              <p className="mt-3 text-xs opacity-75">Thời gian: {r.thoiGian}</p>
            </div>
          </section>

          <section className="card-elevated p-5">
            <h3 className="text-sm font-semibold">Trụ cột ưu tiên</h3>
            <div className="mt-3 space-y-3">
              {(r.truCot || []).map((t, i) => (
                <div key={t.ten + i} className="rounded-xl bg-muted/70 p-3.5">
                  <p className="text-xs font-semibold text-primary">Trụ cột {i + 1}</p>
                  <p className="mt-1 text-sm font-medium">{t.ten}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.lyDo}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-elevated p-5">
            <h3 className="text-sm font-semibold">Nhịp đăng</h3>
            <p className="mt-2 text-sm leading-6">
              <span className="font-medium">{r.nhip}</span>
              <span className="text-muted-foreground"> · {r.tyLe}</span>
            </p>
          </section>

          <section className="card-elevated p-5">
            <h3 className="text-sm font-semibold">Khung tuần mẫu</h3>
            <div className="mt-3 space-y-2">
              {(r.tuanMau || []).map((row, i) => (
                <div
                  key={row.ngay + i}
                  className="flex gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 text-sm"
                >
                  <div className="w-14 shrink-0 font-semibold text-primary">{row.ngay}</div>
                  <div>
                    <p className="font-medium">
                      {row.loai} · {row.truCot}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.goiY}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card-elevated p-5">
            <h3 className="text-sm font-semibold">Rủi ro cần lưu ý</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.ruiRo}</p>
          </section>
        </div>
      </div>

      <div className="sticky-action">
        <div className="page-shell !px-0">
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.55)] hover:bg-primary/92 disabled:opacity-60"
          >
            {saving ? 'Đang tạo bài bằng AI...' : 'Xác nhận lộ trình & tạo bài chờ duyệt'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
