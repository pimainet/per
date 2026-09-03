import { createAdminClient } from '@/lib/supabase/admin'
import { parsePostsPerWeek, shouldWriteToday, startOfWeek, vnWeekdayLabel } from '@/lib/schedule'
import { SINGLE_DRAFT_SYSTEM, buildSingleDraftUserMessage } from '@/lib/prompts/single-draft'
import { pickIngredients } from '@/lib/ingredients/pick'
import { normalizeAccess, canRunCron, PLAN_POSTS } from '@/lib/access'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const MAX_PENDING = 5

export type ScheduleResult = {
  status: 'created' | 'skip' | 'error'
  detail?: string
}

/** Tạo tối đa 1 bài theo lịch cho 1 user — dùng chung cron + nút đồng bộ */
export async function generateScheduledDraftForUser(userId: string): Promise<ScheduleResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 'error', detail: 'missing_anthropic_key' }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return { status: 'error', detail: e instanceof Error ? e.message : 'admin_error' }
  }

  const { data: accessRow } = await admin
    .from('user_profiles')
    .select('access_level, plan, paid_until, batch_used')
    .eq('id', userId)
    .maybeSingle()
  const access = normalizeAccess(accessRow)
  if (!canRunCron(access)) {
    return {
      status: 'skip',
      detail: `not_paid (level=${access.accessLevel}) — bật access_level=paid trong Supabase để lịch tự soạn`,
    }
  }

  const { data: profRow } = await admin
    .from('brand_profiles')
    .select('data, locked')
    .eq('user_id', userId)
    .maybeSingle()
  if (!profRow?.locked) {
    return { status: 'skip', detail: 'profile_not_locked' }
  }
  const profile = (profRow.data as { profile?: unknown })?.profile
  if (!profile) {
    return { status: 'skip', detail: 'no_profile' }
  }

  const { data: roadmapRow } = await admin
    .from('roadmaps')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (!roadmapRow?.data) {
    return { status: 'skip', detail: 'no_roadmap' }
  }
  const roadmap = roadmapRow.data
  const postsPerWeek = Math.min(
    parsePostsPerWeek(roadmap),
    access.postsPerWeekCap || PLAN_POSTS[access.plan] || 3,
  )

  if (!shouldWriteToday(postsPerWeek)) {
    return {
      status: 'skip',
      detail: `not_scheduled_today (hôm nay ${vnWeekdayLabel()}, nhịp ${postsPerWeek}/tuần)`,
    }
  }

  const { count: pendingCount } = await admin
    .from('drafts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')
  if ((pendingCount ?? 0) >= MAX_PENDING) {
    return { status: 'skip', detail: `too_many_pending (${pendingCount})` }
  }

  const weekStart = startOfWeek()
  const { count: weekCount } = await admin
    .from('drafts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .ilike('note', '%theo lịch%')
  if ((weekCount ?? 0) >= postsPerWeek) {
    return {
      status: 'skip',
      detail: `week_quota_full (${weekCount}/${postsPerWeek})`,
    }
  }

  // Đã tạo bài lịch hôm nay chưa? (tránh bấm nút / cron 2 lần cùng ngày)
  const todayVn = new Date().toLocaleString('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dayStart = new Date(`${todayVn}T00:00:00+07:00`)
  const { count: todayScheduled } = await admin
    .from('drafts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayStart.toISOString())
    .ilike('note', '%theo lịch%')
  if ((todayScheduled ?? 0) >= 1) {
    return { status: 'skip', detail: 'already_created_today' }
  }

  const todayLabel = vnWeekdayLabel()
  const tuanMau = (roadmap as { tuanMau?: { ngay?: string; goiY?: string; loai?: string }[] })
    .tuanMau
  const slot = tuanMau?.find((x) => {
    if (!x.ngay) return false
    const a = x.ngay.replace(/\s/g, '').toLowerCase()
    const b = todayLabel.replace(/\s/g, '').toLowerCase()
    return a === b || a.includes(b) || b.includes(a)
  })
  let hint = slot
    ? `${slot.loai || ''} — ${slot.goiY || ''}`
    : `Nhịp ${postsPerWeek} bài/tuần · hôm nay ${todayLabel}`

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
    .select('pillar, note')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  const recentAngles = (recentDrafts || [])
    .map((d) => `${d.pillar || ''}: ${(d.note || '').slice(0, 80)}`)
    .filter(Boolean)
    .join(' | ')
  if (recentAngles) {
    hint = `${hint}\n\nTránh trùng mũi nhọn các bài gần đây: ${recentAngles}`
  }

  try {
    const draft = await callClaudeOneDraft(profile, roadmap, hint, ingredients)
    if (!draft?.content) {
      return { status: 'error', detail: 'claude_empty' }
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
      return { status: 'error', detail: insErr.message }
    }

    await admin.from('memories').insert({
      user_id: userId,
      kind: 'draft_scheduled',
      content: `Đã tự tạo 1 bài theo lịch (${postsPerWeek}/tuần)`,
    })

    return { status: 'created', detail: 'ok' }
  } catch (e) {
    return {
      status: 'error',
      detail: e instanceof Error ? e.message : 'unknown',
    }
  }
}

async function callClaudeOneDraft(
  profile: unknown,
  roadmap: unknown,
  hint: string,
  ingredients?: string[],
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
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
