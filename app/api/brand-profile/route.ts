import { NextResponse } from 'next/server'
import {
  BRAND_PROFILE_SYSTEM,
  buildBrandProfileUserMessage,
} from '@/lib/prompts/brand-profile'
import { ONBOARDING_QUESTIONS } from '@/lib/mock-data'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chưa cấu hình ANTHROPIC_API_KEY trên server' },
      { status: 500 },
    )
  }

  let body: { answers?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 })
  }

  const answers = body.answers
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Thiếu answers' }, { status: 400 })
  }

  const userMessage = buildBrandProfileUserMessage(
    answers,
    ONBOARDING_QUESTIONS.map((q) => ({ text: q.text })),
  )

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        temperature: 0.3,
        system: BRAND_PROFILE_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic error', res.status, errText)
      return NextResponse.json(
        { error: 'Claude API lỗi', detail: errText.slice(0, 500) },
        { status: 502 },
      )
    }

    const data = await res.json()
    const text: string =
      data?.content?.find((c: { type: string }) => c.type === 'text')?.text ||
      data?.content?.[0]?.text ||
      ''

    const profile = parseProfileJson(text)
    if (!profile) {
      return NextResponse.json(
        { error: 'Không parse được JSON profile', raw: text.slice(0, 1000) },
        { status: 502 },
      )
    }

    return NextResponse.json({ profile, source: 'claude' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Lỗi gọi Claude' }, { status: 500 })
  }
}

function parseProfileJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}
