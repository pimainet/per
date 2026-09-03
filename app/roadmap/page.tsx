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
import { listIngredients } from '@/lib/supabase/ingredients'
import { pickIngredients } from '@/lib/ingredients/pick'
import { canRunBatch } from '@/lib/access'
import { getUserAccess, markBatchUsed } from '@/lib/supabase/access'
import { buildWeekPreview, nhipLabel, type TuanMauRow } from '@/lib/roadmap-pace'

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
    const week = buildWeekPreview(postsPerWeek, (r.tuanMau || []) as TuanMauRow[])
    const payload = {
      ...r,
      postsPerWeek,
      nhip: nhipLabel(postsPerWeek),
      tuanMau: week,
    }
    setR(payload as Roadmap)
    const saveRes = await saveRoadmap(payload)
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
    setError(null)
    const access = await getUserAccess()
    const gate = canRunBatch(access)
    if (!gate.ok) {
      setError(gate.reason || 'Không soạn được batch')
      return
    }

    setSaving(true)
    const saveRes = await saveRoadmap({ ...r, postsPerWeek })
    if (!saveRes.ok && saveRes.reason === 'db_error') {
      setError(saveRes.message || 'Không lưu được lộ trình')
      setSaving(false)
      return
    }

    // Tạo bài theo profile + lộ trình
    if (profile) {
      try {
        const ing = await listIngredients()
        const ingredients = ing.ok ? pickIngredients(ing.items) : []
        const res = await fetch('/api/drafts/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ profile, roadmap: r, ingredients }),
        })
        const data = await res.json()
        if (res.ok && Array.isArray(data.drafts)) {
          await replaceDraftsWith(data.drafts)
          await markBatchUsed()
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

        <div className="flex flex-col gap-3 py-5">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {/* 1. Nhịp — lên đầu, đổi = cập nhật khung tuần ngay (local, 0 API) */}
          <section className="card-elevated p-4">
            <h3 className="text-sm font-semibold">Nhịp viết mỗi tuần</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Đổi nhịp → khung tuần đổi ngay. Chỉ tốn DB khi bấm Lưu nhịp — không gọi AI.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { n: 3, label: '3 bài', sub: 'T2 · 4 · 6' },
                { n: 5, label: '5 bài', sub: 'T2–T6' },
                { n: 7, label: '7 bài', sub: 'Mỗi ngày' },
              ].map((opt) => (
                <button
                  key={opt.n}
                  type="button"
                  onClick={() => {
                    setPostsPerWeek(opt.n)
                    const week = buildWeekPreview(opt.n, (r.tuanMau || []) as TuanMauRow[])
                    setR((prev) => ({
                      ...prev,
                      postsPerWeek: opt.n,
                      nhip: nhipLabel(opt.n),
                      tuanMau: week,
                    }))
                    if (savedPostsPerWeek !== null && opt.n !== savedPostsPerWeek) {
                      setPaceSaved(false)
                      setPaceMsg(null)
                    } else if (savedPostsPerWeek === opt.n) {
                      setPaceSaved(true)
                    }
                  }}
                  className={`rounded-2xl border px-2 py-2.5 text-center transition ${
                    postsPerWeek === opt.n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/80 bg-background text-muted-foreground'
                  }`}
                >
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80">{opt.sub}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Giai đoạn — gọn */}
          <section className="card-elevated overflow-hidden">
            <div className="bg-primary px-4 py-4 text-primary-foreground">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase opacity-80">
                Giai đoạn
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{r.tenGiaiDoan}</h2>
              <p className="mt-1.5 text-xs leading-5 opacity-90 line-clamp-2">{r.mucTieu}</p>
            </div>
          </section>

          {/* 3. Trụ cột — chỉ tên, bỏ đoạn lý do dài */}
          <section className="card-elevated p-4">
            <h3 className="text-sm font-semibold">Trụ cột</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {(r.truCot || []).slice(0, 5).map((t, i) => (
                <li
                  key={t.ten + i}
                  className="rounded-full bg-muted/80 px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {t.ten}
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Khung tuần — theo nhịp đã chọn */}
          <section className="card-elevated p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Khung tuần</h3>
              <span className="text-[11px] font-medium text-primary">{nhipLabel(postsPerWeek)}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {buildWeekPreview(postsPerWeek, (r.tuanMau || []) as TuanMauRow[]).map((row, i) => (
                <div
                  key={row.ngay + i}
                  className="flex gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
                >
                  <div className="w-12 shrink-0 text-xs font-semibold text-primary">{row.ngay}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-snug">
                      {row.loai}
                      {row.truCot ? ` · ${row.truCot}` : ''}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                      {row.goiY}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rủi ro — thu gọn 2 dòng */}
          {r.ruiRo ? (
            <p className="px-1 text-[11px] leading-4 text-muted-foreground line-clamp-2">
              <span className="font-semibold text-foreground/80">Lưu ý: </span>
              {r.ruiRo}
            </p>
          ) : null}
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
