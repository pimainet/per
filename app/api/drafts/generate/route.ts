import { NextResponse } from 'next/server'
import { DRAFTS_SYSTEM, buildDraftsUserMessage } from '@/lib/prompts/drafts'

export const runtime = 'nodejs'
export const maxDuration = 90

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Chưa cấu hình ANTHROPIC_API_KEY' }, { status: 500 })
  }

  let body: { profile?: unknown; roadmap?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 })
  }
  if (!body.profile || !body.roadmap) {
    return NextResponse.json({ error: 'Thiếu profile hoặc roadmap' }, { status: 400 })
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
        max_tokens: 3500,
        temperature: 0.5,
        system: DRAFTS_SYSTEM,
        messages: [{ role: 'user', content: buildDraftsUserMessage(body.profile, body.roadmap) }],
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
    const drafts = parseJson(text)
    if (!Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json({ error: 'Không parse được bài', raw: text.slice(0, 800) }, { status: 502 })
    }
    return NextResponse.json({ drafts, source: 'claude' })
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
    const m = cleaned.match(/\[[\s\S]*\]/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
    } catch {
      return null
    }
  }
}
