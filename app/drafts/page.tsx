'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'

import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import type { Draft } from '@/lib/mock-data'
import { loadDrafts, loadRoadmap } from '@/lib/supabase/db'
import { parsePostsPerWeek, scheduleDays } from '@/lib/schedule'

type DraftRow = Draft & { dbId?: string }

export default function DraftsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'pending' | 'all' | 'LinkedIn' | 'Facebook'>('pending')
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleHint, setScheduleHint] = useState('T2 · T4 · T6')
  const [postsPerWeek, setPostsPerWeek] = useState(3)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function runScheduleNow() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/drafts/run-schedule', { method: 'POST' })
      const data = await res.json()
      setSyncMsg(data.message || data.detail || data.error || 'Xong')
      if (data.ok) {
        const result = await loadDrafts()
        if (result.ok) {
          setDrafts(result.drafts)
          setPendingCount(result.drafts.filter((d) => d.status === 'pending').length)
        }
      }
    } catch {
      setSyncMsg('Lỗi kết nối')
    }
    setSyncing(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [result, rm] = await Promise.all([loadDrafts(), loadRoadmap()])
      if (cancelled) return
      if (result.ok) {
        setDrafts(result.drafts)
        setPendingCount(result.drafts.filter((d) => d.status === 'pending').length)
      }
      if (rm.ok && !rm.empty && rm.data) {
        const n = parsePostsPerWeek(rm.data)
        setPostsPerWeek(n)
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const labels = scheduleDays(n).map((d) => dayNames[d])
        setScheduleHint(labels.join(' · '))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = drafts.filter((d) => {
    if (filter === 'pending') return d.status === 'pending'
    if (filter === 'all') return true
    return d.platform === filter
  })

  return (
    <main className="min-h-svh pb-bottom-nav text-foreground">
      <div className="page-shell">
        <header className="space-y-3 border-b border-border/60 py-4">
          <AppNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/roadmap')}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted"
              aria-label="Quay lại"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-semibold tracking-tight">Chờ duyệt</h1>
              <p className="text-xs text-muted-foreground">Bài AI soạn sẵn · Tự thêm theo lịch tuần</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {visible.length} bài
            </span>
          </div>
        </header>

        <div className="flex gap-2 py-4">
          {(['pending', 'all', 'LinkedIn', 'Facebook'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {key === 'pending' ? 'Chờ duyệt' : key === 'all' ? 'Tất cả' : key}
            </button>
          ))}
        </div>

        {!loading ? (
          <div className="mb-3 space-y-2 rounded-2xl border border-primary/15 bg-primary/5 px-3.5 py-3 text-left">
            <p className="text-xs leading-5 text-foreground/90">
              <span className="font-semibold text-primary">Mình: </span>
              {pendingCount > 0
                ? `Có ${pendingCount} bài chờ duyệt. Lịch: ${scheduleHint} · ${postsPerWeek} bài/tuần.`
                : `Chưa có bài chờ. Lịch ${scheduleHint} (${postsPerWeek}/tuần). Cần gói paid + đúng ngày nhịp.`}
            </p>
            <button
              type="button"
              onClick={runScheduleNow}
              disabled={syncing}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-60"
            >
              {syncing ? 'Đang kiểm tra lịch…' : 'Lấy bài theo lịch hôm nay'}
            </button>
            {syncMsg ? (
              <p className="text-[11px] leading-4 text-muted-foreground">{syncMsg}</p>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải bài...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Tạm thời chưa có bài chờ</h2>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                Mình vẫn ở đây. Bài mới được soạn theo lịch — không phải app dừng.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-4 text-left">
              <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                Lịch tuần này
              </p>
              <p className="mt-2 text-sm font-medium">
                {postsPerWeek} bài/tuần · {scheduleHint}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Mỗi sáng đúng ngày, mình thêm bài vào đây. Nếu còn nhiều bài chưa duyệt, mình tạm nghỉ
                tạo thêm cho đỡ rối.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/roadmap" className="text-sm font-semibold text-primary">
                Xem / chỉnh lộ trình →
              </Link>
              <p className="text-[11px] text-muted-foreground">
                Lần đầu chưa có bài? Vào Lộ trình bấm xác nhận để mình soạn batch đầu.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-12">
            {visible.map((draft) => {
              const approved = draft.status === 'approved'
              return (
                <Link
                  key={draft.dbId || draft.id}
                  href={`/drafts/${draft.dbId || draft.id}`}
                  className="card-elevated block p-4 transition hover:-translate-y-0.5 hover:border-primary/25"
                >
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {draft.platform}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {draft.pillar}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{draft.time}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        approved
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {approved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-foreground/90">{draft.content}</p>
                  <p className="mt-3 text-xs font-semibold text-primary">Xem chi tiết →</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
          <BottomNav />
    </main>
  )
}
