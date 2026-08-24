'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { SAMPLE_BRAND_PROFILE } from '@/lib/mock-data'

export type BrandProfileData = {
  answers?: string[]
  profile?: typeof SAMPLE_BRAND_PROFILE
  source?: 'mock' | 'claude'
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

/** Lưu câu trả lời onboarding + profile (mẫu hoặc thật) theo user */
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

  // Đọc bản hiện có để merge (không mất answers khi chỉ lock profile)
  const { data: existing } = await supabase
    .from('brand_profiles')
    .select('data, locked')
    .eq('user_id', user.id)
    .maybeSingle()

  const prev = (existing?.data || {}) as BrandProfileData
  const nextData: BrandProfileData = {
    answers: input.answers ?? prev.answers,
    profile: input.profile ?? prev.profile ?? SAMPLE_BRAND_PROFILE,
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

  return { ok: true as const }
}

/** Đọc brand profile của user đang đăng nhập */
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
