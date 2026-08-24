'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

import { AppNav } from '@/components/app-nav'
import { SAMPLE_ROADMAP } from '@/lib/mock-data'
import { ensureSampleDrafts, loadRoadmap, saveRoadmap } from '@/lib/supabase/db'

export default function RoadmapPage() {
  const router = useRouter()
  const [r, setR] = useState(SAMPLE_ROADMAP)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await loadRoadmap()
      if (cancelled) return
      if (result.ok && !result.empty && result.data) {
        setR(result.data)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
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
    await ensureSampleDrafts()
    setSaving(false)
    router.push('/drafts')
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-2 text-sm">Đang tải lộ trình...</span>
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
              <p className="text-xs text-muted-foreground">Bản thiết kế 30–60 ngày</p>
            </div>
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
              {r.truCot.map((t, i) => (
                <div key={t.ten} className="rounded-xl bg-muted/70 p-3.5">
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
              {r.tuanMau.map((row) => (
                <div
                  key={row.ngay}
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
            {saving ? 'Đang lưu...' : 'Xác nhận lộ trình & xem bài chờ duyệt'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
