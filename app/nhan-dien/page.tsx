'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { DEFAULT_VISUAL, type BrandVisual, type PeopleMode } from '@/lib/visual/types'
import { loadBrandVisual, saveBrandVisual } from '@/lib/supabase/visual'

export default function NhanDienPage() {
  const [visual, setVisual] = useState<BrandVisual>(DEFAULT_VISUAL)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await loadBrandVisual()
      if (res.ok) setVisual(res.visual)
      setLoading(false)
    })()
  }, [])

  async function onSave() {
    setSaving(true)
    setMsg(null)
    const res = await saveBrandVisual(visual)
    setSaving(false)
    if (!res.ok) {
      setMsg(res.reason === 'db_error' ? res.message || 'Lỗi lưu' : 'Không lưu được — kiểm tra đăng nhập / bảng brand_visuals')
      return
    }
    setMsg('Đã lưu nhận diện ảnh. Khi duyệt bài, bạn có thể gợi ý ảnh theo kit này.')
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background pb-24">
      <AppNav title="Nhận diện ảnh" />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Kit cố định để mọi ảnh gợi ý cùng một họ — đẹp trong khung, không random mỗi bài một style.
          Làm một lần. Chỉ cần đủ style + màu là dùng được.
        </p>

        <div className="mt-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Người trên ảnh</span>
            <select
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.peopleMode}
              onChange={(e) =>
                setVisual((v) => ({ ...v, peopleMode: e.target.value as PeopleMode }))
              }
            >
              <option value="none">Không người — đồ vật / không gian / biểu tượng</option>
              <option value="no_face">Có người nhưng không lộ mặt</option>
              <option value="people_ok">Cho phép người (chấp nhận mặt AI)</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Style (3–5 từ)</span>
            <input
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.styleWords}
              onChange={(e) => setVisual((v) => ({ ...v, styleWords: e.target.value }))}
              placeholder="tối giản, ánh sáng tự nhiên, documentary"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Màu chủ</span>
              <input
                type="color"
                className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background"
                value={visual.colorPrimary}
                onChange={(e) => setVisual((v) => ({ ...v, colorPrimary: e.target.value }))}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Màu phụ</span>
              <input
                type="color"
                className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background"
                value={visual.colorSecondary}
                onChange={(e) => setVisual((v) => ({ ...v, colorSecondary: e.target.value }))}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Cấm trên ảnh</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.forbidden}
              onChange={(e) => setVisual((v) => ({ ...v, forbidden: e.target.value }))}
              placeholder="chữ trên ảnh, logo lạ, tay bắt tay…"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Thế giới thương hiệu (1 câu)</span>
            <input
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.world}
              onChange={(e) => setVisual((v) => ({ ...v, world: e.target.value }))}
              placeholder="Vd: bàn làm việc tối giản, sổ tay, đèn bàn ấm"
            />
          </label>
        </div>

        {msg ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {msg}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? 'Đang lưu…' : 'Lưu nhận diện ảnh'}
          </Button>
          <Link href="/drafts" className="text-center text-xs font-medium text-primary">
            Về chờ duyệt →
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
