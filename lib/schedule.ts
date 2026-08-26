/** Map postsPerWeek → các thứ trong tuần (0=CN … 6=T7) nên tạo bài */
export function scheduleDays(postsPerWeek: number): number[] {
  const n = Math.min(7, Math.max(1, Math.round(postsPerWeek)))
  if (n >= 7) return [0, 1, 2, 3, 4, 5, 6]
  if (n >= 5) return [1, 2, 3, 4, 5] // T2–T6
  if (n >= 4) return [1, 2, 4, 5]
  if (n >= 3) return [1, 3, 5] // T2 T4 T6
  if (n >= 2) return [1, 4]
  return [1] // chỉ T2
}

export function shouldWriteToday(postsPerWeek: number, date = new Date()): boolean {
  const day = date.getDay() // 0 CN
  return scheduleDays(postsPerWeek).includes(day)
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // về Thứ 2
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function parsePostsPerWeek(roadmapData: unknown): number {
  if (!roadmapData || typeof roadmapData !== 'object') return 3
  const r = roadmapData as Record<string, unknown>
  if (typeof r.postsPerWeek === 'number' && r.postsPerWeek > 0) return r.postsPerWeek
  if (typeof r.nhip === 'string') {
    const m = r.nhip.match(/(\d+)/)
    if (m) return Math.min(7, Math.max(1, Number(m[1])))
  }
  return 3
}
