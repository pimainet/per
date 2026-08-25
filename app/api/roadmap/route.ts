import { NextResponse } from 'next/server'
import { ROADMAP_SYSTEM, buildRoadmapUserMessage } from '@/lib/prompts/roadmap'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Chưa cấu hình ANTHROPIC_API_KEY' }, { status: 500 })
  }

  let body: { profile?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 })
  }
  if (!body.profile) {
    return NextResponse.json({ error: 'Thiếu profile' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        temperature: 0.4,
        system: ROADMAP_SYSTEM,
        messages: [{ role: 'user', content: buildRoadmapUserMessage(body.profile) }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      let message = `Claude API lỗi (${res.status})`
      try {
        message = JSON.parse(errText)?.error?.message || message
      } catch {}
      return NextResponse.json({ error: message, detail: errText.slice(0, 400) }, { status: 502 })
    }

    const data = await res.json()
    const text: string =
      data?.content?.find((c: { type: string }) => c.type === 'text')?.text ||
      data?.content?.[0]?.text ||
      ''
    const roadmap = parseJson(text)
    if (!roadmap) {
      return NextResponse.json({ error: 'Không parse được lộ trình', raw: text.slice(0, 800) }, { status: 502 })
    }
    return NextResponse.json({ roadmap, source: 'claude' })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi gọi Claude' },
      { status: 500 },
    )
  }
}

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
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
