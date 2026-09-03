import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVnDateString, vnWeekdayLabel } from '@/lib/schedule'
import { generateScheduledDraftForUser } from '@/lib/schedule-generate'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_USERS_PER_RUN = 20

export async function GET(request: Request) {
  return runCron(request)
}

export async function POST(request: Request) {
  return runCron(request)
}

async function runCron(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Admin client lỗi' },
      { status: 500 },
    )
  }

  const { data: profiles, error: pErr } = await admin
    .from('brand_profiles')
    .select('user_id')
    .eq('locked', true)
    .limit(MAX_USERS_PER_RUN)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  const results: { userId: string; status: string; detail?: string }[] = []

  for (const row of profiles || []) {
    const userId = row.user_id as string
    const r = await generateScheduledDraftForUser(userId)
    results.push({ userId, status: r.status, detail: r.detail })
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    vnDate: getVnDateString(),
    vnWeekday: vnWeekdayLabel(),
    processed: results.length,
    results,
  })
}
