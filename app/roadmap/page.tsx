'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { SAMPLE_ROADMAP } from '@/lib/mock-data'

export default function RoadmapPage() {
  const r = SAMPLE_ROADMAP

  return (
    <main className="min-h-svh pb-28 text-foreground">
      <div className="page-shell">
        <header className="flex items-center gap-3 border-b border-border/60 py-4">
          <Link href="/brand-profile" aria-label="Quay lại" className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">Lộ trình giai đoạn</h1>
            <p className="text-xs text-muted-foreground">Bản thiết kế 30–60 ngày</p>
          </div>
        </header>

        <div className="flex flex-col gap-4 py-6">
          <section className="card-elevated overflow-hidden">
            <div className="bg-primary px-5 py-5 text-primary-foreground">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">Giai đoạn hiện tại</p>
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
                <div key={row.ngay} className="flex gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 text-sm">
                  <div className="w-14 shrink-0 font-semibold text-primary">{row.ngay}</div>
                  <div>
                    <p className="font-medium">{row.loai} · {row.truCot}</p>
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
          <Link
            href="/drafts"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_rgba(30,58,138,0.55)] hover:bg-primary/92"
          >
            Xác nhận lộ trình & xem bài chờ duyệt
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
