'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Pencil, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppNav } from '@/components/app-nav'
import { SAMPLE_BRAND_PROFILE } from '@/lib/mock-data'
import { loadBrandProfile, saveBrandProfile } from '@/lib/supabase/db'

type Profile = typeof SAMPLE_BRAND_PROFILE

export default function BrandProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>(SAMPLE_BRAND_PROFILE)
  const [locked, setLocked] = useState(false)
  const [hasRecord, setHasRecord] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await loadBrandProfile()
      if (cancelled) return

      if (result.ok && !result.empty && result.data?.profile) {
        setProfile(result.data.profile)
        setLocked(Boolean(result.locked))
        setHasRecord(true)
        setStatus('Đã tải hồ sơ từ tài khoản của bạn')
      } else if (result.ok && result.empty) {
        setStatus('Chưa có hồ sơ — hãy hoàn thành onboarding')
      } else if (!result.ok && result.reason === 'not_logged_in') {
        setStatus('Chưa đăng nhập — hồ sơ chỉ lưu tạm trên máy')
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function lockProfile() {
    setSaving(true)
    setError(null)
    try {
      localStorage.setItem('pba_profile_locked', '1')
    } catch {}

    const result = await saveBrandProfile({
      profile,
      locked: true,
      source: 'mock',
    })

    setSaving(false)

    if (!result.ok && result.reason === 'db_error') {
      setError(result.message || 'Không lưu được lên server')
      return
    }
    if (!result.ok && result.reason === 'not_logged_in') {
      setError('Bạn chưa đăng nhập — hồ sơ chưa gắn vào tài khoản')
      return
    }

    setLocked(true)
    router.push('/roadmap')
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-2 text-sm">Đang tải hồ sơ...</span>
      </main>
    )
  }

  return (
    <main className="min-h-svh pb-28 text-foreground">
      <div className="page-shell">
        <header className="space-y-3 border-b border-border/60 py-4">
          <AppNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(locked || hasRecord ? '/' : '/onboarding')}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted"
              aria-label="Quay lại"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-semibold tracking-tight">Hồ sơ thương hiệu</h1>
              <p className="text-xs text-muted-foreground">Xem và chỉnh trước khi khóa</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                locked ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
              }`}
            >
              {locked ? 'Đã khóa' : 'Chưa khóa'}
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-4 py-6">
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <p className="text-sm leading-6 text-muted-foreground">
            Khi nối Claude, phần này sẽ là profile thật từ câu trả lời của bạn. Hiện có thể khóa và lưu vào
            tài khoản.
          </p>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">1. Định vị cốt lõi</h2>
            <div className="space-y-2 text-sm leading-6">
              <p>
                <span className="text-muted-foreground">Đối tượng: </span>
                {profile.dinhVi.doiTuong}
              </p>
              <p>
                <span className="text-muted-foreground">Tình huống: </span>
                {profile.dinhVi.tinhHuong}
              </p>
              <p>
                <span className="text-muted-foreground">Kết quả: </span>
                {profile.dinhVi.ketQua}
              </p>
              <p className="mt-3 rounded-xl bg-primary/5 p-3 font-medium">{profile.dinhVi.cauDinhVi}</p>
            </div>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">2. Điểm khác biệt</h2>
            <div className="space-y-2 text-sm leading-6">
              <p>
                <span className="text-muted-foreground">Phổ biến: </span>
                {profile.khacBiet.phoBien}
              </p>
              <p>
                <span className="text-muted-foreground">Bạn làm khác: </span>
                {profile.khacBiet.diemKhac}
              </p>
              <p>
                <span className="text-muted-foreground">Lý do: </span>
                {profile.khacBiet.lyDo}
              </p>
            </div>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">3. Câu chuyện & Nguyên liệu</h2>
            <p className="text-sm leading-6">{profile.cauChuyen}</p>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">4. Niềm tin & Quan điểm</h2>
            <p className="text-sm leading-6">{profile.niemTin}</p>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">5. Giọng điệu</h2>
            <div className="space-y-2 text-sm leading-6">
              <p>
                <span className="text-muted-foreground">Phong cách: </span>
                {profile.giongDieu.phongCach}
              </p>
              <p>
                <span className="text-muted-foreground">Ưu tiên: </span>
                {profile.giongDieu.uuTien}
              </p>
              <p>
                <span className="text-muted-foreground">Xưng hô: </span>
                {profile.giongDieu.xungHo}
              </p>
              <p>
                <span className="text-muted-foreground">Tránh: </span>
                {profile.giongDieu.tranh}
              </p>
            </div>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">6. Điểm nghẽn hiện tại</h2>
            <p className="text-sm leading-6">{profile.diemNghen}</p>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">7. Mục tiêu 12 tháng</h2>
            <p className="text-sm leading-6">{profile.mucTieu12Thang}</p>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">8. Định hướng giai đoạn đầu</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6">
              {profile.dinhHuong.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="sticky-action">
        <div className="page-shell flex gap-2 !px-0">
          <Button variant="outline" className="h-11 flex-1 rounded-2xl" disabled>
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
          <Button className="h-11 flex-1 rounded-2xl" onClick={lockProfile} disabled={saving || locked}>
            <Lock className="size-4" />
            {saving ? 'Đang lưu...' : locked ? 'Đã khóa' : 'Khóa hồ sơ'}
          </Button>
        </div>
      </div>
    </main>
  )
}
