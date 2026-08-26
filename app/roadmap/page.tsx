'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react'

import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { AiWaiting } from '@/components/ai-waiting'
import { SAMPLE_ROADMAP } from '@/lib/mock-data'
import {
  loadBrandProfile,
  loadDrafts,
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
  const [postsPerWeek, setPostsPerWeek] = useState(3)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [hasDrafts, setHasDrafts] = useState(false)
  const [savingPace, setSavingPace] = useState(false)
  const [paceMsg, setPaceMsg] = useState<string | null>(null)
  const [paceSaved, setPaceSaved] = useState(false)
  const [savedPostsPerWeek, setSavedPostsPerWeek] = useState<number | null>(null)
  const [regenUsed, setRegenUsed] = useState(0)
  const REGEN_LIMIT = 2

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
      await saveRoadmap({ ...data.roadmap, postsPerWeek })
      // Chỉ cập nhật lộ trình — không mở lại tạo batch bài
      setAlreadySaved(true)
      setGenerating(false)
      setPaceMsg('Đã cập nhật lộ trình. Bài mới vẫn theo lịch — không tạo thêm batch.')
      return true
    } catch {
      setError('Lỗi kết nối khi tạo lộ trình')
      setGenerating(false)
      return false
    }
  }

  useEffect(() => {
    try {
      const key = 'pba_roadmap_regen_' + new Date().toISOString().slice(0, 7)
      setRegenUsed(Number(localStorage.getItem(key) || '0') || 0)
    } catch {}
    let cancelled = false
    ;(async () => {
      const [rm, bp, dr] = await Promise.all([
        loadRoadmap(),
        loadBrandProfile(),
        loadDrafts(),
      ])
      if (cancelled) return

      const prof =
        bp.ok && !bp.empty && bp.data?.profile ? bp.data.profile : null
      setProfile(prof)

      if (dr.ok) {
        setHasDrafts((dr.drafts || []).length > 0)
      }

      if (rm.ok && !rm.empty && rm.data) {
        setR(rm.data)
        const n = (rm.data as { postsPerWeek?: number }).postsPerWeek
        if (typeof n === 'number' && n > 0) {
          setPostsPerWeek(n)
          setSavedPostsPerWeek(n)
          setPaceSaved(true)
        }
        setSource('db')
        setAlreadySaved(true)
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

  async function savePace() {
    setSavingPace(true)
    setPaceMsg(null)
    setError(null)
    const saveRes = await saveRoadmap({ ...r, postsPerWeek })
    setSavingPace(false)
    if (!saveRes.ok && saveRes.reason === 'db_error') {
      setError(saveRes.message || 'Không lưu được nhịp đăng')
      return
    }
    setAlreadySaved(true)
    setSavedPostsPerWeek(postsPerWeek)
    setPaceSaved(true)
    setPaceMsg(`Đã lưu · ${postsPerWeek} bài/tuần. Lịch sẽ soạn đúng nhịp này.`)
  }

  async function confirm() {
    setSaving(true)
    setError(null)
    const saveRes = await saveRoadmap({ ...r, postsPerWeek })
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

    setAlreadySaved(true)
    setHasDrafts(true)
    setSaving(false)
    router.push('/drafts')
  }

  if (loading && !generating) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Đang mở lộ trình...</span>
            <BottomNav />
    </main>
    )
  }

  if (generating) {
    return <AiWaiting kind="roadmap" />
  }

  if (saving) {
    return <AiWaiting kind="drafts" title="Mình đang soạn bài chờ duyệt" />
  }

  return (
    <main className="min-h-svh pb-bottom-nav pb-28 text-foreground">
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
              disabled={!profile || generating || regenUsed >= REGEN_LIMIT}
              onClick={async () => {
                if (!profile) return
                if (regenUsed >= REGEN_LIMIT) {
                  setError(`Đã hết ${REGEN_LIMIT} lần tạo lại lộ trình trong tháng này.`)
                  return
                }
                const ok = await generateFromProfile(profile)
                if (ok) {
                  const next = regenUsed + 1
                  setRegenUsed(next)
                  try {
                    const key = 'pba_roadmap_regen_' + new Date().toISOString().slice(0, 7)
                    localStorage.setItem(key, String(next))
                  } catch {}
                }
              }}
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
            <h3 className="text-sm font-semibold">Nhịp viết mỗi tuần</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Hệ thống tự soạn bài theo lịch. Bạn chỉ cần duyệt.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { n: 3, label: '3 bài', sub: 'Nhẹ' },
                { n: 5, label: '5 bài', sub: 'Vừa' },
                { n: 7, label: '7 bài', sub: 'Mỗi ngày' },
              ].map((opt) => (
                <button
                  key={opt.n}
                  type="button"
                  onClick={() => {
                    setPostsPerWeek(opt.n)
                    if (savedPostsPerWeek !== null && opt.n !== savedPostsPerWeek) {
                      setPaceSaved(false)
                      setPaceMsg(null)
                    } else if (savedPostsPerWeek === opt.n) {
                      setPaceSaved(true)
                    }
                  }}
                  className={`rounded-2xl border px-2 py-3 text-center transition ${
                    postsPerWeek === opt.n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/80 bg-background text-muted-foreground'
                  }`}
                >
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="mt-0.5 block text-[11px] opacity-80">{opt.sub}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Ví dụ 3 bài: Thứ 2 · 4 · 6. Không tạo thêm nếu còn ≥5 bài chờ duyệt.
            </p>
          </section>

          <section className="card-elevated p-5">
            <h3 className="text-sm font-semibold">Rủi ro cần lưu ý</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.ruiRo}</p>
          </section>
        </div>
      </div>

      <div className="sticky-action">
        <div className="page-shell space-y-2 !px-0">
          {paceMsg ? (
            <p className="text-center text-xs text-primary">{paceMsg}</p>
          ) : null}

          {/* Đã có lộ trình + đã có bài → không cho bấm tạo batch nữa */}
          {alreadySaved && hasDrafts ? (
            <div className="rounded-2xl border border-border/80 bg-card px-4 py-3.5 text-center">
              <p className="text-sm font-semibold text-foreground">Lộ trình đã lưu · Bài đang chạy theo lịch</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Không cần bấm tạo lại. Đổi nhịp 3/5/7 bên trên rồi bấm Lưu nhịp nếu cần.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={savePace}
                  disabled={savingPace || (paceSaved && postsPerWeek === savedPostsPerWeek)}
                  className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-semibold disabled:opacity-100 ${
                    paceSaved && postsPerWeek === savedPostsPerWeek
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-800'
                      : 'border border-border bg-background'
                  }`}
                >
                  {savingPace
                    ? 'Đang lưu...'
                    : paceSaved && postsPerWeek === savedPostsPerWeek
                      ? '✓ Đã lưu'
                      : 'Lưu nhịp'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/drafts')}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  Chờ duyệt
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ) : alreadySaved && !hasDrafts ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                Lộ trình đã lưu nhưng chưa có bài — soạn batch đầu một lần.
              </p>
              <button
                type="button"
                onClick={confirm}
                disabled={saving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? 'Đang soạn bài...' : 'Soạn batch bài đầu tiên'}
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.55)] hover:bg-primary/92 disabled:opacity-60"
            >
              {saving ? 'Đang soạn bài...' : 'Xác nhận lộ trình & tạo bài chờ duyệt'}
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
