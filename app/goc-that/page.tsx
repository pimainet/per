'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, Plus, Trash2 } from 'lucide-react'

import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import {
  addIngredient,
  deleteIngredient,
  listIngredients,
  type Ingredient,
} from '@/lib/supabase/ingredients'

const PLACEHOLDER = `Gợi ý khung: Tình huống → việc xảy ra → bài học một câu.

Ví dụ:
• Pitch khách bị từ chối vì… → mình học được…
• Sai lầm tốn 2 tuần: … → giờ mình làm khác…`

export default function GocThatPage() {
  const router = useRouter()
  const [items, setItems] = useState<Ingredient[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await listIngredients()
      if (cancelled) return
      if (res.ok) setItems(res.items)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    setError(null)
    setOkMsg(null)
    setSaving(true)
    const res = await addIngredient(text)
    setSaving(false)
    if (!res.ok) {
      if (res.reason === 'empty') setError('Hãy viết ít nhất một câu thật.')
      else if (res.reason === 'too_long') setError('Ngắn lại dưới 2000 ký tự.')
      else if (res.reason === 'not_logged_in') {
        setError('Bạn cần đăng nhập.')
        router.push('/login?next=/goc-that')
      } else setError(('message' in res && res.message) || 'Chưa lưu được. Thử lại.')
      return
    }
    setText('')
    setOkMsg(
      'Đã nhận. Lần soạn bài sau mình chỉ dùng nếu hợp lộ trình — không nhét vào mọi bài.',
    )
    if (res.item) setItems((prev) => [res.item, ...prev])
  }

  async function remove(id: string) {
    const res = await deleteIngredient(id)
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <main className="min-h-svh pb-bottom-nav text-foreground">
      <div className="page-shell">
        <header className="space-y-3 border-b border-border/60 py-4">
          <AppNav />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Góc thật</h1>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Gửi sự thật / bài học ngắn. Mình chỉ dùng khi hợp lộ trình — không bắt buộc, không cần
              viết đẹp.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5 py-5">
          <section className="card-elevated p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Thêm một góc</p>
                <p className="text-[11px] text-muted-foreground">
                  Không cần hay — cần thật. Mình viết lại câu chữ khi soạn bài.
                </p>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={PLACEHOLDER}
              className="w-full resize-y rounded-2xl border border-input bg-background px-3.5 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{text.length}/2000</span>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving || !text.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Gửi cho mình
                  </>
                )}
              </button>
            </div>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            {okMsg ? <p className="mt-2 text-sm text-primary">{okMsg}</p> : null}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">
              Đã gửi {items.length > 0 ? `(${items.length})` : ''}
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm font-medium">Chưa có góc nào</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Mỗi góc là nguyên liệu thô. Lộ trình và hồ sơ vẫn là xương sống; góc thật chỉ thêm
                  thịt khi hợp chủ đề.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.id} className="card-elevated p-4">
                    <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">
                      {item.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
