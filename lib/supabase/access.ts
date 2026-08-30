'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { defaultAccess, normalizeAccess, type UserAccess } from '@/lib/access'

export async function getUserAccess(): Promise<UserAccess> {
  if (!isSupabaseConfigured()) return defaultAccess()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return defaultAccess()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('access_level, plan, paid_until, batch_used')
    .eq('id', user.id)
    .maybeSingle()

  // Cột chưa migrate → coi như trial, không crash
  if (error) {
    console.warn('getUserAccess', error.message)
    return defaultAccess()
  }
  return normalizeAccess(data)
}

export async function markBatchUsed() {
  if (!isSupabaseConfigured()) return
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_profiles')
    .update({ batch_used: true, updated_at: new Date().toISOString() })
    .eq('id', user.id)
}
