'use client'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export type Ingredient = {
  id: string
  content: string
  created_at: string
}

export async function listIngredients() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const, items: [] as Ingredient[] }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, reason: 'not_logged_in' as const, items: [] as Ingredient[] }
  }

  const { data, error } = await supabase
    .from('memories')
    .select('id, content, created_at')
    .eq('user_id', user.id)
    .eq('kind', 'ingredient')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('listIngredients', error)
    return {
      ok: false as const,
      reason: 'db_error' as const,
      message: error.message,
      items: [] as Ingredient[],
    }
  }

  return {
    ok: true as const,
    items: (data || []).map((r) => ({
      id: String(r.id),
      content: String(r.content),
      created_at: String(r.created_at),
    })),
  }
}

export async function addIngredient(content: string) {
  const text = content.trim()
  if (!text) return { ok: false as const, reason: 'empty' as const }
  if (text.length > 2000) return { ok: false as const, reason: 'too_long' as const }

  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { data, error } = await supabase
    .from('memories')
    .insert({ user_id: user.id, kind: 'ingredient', content: text })
    .select('id, content, created_at')
    .single()

  if (error) {
    console.error('addIngredient', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }

  return {
    ok: true as const,
    item: {
      id: String(data.id),
      content: String(data.content),
      created_at: String(data.created_at),
    } satisfies Ingredient,
  }
}

export async function deleteIngredient(id: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: 'not_configured' as const }
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, reason: 'not_logged_in' as const }

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('kind', 'ingredient')

  if (error) {
    console.error('deleteIngredient', error)
    return { ok: false as const, reason: 'db_error' as const, message: error.message }
  }
  return { ok: true as const }
}
