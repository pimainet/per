/** Nhịp hiển thị & khung tuần — thuần local, không gọi AI, không tốn tiền */

export type TuanMauRow = {
  ngay: string
  loai: string
  truCot: string
  goiY: string
}

const WEEK_LABELS: Record<number, string[]> = {
  3: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
  5: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
  7: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
}

export function nhipLabel(postsPerWeek: number): string {
  const n = postsPerWeek >= 7 ? 7 : postsPerWeek >= 5 ? 5 : 3
  if (n >= 7) return '7 bài/tuần · mỗi ngày'
  if (n >= 5) return '5 bài/tuần · Thứ 2–6'
  return '3 bài/tuần · Thứ 2 · 4 · 6'
}

/** Dựng khung tuần theo nhịp; tái sử dụng gợi ý cũ (xoay vòng), không gọi Claude */
export function buildWeekPreview(
  postsPerWeek: number,
  existing?: TuanMauRow[] | null,
): TuanMauRow[] {
  const n = postsPerWeek >= 7 ? 7 : postsPerWeek >= 5 ? 5 : 3
  const days = WEEK_LABELS[n]
  const pool =
    existing && existing.length > 0
      ? existing
      : [
          {
            ngay: '',
            loai: 'Góc nhìn',
            truCot: '',
            goiY: 'Một mũi nhọn — bám định vị đã khóa',
          },
        ]

  return days.map((ngay, i) => {
    const src = pool[i % pool.length]
    return {
      ngay,
      loai: src.loai || 'Góc nhìn',
      truCot: src.truCot || '',
      goiY: src.goiY || `Slot ${i + 1}/${n}`,
    }
  })
}
