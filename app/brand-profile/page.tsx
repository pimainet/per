'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SAMPLE_BRAND_PROFILE } from '@/lib/mock-data'

export default function BrandProfilePage() {
  const router = useRouter()
  const profile = SAMPLE_BRAND_PROFILE

  function lockProfile() {
    try {
      localStorage.setItem('pba_profile_locked', '1')
    } catch {}
    router.push('/roadmap')
  }

  return (
    <main className="min-h-svh pb-28 text-foreground">
      <div className="page-shell">
        <header className="flex items-center gap-3 border-b border-border/60 py-4">
          <Link href="/onboarding" aria-label="Quay lại" className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">Hồ sơ thương hiệu</h1>
            <p className="text-xs text-muted-foreground">Xem và chỉnh trước khi khóa</p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Chưa khóa</span>
        </header>

        <div className="flex flex-col gap-4 py-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Đây là những gì AI hiểu về bạn từ phần onboarding. Chỉnh nếu cần, rồi khóa để mở lộ trình.
          </p>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">1. Định vị cốt lõi</h2>
            <div className="space-y-2 text-sm leading-6">
              <p><span className="text-muted-foreground">Đối tượng: </span>{profile.dinhVi.doiTuong}</p>
              <p><span className="text-muted-foreground">Tình huống: </span>{profile.dinhVi.tinhHuong}</p>
              <p><span className="text-muted-foreground">Kết quả: </span>{profile.dinhVi.ketQua}</p>
              <p className="mt-3 rounded-xl bg-primary/5 p-3 font-medium">{profile.dinhVi.cauDinhVi}</p>
            </div>
          </section>

          <section className="card-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold">2. Điểm khác biệt</h2>
            <div className="space-y-2 text-sm leading-6">
              <p><span className="text-muted-foreground">Phổ biến: </span>{profile.khacBiet.phoBien}</p>
              <p><span className="text-muted-foreground">Bạn làm khác: </span>{profile.khacBiet.diemKhac}</p>
              <p><span className="text-muted-foreground">Lý do: </span>{profile.khacBiet.lyDo}</p>
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
              <p><span className="text-muted-foreground">Phong cách: </span>{profile.giongDieu.phongCach}</p>
              <p><span className="text-muted-foreground">Ưu tiên: </span>{profile.giongDieu.uuTien}</p>
              <p><span className="text-muted-foreground">Xưng hô: </span>{profile.giongDieu.xungHo}</p>
              <p><span className="text-muted-foreground">Tránh: </span>{profile.giongDieu.tranh}</p>
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
          <Button variant="outline" className="h-11 flex-1 rounded-2xl">
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
          <Button className="h-11 flex-1 rounded-2xl" onClick={lockProfile}>
            <Lock className="size-4" />
            Khóa hồ sơ
          </Button>
        </div>
      </div>
    </main>
  )
}
