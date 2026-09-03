export type PeopleMode = 'none' | 'no_face' | 'people_ok'

/** Preset cố định → nhất quán hơn ô text tự do */
export type StylePresetId = 'desk_minimal' | 'object_metaphor' | 'workspace_doc' | 'custom'

export type BrandVisual = {
  peopleMode: PeopleMode
  stylePreset: StylePresetId
  /** Dùng khi preset = custom, hoặc bổ sung preset */
  styleWords: string
  colorPrimary: string
  colorSecondary: string
  forbidden: string
  world: string
}

export const STYLE_PRESETS: Record<
  Exclude<StylePresetId, 'custom'>,
  { label: string; styleWords: string; worldHint: string }
> = {
  desk_minimal: {
    label: 'Bàn làm việc tối giản',
    styleWords:
      'documentary photo, natural window light, minimal desk, shallow depth of field, muted tones, real materials',
    worldHint: 'Bàn gỗ hoặc tối giản, sổ tay, bút, tách cà phê, ánh sáng cửa sổ',
  },
  object_metaphor: {
    label: 'Đồ vật ẩn dụ',
    styleWords:
      'still life photograph, single subject, soft natural light, clean background, editorial, restrained color',
    worldHint: 'Một đồ vật chính trên nền sạch, ánh sáng dịu, không rối',
  },
  workspace_doc: {
    label: 'Góc làm việc documentary',
    styleWords:
      'candid documentary, available light, lived-in workspace, quiet atmosphere, filmic but realistic, no glamour',
    worldHint: 'Góc phòng làm việc thật, hơi đời, không studio bóng bẩy',
  },
}

export const DEFAULT_VISUAL: BrandVisual = {
  peopleMode: 'none',
  stylePreset: 'desk_minimal',
  styleWords: STYLE_PRESETS.desk_minimal.styleWords,
  colorPrimary: '#1a1a1a',
  colorSecondary: '#c4a574',
  forbidden:
    'text on image, logos, watermarks, stock handshake, neon, cyberpunk, plastic skin, extra fingers, surreal melting objects',
  world: STYLE_PRESETS.desk_minimal.worldHint,
}

export function isVisualReady(v: BrandVisual | null | undefined): boolean {
  if (!v) return false
  return Boolean((v.styleWords?.trim() || v.stylePreset) && v.colorPrimary?.trim())
}

export function resolveStyleWords(v: BrandVisual): string {
  if (v.stylePreset && v.stylePreset !== 'custom' && STYLE_PRESETS[v.stylePreset]) {
    const base = STYLE_PRESETS[v.stylePreset].styleWords
    const extra = v.styleWords?.trim()
    // Nếu user giữ đúng preset words hoặc trống → chỉ base
    if (!extra || extra === base) return base
    return `${base}. Additional notes: ${extra}`
  }
  return (
    v.styleWords?.trim() ||
    'documentary photograph, natural light, minimal, realistic textures'
  )
}
