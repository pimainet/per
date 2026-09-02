'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import type { Draft } from '@/lib/mock-data'
import { loadDrafts, updateDraftStatus, saveDraftFeedback } from '@/lib/supabase/db'

type DraftRow = Draft & { dbId?: string }

export default function DraftDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [draft, setDraft] = useState<DraftRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [approved, setApproved] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [remainingPending, setRemainingPending] = useState(0)
  const [feedback, setFeedback] = useState<'like' | 'unlike' | null>(null)
  const [unlikeReason, setUnlikeReason] = useState('')
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await loadDrafts()
      if (cancelled) return
      if (result.ok) {
        const found =
          result.drafts.find((d) => d.dbId === params.id || d.id === params.id) || result.drafts[0]
        if (found) {
          setDraft(found)
          setContent(found.content)
          setApproved(found.status === 'approved')
          if ((found as { imageUrl?: string }).imageUrl) {
            setImageUrl((found as { imageUrl?: string }).imageUrl || null)
          }
        }
        setRemainingPending(
          result.drafts.filter(
            (d) => d.status !== 'approved' && (d.dbId || d.id) !== params.id,
          ).length,
        )
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [params.id])

  async function approvePost() {
    if (!draft) return
    setWorking(true)
    if (draft.dbId) {
      await updateDraftStatus(draft.dbId, 'approved')
    }
    setApproved(true)
    navigator.clipboard?.writeText(content)
    setWorking(false)
  }

  async function removePost() {
    if (!draft) return
    setWorking(true)
    if (draft.dbId) {
      await updateDraftStatus(draft.dbId, 'deleted')
    }
    setDeleted(true)
    setWorking(false)
  }

  function saveEdit() {
    setIsEditing(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  function cancelEdit() {
    if (draft) setContent(draft.content)
    setIsEditing(false)
  }

  async function generateImage() {
    if (!draft) return
    setImageLoading(true)
    setImageError(null)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          draftId: draft.dbId,
          content,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImageError(data.error || 'Không tạo được ảnh')
        setImageLoading(false)
        return
      }
      setImageUrl(data.imageUrl)
    } catch {
      setImageError('Lỗi kết nối khi tạo ảnh')
    }
    setImageLoading(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
            <BottomNav />
    </main>
    )
  }

  if (deleted) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 text-center text-foreground">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Trash2 className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">Bài viết đã được xóa</h1>
          <Link
            href="/drafts"
            className="mt-3 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    )
  }

  if (!draft) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-foreground">
        <p className="text-sm text-muted-foreground">Không tìm thấy bài</p>
        <Link href="/drafts" className="text-sm font-semibold text-primary">
          Về danh sách
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-svh pb-bottom-nav pb-32 text-foreground">
      <div className="page-shell">
        <header className="space-y-3 border-b border-border/60 py-4">
          <AppNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/drafts')}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h1 className="flex-1 text-base font-semibold tracking-tight">Chi tiết bài</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                approved ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
              }`}
            >
              {approved ? 'Đã duyệt' : 'Chờ duyệt'}
            </span>
          </div>
        </header>

        <section className="flex flex-col gap-5 py-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {draft.platform}
            </span>
            <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {draft.pillar}
            </span>
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
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                    AI
                  </span>
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
                {imageLoading ? 'Đang tạo...' : 'Gợi ý ảnh'}
              </Button>
              <Link href="/nhan-dien" className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline">
                Nhận diện ảnh
              </Link>
              {imageError ? (
                <p className="basis-full text-xs text-destructive">{imageError}</p>
              ) : null}
            </div>
            {imageUrl ? (
              <div className="mt-4 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Ảnh minh họa demo"
                  className="aspect-square w-full rounded-xl border border-border object-cover"
                />
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
              <Button className="h-11 flex-1 rounded-2xl" onClick={approvePost} disabled={approved || working}>
                <Check className="size-4" />
                {approved ? 'Đã duyệt & Sao chép' : 'Duyệt & Sao chép'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-2xl"
                onClick={() => setIsEditing(true)}
                aria-label="Chỉnh sửa"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-2xl text-muted-foreground hover:text-destructive"
                onClick={removePost}
                disabled={working}
                aria-label="Xóa"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
        {saved && <p className="page-shell mt-2 !px-0 text-center text-xs text-primary">Đã lưu thay đổi</p>}
        {approved && !isEditing && (
          <div className="page-shell mt-3 space-y-2 !px-0 text-center">
            <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm leading-6 text-emerald-900">
              Đã copy xong. Dán lên {draft?.platform || 'mạng xã hội'} khi bạn sẵn sàng — không cần sửa nếu
              thấy đúng giọng.
            </p>
            <p className="text-xs text-muted-foreground">
              {remainingPending > 0
                ? `Còn ${remainingPending} bài chờ duyệt. Làm tiếp khi rảnh — mình giữ nhịp cho bạn.`
                : 'Hết bài chờ rồi. Mình sẽ soạn thêm đúng lịch tuần — bạn không cần bấm tạo.'}
            </p>
            <Link href="/drafts" className="inline-block text-sm font-semibold text-primary">
              {remainingPending > 0 ? 'Duyệt bài tiếp →' : 'Về danh sách chờ duyệt →'}
            </Link>

            {!feedbackSaved ? (
              <div className="mt-4 rounded-2xl border border-border/80 bg-card px-3 py-3 text-left">
                <p className="text-xs font-semibold text-foreground">Bài này có giống bạn không?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary"
                    onClick={async () => {
                      setFeedback('like')
                      const id = draft?.dbId || draft?.id || ''
                      await saveDraftFeedback(id, true)
                      setFeedbackSaved(true)
                    }}
                  >
                    Giống tôi
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-muted py-2 text-xs font-semibold text-muted-foreground"
                    onClick={() => setFeedback('unlike')}
                  >
                    Chưa giống
                  </button>
                </div>
                {feedback === 'unlike' ? (
                  <div className="mt-2 space-y-2">
                    <input
                      value={unlikeReason}
                      onChange={(e) => setUnlikeReason(e.target.value)}
                      placeholder="Một câu: lệch ở đâu?"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
                      onClick={async () => {
                        const id = draft?.dbId || draft?.id || ''
                        await saveDraftFeedback(id, false, unlikeReason)
                        setFeedbackSaved(true)
                      }}
                    >
                      Gửi góp ý
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Đã ghi nhận — lần soạn sau mình sẽ bám hơn.</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
