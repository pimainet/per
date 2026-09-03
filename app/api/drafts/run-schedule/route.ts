import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateScheduledDraftForUser } from '@/lib/schedule-generate'
import { vnWeekdayLabel } from '@/lib/schedule'

export const runtime = 'nodejs'
export const maxDuration = 60

/** User bấm "Lấy bài theo lịch hôm nay" — cùng rule với cron */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const r = await generateScheduledDraftForUser(user.id)

  const messages: Record<string, string> = {
    created: 'Đã thêm 1 bài vào Chờ duyệt.',
    not_paid: 'Gói chưa kích hoạt (paid) — lịch tự soạn chỉ chạy khi đã mở gói.',
    not_scheduled_today: `Hôm nay (${vnWeekdayLabel()}) không nằm trong nhịp đã chọn. Đổi nhịp trên Lộ trình hoặc đợi đúng ngày.`,
    already_created_today: 'Hôm nay đã có bài theo lịch rồi.',
    week_quota_full: 'Đã đủ số bài lịch trong tuần này.',
    too_many_pending: 'Còn quá nhiều bài chưa duyệt — duyệt bớt rồi thử lại.',
    profile_not_locked: 'Cần khóa Brand Profile trước.',
    no_roadmap: 'Chưa có lộ trình.',
  }

  let message = r.detail || r.status
  if (r.status === 'created') message = messages.created
  else if (r.detail?.startsWith('not_paid')) message = messages.not_paid
  else if (r.detail?.startsWith('not_scheduled_today')) message = messages.not_scheduled_today
  else if (r.detail?.startsWith('already_created')) message = messages.already_created_today
  else if (r.detail?.startsWith('week_quota')) message = messages.week_quota_full
  else if (r.detail?.startsWith('too_many_pending')) message = messages.too_many_pending
  else if (r.detail === 'profile_not_locked') message = messages.profile_not_locked
  else if (r.detail === 'no_roadmap') message = messages.no_roadmap

  return NextResponse.json({
    ok: r.status === 'created',
    status: r.status,
    detail: r.detail,
    message,
    vnWeekday: vnWeekdayLabel(),
  })
}
