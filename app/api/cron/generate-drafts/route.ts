import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parsePostsPerWeek, shouldWriteToday, startOfWeek, getVnDateString, vnWeekdayLabel } from '@/lib/schedule'
import {
  SINGLE_DRAFT_SYSTEM,
  buildSingleDraftUserMessage,
} from '@/lib/prompts/single-draft'
import { pickIngredients } from '@/lib/ingredients/pick'
import { normalizeAccess, canRunCron, PLAN_POSTS } from '@/lib/access'

export const runtime = 'nodejs'
export const maxDuration = 300

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const MAX_PENDING = 5 // còn nhiều bài chờ → không tạo thêm
const MAX_USERS_PER_RUN = 20 // tránh timeout

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Thiếu ANTHROPIC_API_KEY' }, { status: 500 })
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

  const weekStart = startOfWeek()
  const results: { userId: string; status: string; detail?: string }[] = []

  // User đã khóa profile
  const { data: profiles, error: pErr } = await admin
    .from('brand_profiles')
    .select('user_id, data, locked')
    .eq('locked', true)
    .limit(MAX_USERS_PER_RUN)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  for (const row of profiles || []) {
    const userId = row.user_id as string
    const profileData = (row.data || {}) as { profile?: unknown }
    const profile = profileData.profile
    if (!profile) {
      results.push({ userId, status: 'skip', detail: 'no_profile' })
      continue
    }

    const { data: accessRow } = await admin
      .from('user_profiles')
      .select('access_level, plan, paid_until, batch_used')
      .eq('id', userId)
      .maybeSingle()
    const access = normalizeAccess(accessRow)
    if (!canRunCron(access)) {
      results.push({ userId, status: 'skip', detail: `not_paid (level=${access.accessLevel})` })
      continue
    }

    const { data: roadmapRow } = await admin
      .from('roadmaps')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()

    if (!roadmapRow?.data) {
      results.push({ userId, status: 'skip', detail: 'no_roadmap' })
      continue
    }

    const roadmap = roadmapRow.data
    const postsPerWeek = Math.min(parsePostsPerWeek(roadmap), access.postsPerWeekCap || PLAN_POSTS[access.plan] || 3)

    if (!shouldWriteToday(postsPerWeek)) {
      results.push({ userId, status: 'skip', detail: 'not_scheduled_today' })
      continue
    }

    // Đếm bài chờ duyệt
    const { count: pendingCount } = await admin
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')

    if ((pendingCount ?? 0) >= MAX_PENDING) {
      results.push({ userId, status: 'skip', detail: 'too_many_pending' })
      continue
    }

    // Hạn tuần: chỉ đếm bài TỰ TẠO THEO LỊCH (cron), không tính batch đầu khi khóa lộ trình.
    // Batch đầu = "mồi" để duyệt; cron mới giữ nhịp các ngày còn lại trong tuần.
    const { count: weekCount } = await admin
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .ilike('note', '%theo lịch%')

    if ((weekCount ?? 0) >= postsPerWeek) {
      results.push({
        userId,
        status: 'skip',
        detail: `week_quota_full (${weekCount}/${postsPerWeek} scheduled)`,
      })
      continue
    }

    // Gợi ý từ tuanMau nếu có
    const todayLabel = vnWeekdayLabel()
    const tuanMau = (roadmap as { tuanMau?: { ngay?: string; goiY?: string; loai?: string }[] })
      .tuanMau
    const slot = tuanMau?.find((t) => {
      if (!t.ngay) return false
      const a = t.ngay.replace(/\s/g, '').toLowerCase()
      const b = todayLabel.replace(/\s/g, '').toLowerCase()
      return a === b || a.includes(b) || b.includes(a)
    })
    const scheduledLeft = postsPerWeek - (weekCount ?? 0)
    const hint = slot
      ? `${slot.loai || ''} — ${slot.goiY || ''}`
      : `Nhịp ${postsPerWeek} bài/tuần · hôm nay ${todayLabel} · còn ~${scheduledLeft} slot lịch tuần này`

    try {
      const { data: ingRows } = await admin
        .from('memories')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('kind', 'ingredient')
        .order('created_at', { ascending: false })
        .limit(30)
      const ingredients = pickIngredients(
        (ingRows || []).map((r) => ({
          content: r.content as string,
          created_at: (r as { created_at?: string }).created_at,
        })),
      )

      const { data: recentDrafts } = await admin
        .from('drafts')
        .select('pillar, note, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      const recentAngles = (recentDrafts || [])
        .map((d) => `${d.pillar || ''}: ${(d.note || '').slice(0, 80)}`)
        .filter(Boolean)
        .join(' | ')
      const hintWithAnti = recentAngles
        ? `${hint}\n\nTránh trùng mũi nhọn các bài gần đây: ${recentAngles}`
        : hint

      const draft = await generateOneDraft(profile, roadmap, hintWithAnti, ingredients)
      if (!draft) {
        results.push({ userId, status: 'error', detail: 'claude_empty' })
        continue
      }

      const { error: insErr } = await admin.from('drafts').insert({
        user_id: userId,
        platform: draft.platform || 'LinkedIn',
        pillar: draft.pillar || '',
        content: draft.content,
        note: draft.note || 'Tự tạo theo lịch',
        status: 'pending',
      })

      if (insErr) {
        results.push({ userId, status: 'error', detail: insErr.message })
        continue
      }

      await admin.from('memories').insert({
        user_id: userId,
        kind: 'draft_scheduled',
        content: `Đã tự tạo 1 bài theo lịch (${postsPerWeek}/tuần)`,
      })

      results.push({ userId, status: 'created' })
    } catch (e) {
      results.push({
        userId,
        status: 'error',
        detail: e instanceof Error ? e.message : 'unknown',
      })
    }
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

async function generateOneDraft(profile: unknown, roadmap: unknown, hint: string, ingredients?: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY!
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.5,
      system: SINGLE_DRAFT_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildSingleDraftUserMessage(profile, roadmap, hint, ingredients),
        },
      ],
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Claude ${res.status}: ${t.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string =
    data?.content?.find((c: { type: string }) => c.type === 'text')?.text ||
    data?.content?.[0]?.text ||
    ''

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
    } catch {
      return null
    }
  }
}
