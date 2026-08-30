/** Múi giờ sản phẩm — lịch bài theo ngày Việt Nam, không theo UTC server */
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh'

/** 0=CN … 6=T7 theo lịch VN */
export function getVnDayOfWeek(date = new Date()): number {
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(date)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[wd] ?? date.getDay()
}

/** YYYY-MM-DD theo VN */
export function getVnDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

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
  const day = getVnDayOfWeek(date)
  return scheduleDays(postsPerWeek).includes(day)
}

/** Đầu tuần (Thứ 2 00:00) theo lịch VN, trả Date UTC tương ứng */
export function startOfWeek(date = new Date()): Date {
  const vnDate = getVnDateString(date) // YYYY-MM-DD
  const [y, m, d] = vnDate.split('-').map(Number)
  // Tạo mốc trưa UTC rồi chỉnh về thứ 2 VN — tránh lệch DST (VN không DST)
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 5, 0, 0)) // ~12:00 VN
  const day = getVnDayOfWeek(noonUtc)
  const diff = day === 0 ? -6 : 1 - day
  const mondayVn = new Date(Date.UTC(y, m - 1, d + diff, 0, 0, 0))
  // 00:00 VN = 17:00 UTC ngày hôm trước
  return new Date(Date.UTC(y, m - 1, d + diff - 1, 17, 0, 0))
}

export function parsePostsPerWeek(roadmapData: unknown): number {
  if (!roadmapData || typeof roadmapData !== 'object') return 3
  const r = roadmapData as Record<string, unknown>
  if (typeof r.postsPerWeek === 'number' && r.postsPerWeek > 0) return r.postsPerWeek
  if (typeof r.nhip === 'string') {
    const match = r.nhip.match(/(\d+)/)
    if (match) return Math.min(7, Math.max(1, Number(match[1])))
  }
  return 3
}

export function vnWeekdayLabel(date = new Date()): string {
  const names = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return names[getVnDayOfWeek(date)]
}
