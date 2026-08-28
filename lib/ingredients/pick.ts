/**
 * Chọn góc thật đưa vào brief soạn bài.
 * Pure — dùng được client + server (cron).
 * Không nhét cả kho: tối đa 2–3, lọc ngắn/mơ hồ, ưu tiên mới hơn.
 */

export type IngredientLike = {
  content: string
  created_at?: string
}

const MAX_PICK = 3
const MIN_CHARS = 40

/** Câu quá chung / không có sự việc */
const VAGUE = [
  /^(hôm nay|ngày mai|mệt|buồn|vui|ok|okay|test|xin chào)\b/i,
  /^(không có gì|chưa biết|tạm thời)\b/i,
]

function isVague(text: string): boolean {
  const t = text.trim()
  if (t.length < MIN_CHARS) return true
  // Ít nhất có dấu hiệu sự việc / bài học (thô)
  const hasSubstance =
    /[.?!:…]/.test(t) ||
    /\b(học|thấy|hiểu|sai|đúng|khách|team|lần|khi|vì|nên|thì|phải|không)\b/i.test(t) ||
    t.length >= 80
  if (!hasSubstance && t.length < 60) return true
  return VAGUE.some((re) => re.test(t))
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function tooSimilar(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  if (na.length > 30 && nb.includes(na.slice(0, 30))) return true
  if (nb.length > 30 && na.includes(nb.slice(0, 30))) return true
  return false
}

/**
 * @param items — đã sort mới → cũ càng tốt
 * @returns nội dung góc được chọn (0–3)
 */
export function pickIngredients(
  items: IngredientLike[] | string[] | undefined | null,
  options?: { max?: number },
): string[] {
  const max = options?.max ?? MAX_PICK
  if (!items || items.length === 0) return []

  const rows: IngredientLike[] = items.map((x) =>
    typeof x === 'string' ? { content: x } : x,
  )

  // Mới trước nếu có created_at
  const sorted = [...rows].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const picked: string[] = []
  for (const row of sorted) {
    const content = (row.content || '').trim()
    if (!content) continue
    if (isVague(content)) continue
    if (picked.some((p) => tooSimilar(p, content))) continue
    picked.push(content)
    if (picked.length >= max) break
  }

  return picked
}
