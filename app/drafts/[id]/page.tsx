'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SAMPLE_DRAFTS } from '@/lib/mock-data'

export default function DraftDetailPage() {
  const params = useParams<{ id: string }>()
  const draft = useMemo(
    () => SAMPLE_DRAFTS.find((d) => d.id === params.id) ?? SAMPLE_DRAFTS[0],
    [params.id],
  )

  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(draft.content)
  const [saved, setSaved] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [approved, setApproved] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  function saveEdit() {
    setIsEditing(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  function cancelEdit() {
    setContent(draft.content)
    setIsEditing(false)
  }

  function approvePost() {
    setApproved(true)
    navigator.clipboard?.writeText(content)
  }

  function generateImage() {
    setImageLoading(true)
    window.setTimeout(() => {
      setImageLoading(false)
      setImageUrl('/placeholder.jpg')
    }, 1100)
  }

  if (deleted) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 text-center text-foreground">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Trash2 className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">Bài viết đã được xóa</h1>
          <p className="text-sm leading-6 text-muted-foreground">Bạn có thể quay lại danh sách để xem các bản nháp khác.</p>
          <Link href="/drafts" className="mt-3 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">
            Quay lại danh sách
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh pb-32 text-foreground">
      <div className="page-shell">
        <header className="flex items-center gap-3 border-b border-border/60 py-4">
          <Link href="/drafts" aria-label="Quay lại danh sách" className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight">Chi tiết bài</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              approved ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700'
            }`}
          >
            {approved ? 'Đã duyệt' : 'Chờ duyệt'}
          </span>
        </header>

        <section className="flex flex-col gap-5 py-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{draft.platform}</span>
            <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{draft.pillar}</span>
            <span className="text-xs text-muted-foreground">{draft.time}</span>
          </div>

          <article className="card-elevated p-5 sm:p-7">
            {isEditing ? (
              <textarea
                autoFocus
                value={content}
                onChange={(event) => setContent(event.target.value)}
                aria-label="Nội dung bài viết"
                className="min-h-[320px] w-full resize-y rounded-xl border border-input bg-background p-4 text-[15px] leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div className="whitespace-pre-line text-[15px] leading-8 text-foreground/90">{content}</div>
            )}

            <div className="mt-7 border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => setShowNote(!showNote)}
                className="flex w-full items-center justify-between gap-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">AI</span>
                  Vì sao bài này được đề xuất?
                </span>
                {showNote ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {showNote && <p className="mt-3 pl-7 text-sm leading-6 text-muted-foreground">{draft.note}</p>}
            </div>
          </article>

          <section className="card-elevated p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Ảnh minh họa</h2>
                <p className="mt-1 text-xs text-muted-foreground">Tùy chọn · Bấm khi cần ảnh kèm bài</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={generateImage} disabled={imageLoading}>
                <ImageIcon className="size-4" />
                {imageLoading ? 'Đang tạo...' : 'Tạo ảnh'}
              </Button>
            </div>
            {imageUrl ? (
              <div className="mt-4 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Ảnh minh họa demo" className="aspect-square w-full rounded-xl border border-border object-cover" />
                <p className="text-xs text-muted-foreground">Ảnh demo. Bản production sẽ gọi Flux/Ideogram.</p>
              </div>
            ) : (
              <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                Chưa có ảnh
              </div>
            )}
          </section>
        </section>
      </div>

      <div className="sticky-action">
        <div className="page-shell flex items-center gap-2 !px-0">
          {isEditing ? (
            <>
              <Button className="h-11 flex-1 rounded-2xl" onClick={saveEdit}>
                <Check className="size-4" />
                Lưu thay đổi
              </Button>
              <Button variant="outline" size="icon" className="size-11 rounded-2xl" onClick={cancelEdit} aria-label="Hủy">
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button className="h-11 flex-1 rounded-2xl" onClick={approvePost} disabled={approved}>
                <Check className="size-4" />
                {approved ? 'Đã duyệt & Sao chép' : 'Duyệt & Sao chép'}
              </Button>
              <Button variant="outline" size="icon" className="size-11 rounded-2xl" onClick={() => setIsEditing(true)} aria-label="Chỉnh sửa">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-2xl text-muted-foreground hover:text-destructive"
                onClick={() => setDeleted(true)}
                aria-label="Xóa"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
        {saved && <p className="page-shell mt-2 !px-0 text-center text-xs text-primary">Đã lưu thay đổi</p>}
        {approved && !isEditing && (
          <p className="page-shell mt-2 !px-0 text-center text-xs text-muted-foreground">
            Đã copy nội dung. Dán sang LinkedIn/Facebook để đăng.
          </p>
        )}
      </div>
    </main>
  )
}
