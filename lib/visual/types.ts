export type PeopleMode = 'none' | 'no_face' | 'people_ok'

export type BrandVisual = {
  peopleMode: PeopleMode
  /** 3–5 từ: tối giản, ánh sáng tự nhiên, documentary... */
  styleWords: string
  colorPrimary: string
  colorSecondary: string
  /** Những thứ cấm trên ảnh */
  forbidden: string
  /** Một câu thế giới thương hiệu */
  world: string
}

export const DEFAULT_VISUAL: BrandVisual = {
  peopleMode: 'none',
  styleWords: 'tối giản, ánh sáng tự nhiên, contrast rõ',
  colorPrimary: '#1a1a1a',
  colorSecondary: '#c4a574',
  forbidden: 'chữ trên ảnh, logo lạ, tay bắt tay, stock văn phòng sáo',
  world: '',
}

export function isVisualReady(v: BrandVisual | null | undefined): boolean {
  if (!v) return false
  return Boolean(v.styleWords?.trim() && v.colorPrimary?.trim())
}
