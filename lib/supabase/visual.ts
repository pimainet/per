'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { DEFAULT_VISUAL, type BrandVisual } from '@/lib/visual/types'

export async function loadBrandVisual(): Promise<
  { ok: true; visual: BrandVisual } | { ok: false; reason: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: true, visual: DEFAULT_VISUAL }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'not_logged_in' }

  const { data, error } = await supabase
    .from('brand_visuals')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.warn('loadBrandVisual', error.message)
    return { ok: true, visual: DEFAULT_VISUAL }
  }
  if (!data?.data) return { ok: true, visual: DEFAULT_VISUAL }
  return { ok: true, visual: { ...DEFAULT_VISUAL, ...(data.data as BrandVisual) } }
}

export async function saveBrandVisual(visual: BrandVisual) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { error } = await supabase.from('brand_visuals').upsert(
    {
      user_id: user.id,
      data: visual,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const }
}

export async function saveDraftImage(draftId: string, imageUrl: string, allUrls?: string[]) {
  if (!isSupabaseConfigured()) return { ok: false as const }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }

  const patch: Record<string, unknown> = { image_url: imageUrl }
  if (allUrls) patch.image_urls = allUrls

  const { error } = await supabase
    .from('drafts')
    .update(patch)
    .eq('id', draftId)
    .eq('user_id', user.id)

  if (error) {
    console.error('saveDraftImage', error)
    return { ok: false as const, message: error.message }
  }
  return { ok: true as const }
}
