'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { AppNav } from '@/components/app-nav'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_VISUAL,
  STYLE_PRESETS,
  type BrandVisual,
  type PeopleMode,
  type StylePresetId,
} from '@/lib/visual/types'
import { loadBrandVisual, saveBrandVisual } from '@/lib/supabase/visual'

export default function NhanDienPage() {
  const [visual, setVisual] = useState<BrandVisual>(DEFAULT_VISUAL)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await loadBrandVisual()
      if (res.ok) {
        const v = { ...DEFAULT_VISUAL, ...res.visual }
        if (!v.stylePreset) v.stylePreset = 'desk_minimal'
        setVisual(v)
      }
      setLoading(false)
    })()
  }, [])

  function applyPreset(id: StylePresetId) {
    if (id === 'custom') {
      setVisual((v) => ({ ...v, stylePreset: 'custom' }))
      return
    }
    const p = STYLE_PRESETS[id]
    setVisual((v) => ({
      ...v,
      stylePreset: id,
      styleWords: p.styleWords,
      world: v.world?.trim() ? v.world : p.worldHint,
    }))
  }

  async function onSave() {
    setSaving(true)
    setMsg(null)
    const res = await saveBrandVisual(visual)
    setSaving(false)
    if (!res.ok) {
      setMsg(
        res.reason === 'db_error'
          ? res.message || 'Lỗi lưu'
          : 'Không lưu được — kiểm tra đăng nhập / bảng brand_visuals',
      )
      return
    }
    setMsg('Đã lưu. Kit này sẽ khóa style mọi ảnh gợi ý — chỉ đổi khi rebrand.')
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
          Chọn <strong className="font-medium text-foreground">một preset</strong> và giữ cố định.
          Ảnh theo kiểu chụp editorial — không poster AI. Đổi kit = đổi cả “họ ảnh”.
        </p>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Preset style (khuyến nghị)</span>
            <div className="grid gap-2">
              {(
                Object.entries(STYLE_PRESETS) as [
                  Exclude<StylePresetId, 'custom'>,
                  (typeof STYLE_PRESETS)[Exclude<StylePresetId, 'custom'>],
                ][]
              ).map(([id, meta]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    visual.stylePreset === id
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-input bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="block text-foreground">{meta.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug opacity-80">
                    {meta.worldHint}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyPreset('custom')}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                  visual.stylePreset === 'custom'
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-input text-muted-foreground'
                }`}
              >
                Tự mô tả style
              </button>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Người trên ảnh</span>
            <select
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.peopleMode}
              onChange={(e) =>
                setVisual((v) => ({ ...v, peopleMode: e.target.value as PeopleMode }))
              }
            >
              <option value="none">Không người — dễ nhất quán, ít “AI face”</option>
              <option value="no_face">Có người nhưng không lộ mặt</option>
              <option value="people_ok">Cho phép người (chấp nhận mặt AI)</option>
            </select>
          </label>

          {visual.stylePreset === 'custom' ? (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Style tự viết</span>
              <input
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                value={visual.styleWords}
                onChange={(e) => setVisual((v) => ({ ...v, styleWords: e.target.value }))}
                placeholder="documentary, natural light, muted…"
              />
            </label>
          ) : null}

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
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Thế giới thương hiệu (1 câu)</span>
            <input
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              value={visual.world}
              onChange={(e) => setVisual((v) => ({ ...v, world: e.target.value }))}
              placeholder="Vd: bàn gỗ tối giản, sổ tay, ánh cửa sổ"
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
          <p className="text-center text-[11px] text-muted-foreground">
            Sau khi lưu: mở bài đã duyệt → Gợi ý ảnh. Chọn tấm đúng kit; bỏ tấm bóng bẩy lệch style.
          </p>
          <Link href="/drafts" className="text-center text-xs font-medium text-primary">
            Về chờ duyệt →
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
