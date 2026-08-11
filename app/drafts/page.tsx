'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

import { SAMPLE_DRAFTS } from '@/lib/mock-data'

export default function DraftsPage() {
  const [filter, setFilter] = useState<'all' | 'LinkedIn' | 'Facebook'>('all')
  const drafts = SAMPLE_DRAFTS.filter((d) => filter === 'all' || d.platform === filter)

  return (
    <main className="min-h-svh text-foreground">
      <div className="page-shell">
        <header className="flex items-center gap-3 border-b border-border/60 py-4">
          <Link href="/roadmap" aria-label="Quay lại" className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">Chờ duyệt</h1>
            <p className="text-xs text-muted-foreground">Bài AI đã soạn sẵn</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {drafts.length} bài
          </span>
        </header>

        <div className="flex gap-2 py-4">
          {(['all', 'LinkedIn', 'Facebook'] as const).map((key) => (
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
              {key === 'all' ? 'Tất cả' : key}
            </button>
          ))}
        </div>

        {drafts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="size-6" />
            </div>
            <h2 className="text-lg font-semibold">Chưa có bài nào chờ duyệt</h2>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Khi đến lịch, AI sẽ soạn bài và hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-12">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/drafts/${draft.id}`}
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
                  <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Chờ duyệt
                  </span>
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-foreground/90">{draft.content}</p>
                <p className="mt-3 text-xs font-semibold text-primary">Xem chi tiết →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
