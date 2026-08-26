'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

type WaitKind = 'profile' | 'roadmap' | 'drafts' | 'generic'

const LINES: Record<WaitKind, string[]> = {
  profile: [
    'Mình đang đọc kỹ từng câu trả lời của bạn — không lược qua cho xong.',
    'Đang giữ góc cạnh thật, không làm “đẹp” thành generic.',
    'Hồ sơ này sẽ là la bàn cho mọi bài sau này.',
    'Chỉ thêm một chút nữa — phần định vị đang được siết lại.',
  ],
  roadmap: [
    'Mình đang thiết kế nhịp nội dung bám đúng hồ sơ của bạn.',
    'Không phải lịch đăng cho có — mỗi trụ cột phải có lý do.',
    'Đang canh rủi ro: tránh viết lệch giọng hoặc quá khô.',
    'Sắp xong lộ trình giai đoạn — bạn sẽ thấy rõ tuần này viết gì.',
  ],
  drafts: [
    'Mình đang soạn bài đúng giọng bạn, không dùng văn mẫu.',
    'Mỗi bài cần gắn trụ cột lộ trình — đang căn chỉnh.',
    'Sắp đưa vào “Chờ duyệt” để bạn chỉ việc đọc và quyết.',
    'Viết chậm một chút để không sáo — cảm ơn bạn đã đợi.',
  ],
  generic: [
    'Mình đang xử lý — không bỏ bạn ở màn hình trống.',
    'Việc này thường mất khoảng 15–40 giây.',
    'Bạn có thể giữ app mở; mình báo khi xong.',
  ],
}

const STEPS: Record<WaitKind, string[]> = {
  profile: ['Đọc câu trả lời', 'Rút định vị & khác biệt', 'Siết giọng & hướng nội dung'],
  roadmap: ['Đọc Brand Profile', 'Chọn trụ cột giai đoạn', 'Xếp nhịp tuần mẫu'],
  drafts: ['Bám profile + lộ trình', 'Viết đúng giọng', 'Đưa vào chờ duyệt'],
  generic: ['Tiếp nhận yêu cầu', 'Xử lý', 'Hoàn tất'],
}

export function AiWaiting({
  kind = 'generic',
  firstName,
  title,
  subtitle,
}: {
  kind?: WaitKind
  firstName?: string
  title?: string
  subtitle?: string
}) {
  const lines = LINES[kind]
  const steps = STEPS[kind]
  const [lineIndex, setLineIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)

  const hello = useMemo(() => {
    if (firstName) return `${firstName}, `
    return ''
  }, [firstName])

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length)
    }, 4200)
    return () => window.clearInterval(t)
  }, [lines.length])

  useEffect(() => {
    const t = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
    }, 7000)
    return () => window.clearInterval(t)
  }, [steps.length])

  const defaultTitle =
    kind === 'profile'
      ? 'Mình đang dựng hồ sơ thương hiệu'
      : kind === 'roadmap'
        ? 'Mình đang thiết kế lộ trình'
        : kind === 'drafts'
          ? 'Mình đang soạn bài cho bạn'
          : 'Mình đang xử lý'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="card-elevated overflow-hidden">
          <div className="bg-primary px-5 py-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">
                  Bạn đồng hành
                </p>
                <h1 className="text-lg font-semibold tracking-tight">
                  {hello}
                  {title || defaultTitle}
                </h1>
              </div>
              <Loader2 className="size-5 shrink-0 animate-spin opacity-90" />
            </div>
            <p className="mt-4 min-h-[3.5rem] text-[15px] leading-7 opacity-95">
              {lines[lineIndex]}
            </p>
          </div>

          <div className="space-y-4 bg-card px-5 py-5">
            <p className="text-xs text-muted-foreground">
              {subtitle || 'Thường mất khoảng 15–40 giây. Giữ màn hình này nhé.'}
            </p>

            <ol className="space-y-2.5">
              {steps.map((s, i) => {
                const done = i < stepIndex
                const current = i === stepIndex
                return (
                  <li key={s} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : current
                            ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span
                      className={
                        current ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }
                    >
                      {s}
                    </span>
                  </li>
                )
              })}
            </ol>

            <p className="text-center text-[11px] text-muted-foreground">
              Đã chờ {seconds}s
              {seconds > 45 ? ' — gần xong, model đang viết kỹ hơn bình thường.' : ''}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
