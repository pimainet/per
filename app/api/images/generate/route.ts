import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeAccess } from '@/lib/access'
import { buildImagePrompt } from '@/lib/visual/prompt'
import { DEFAULT_VISUAL, isVisualReady, type BrandVisual } from '@/lib/visual/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3'
const MAX_PER_DAY = 6

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Chưa cấu hình OPENAI_API_KEY trên Vercel' },
      { status: 500 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
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

  const { data: accessRow } = await admin
    .from('user_profiles')
    .select('access_level, plan, paid_until, batch_used')
    .eq('id', user.id)
    .maybeSingle()
  const access = normalizeAccess(accessRow)
  if (access.accessLevel !== 'paid') {
    return NextResponse.json(
      { error: 'Tạo ảnh chỉ mở cho gói đã kích hoạt (paid).' },
      { status: 403 },
    )
  }

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const { count } = await admin
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kind', 'image_gen')
    .gte('created_at', dayStart.toISOString())
  if ((count ?? 0) >= MAX_PER_DAY) {
    return NextResponse.json(
      { error: `Hôm nay đã tạo ${MAX_PER_DAY} lần ảnh. Thử lại ngày mai.` },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const draftId = body.draftId as string | undefined
  const content = (body.content as string) || ''
  if (!content.trim()) {
    return NextResponse.json({ error: 'Thiếu nội dung bài' }, { status: 400 })
  }

  const { data: visualRow } = await admin
    .from('brand_visuals')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()
  const visual: BrandVisual = {
    ...DEFAULT_VISUAL,
    ...((visualRow?.data as BrandVisual) || {}),
  }
  if (!isVisualReady(visual)) {
    return NextResponse.json(
      { error: 'Chưa có nhận diện ảnh. Vào mục Nhận diện ảnh và lưu kit trước.' },
      { status: 400 },
    )
  }

  const prompt = buildImagePrompt(visual, content)

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt.slice(0, 3900),
      n: 1,
      size: '1024x1024',
      // natural = bớt “AI poster”; hd = nét hơn (dall-e-3)
      ...(MODEL.includes('dall-e')
        ? { quality: 'hd', style: 'natural' }
        : {}),
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    return NextResponse.json(
      { error: `Image API ${res.status}: ${t.slice(0, 240)}` },
      { status: 502 },
    )
  }

  const data = await res.json()
  const imageUrl: string | undefined =
    data?.data?.[0]?.url ||
    (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : undefined)

  if (!imageUrl) {
    return NextResponse.json({ error: 'API không trả URL ảnh' }, { status: 502 })
  }

  await admin.from('memories').insert({
    user_id: user.id,
    kind: 'image_gen',
    content: `image ${draftId || ''} · ${prompt.slice(0, 120)}`,
  })

  if (draftId) {
    await admin
      .from('drafts')
      .update({ image_url: imageUrl })
      .eq('id', draftId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true, imageUrl, promptPreview: prompt.slice(0, 200) })
}
