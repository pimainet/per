'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  SAMPLE_BRAND_PROFILE,
  SAMPLE_DRAFTS,
  SAMPLE_ROADMAP,
  type Draft,
} from '@/lib/mock-data'

export type BrandProfileData = {
  answers?: string[]
  profile?: typeof SAMPLE_BRAND_PROFILE
  source?: 'mock' | 'claude'
}

export type UserProgress = {
  loggedIn: boolean
  hasProfile: boolean
  profileLocked: boolean
  hasRoadmap: boolean
  draftCount: number
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}


/** Tạo / cập nhật user_profiles */
export async function ensureUserProfile() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'User'

  const { error } = await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.error('ensureUserProfile', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const }
}

/** Lưu style tạm từ profile (trước khi có Style Lock thật) */
export async function saveStyleProfile(profile = SAMPLE_BRAND_PROFILE, isTemporary = true) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const styleData = {
    phongCach: profile.giongDieu.phongCach,
    uuTien: profile.giongDieu.uuTien,
    xungHo: profile.giongDieu.xungHo,
    tranh: profile.giongDieu.tranh,
    source: isTemporary ? 'from_brand_profile' : 'style_lock',
  }

  const { error } = await supabase.from('style_profiles').upsert(
    {
      user_id: user.id,
      data: styleData,
      is_temporary: isTemporary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('saveStyleProfile', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const }
}

/** Ghi memory (phản hồi / sự kiện) */
export async function addMemory(kind: string, content: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { error } = await supabase.from('memories').insert({
    user_id: user.id,
    kind,
    content,
  })

  if (error) {
    console.error('addMemory', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const }
}

export async function getUserProgress(): Promise<UserProgress> {
  const empty: UserProgress = {
    loggedIn: false,
    hasProfile: false,
    profileLocked: false,
    hasRoadmap: false,
    draftCount: 0,
  }
  if (!isSupabaseConfigured()) return empty

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return empty

  const [profileRes, roadmapRes, draftsRes] = await Promise.all([
    supabase.from('brand_profiles').select('locked').eq('user_id', user.id).maybeSingle(),
    supabase.from('roadmaps').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return {
    loggedIn: true,
    hasProfile: Boolean(profileRes.data),
    profileLocked: Boolean(profileRes.data?.locked),
    hasRoadmap: Boolean(roadmapRes.data),
    draftCount: draftsRes.count ?? 0,
  }
}

export async function saveBrandProfile(input: {
  answers?: string[]
  profile?: typeof SAMPLE_BRAND_PROFILE
  locked?: boolean
  source?: 'mock' | 'claude'
}) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false as const, reason: 'not_logged_in' as const }
  }

  const { data: existing } = await supabase
    .from('brand_profiles')
    .select('data, locked')
    .eq('user_id', user.id)
    .maybeSingle()

  const prev = (existing?.data || {}) as BrandProfileData
  const nextData: BrandProfileData = {
    answers: input.answers ?? prev.answers,
    // Chỉ ghi profile khi có input mới; không ép SAMPLE đè lên dữ liệu user
    profile: input.profile ?? prev.profile,
    source: input.source ?? prev.source ?? 'mock',
  }

  const locked = input.locked ?? existing?.locked ?? false

  const { error } = await supabase.from('brand_profiles').upsert(
    {
      user_id: user.id,
      data: nextData,
      locked,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('saveBrandProfile', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }

  await ensureUserProfile()
  if (locked) {
    await saveStyleProfile(nextData.profile || SAMPLE_BRAND_PROFILE, true)
    await addMemory('profile_locked', 'User đã khóa Brand Profile')
  } else {
    await addMemory('onboarding_saved', 'User đã lưu câu trả lời onboarding')
  }

  return { ok: true as const }
}

export async function loadBrandProfile() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, reason: 'not_logged_in' as const }
  }

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('data, locked, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('loadBrandProfile', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }

  if (!data) {
    return { ok: true as const, empty: true as const }
  }

  return {
    ok: true as const,
    empty: false as const,
    data: data.data as BrandProfileData,
    locked: data.locked as boolean,
    updatedAt: data.updated_at as string,
  }
}


/** Xóa lộ trình + bài cũ khi user khóa profile mới — tránh dính content cũ */
export async function clearDownstreamData() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  await supabase.from('drafts').delete().eq('user_id', user.id)
  await supabase.from('roadmaps').delete().eq('user_id', user.id)
  await addMemory('downstream_cleared', 'Đã xóa lộ trình và bài cũ sau khi khóa hồ sơ mới')
  return { ok: true as const }
}

export async function saveRoadmap(roadmap = SAMPLE_ROADMAP) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { error } = await supabase.from('roadmaps').upsert(
    {
      user_id: user.id,
      data: roadmap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('saveRoadmap', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  await ensureUserProfile()
  await addMemory('roadmap_confirmed', 'User đã xác nhận lộ trình giai đoạn')
  return { ok: true as const }
}

export async function loadRoadmap() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { data, error } = await supabase
    .from('roadmaps')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  if (!data) return { ok: true as const, empty: true as const }

  return { ok: true as const, empty: false as const, data: data.data as typeof SAMPLE_ROADMAP }
}

export async function ensureSampleDrafts() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { count } = await supabase
    .from('drafts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) > 0) {
    return { ok: true as const, seeded: false as const }
  }

  const rows = SAMPLE_DRAFTS.map((d) => ({
    user_id: user.id,
    platform: d.platform,
    pillar: d.pillar,
    content: d.content,
    note: d.note,
    status: d.status || 'pending',
  }))

  const { error } = await supabase.from('drafts').insert(rows)
  if (error) {
    console.error('ensureSampleDrafts', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const, seeded: true as const }
}


export async function replaceDraftsWith(
  drafts: { platform: string; pillar?: string; content: string; note?: string }[],
) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  await supabase.from('drafts').delete().eq('user_id', user.id)

  const rows = drafts.map((d) => ({
    user_id: user.id,
    platform: d.platform,
    pillar: d.pillar || '',
    content: d.content,
    note: d.note || '',
    status: 'pending',
  }))

  const { error } = await supabase.from('drafts').insert(rows)
  if (error) {
    console.error('replaceDraftsWith', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  await addMemory('drafts_generated', `Đã tạo ${rows.length} bài nháp bằng AI`)
  return { ok: true as const }
}

export async function loadDrafts(): Promise<
  | { ok: true; drafts: (Draft & { dbId?: string })[] }
  | { ok: false; reason: string; message?: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: true, drafts: SAMPLE_DRAFTS }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: true, drafts: SAMPLE_DRAFTS }

  const { data, error } = await supabase
    .from('drafts')
    .select('id, platform, pillar, content, note, status, created_at')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('loadDrafts', error)
    return { ok: false, reason: 'db_error', message: error.message }
  }

  if (!data || data.length === 0) {
    return { ok: true, drafts: [] }
  }

  const drafts = data.map((row, i) => ({
    id: String(i + 1),
    dbId: row.id as string,
    platform: row.platform as Draft['platform'],
    pillar: (row.pillar as string) || '',
    time: formatTime(row.created_at as string),
    content: row.content as string,
    note: (row.note as string) || '',
    status: (row.status as Draft['status']) || 'pending',
  }))

  return { ok: true, drafts }
}

export async function updateDraftStatus(dbId: string, status: 'pending' | 'approved' | 'deleted') {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  if (status === 'deleted') {
    const { error } = await supabase.from('drafts').delete().eq('id', dbId).eq('user_id', user.id)
    if (error) return { ok: false as const, reason: 'db_error' as const, message: error.message }
    return { ok: true as const }
  }

  const { error } = await supabase
    .from('drafts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', dbId)
    .eq('user_id', user.id)

  if (error) return { ok: false as const, reason: 'db_error' as const, message: error.message }

  if (status === 'approved') {
    await addMemory('draft_approved', `Đã duyệt bài ${dbId}`)
  }

  return { ok: true as const }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
