import type { BrandVisual } from '@/lib/visual/types'
import { resolveStyleWords } from '@/lib/visual/types'

/** Rút ý ảnh từ bài — tránh nhồi cả caption vào prompt (model dễ “vẽ chữ” / rối) */
export function extractVisualConcept(post: string): string {
  const clean = post.replace(/\s+/g, ' ').trim()
  if (!clean) return 'quiet focused work, a single clear metaphor'

  // Lấy 1–2 câu đầu hoặc đoạn ngắn có ý
  const sentences = clean.split(/(?<=[.!?…])\s+/).filter((s) => s.length > 20)
  const core = (sentences[0] || clean).slice(0, 180)
  const second = sentences[1] ? sentences[1].slice(0, 100) : ''

  return [core, second].filter(Boolean).join(' ')
}

/**
 * Prompt ảnh chất lượng cao, chống AI-glaze:
 * - Ảnh editorial / documentary thật
 * - Ít chi tiết ảo, một chủ thể
 * - Bám kit màu + world + people mode
 */
export function buildImagePrompt(visual: BrandVisual, postExcerpt: string): string {
  const people =
    visual.peopleMode === 'none'
      ? [
          'No people.',
          'No faces, no hands, no body parts.',
          'Only objects, materials, architecture, or quiet empty space.',
        ].join(' ')
      : visual.peopleMode === 'no_face'
        ? [
            'At most one human figure as silhouette, back view, or cropped without a readable face.',
            'No portrait, no eye contact, no identifiable person.',
          ].join(' ')
        : [
            'One natural person at most, candid not posed stock.',
            'No celebrity likeness, no handshake cliché, no team high-five.',
          ].join(' ')

  const concept = extractVisualConcept(postExcerpt)
  const style = resolveStyleWords(visual)

  return [
    // Identity
    'A single realistic editorial photograph for a personal-brand social feed.',
    'Shot as if by a careful human photographer — not digital art, not 3D render, not illustration.',

    // Anti AI-glaze (critical)
    'Photorealistic but restrained: natural imperfect light, real material textures (paper, wood, fabric, metal).',
    'Avoid: oversharpening, plastic skin, waxy surfaces, HDR glow, neon rim light, volumetric god-rays, hyper-detail noise, symmetrical CGI look, floating objects, impossible geometry.',
    'Avoid: collage, double exposure, heavy filters, cinematic color grade extremes, sci-fi, fantasy.',

    // Composition
    'One clear subject. Simple background. Generous negative space. Square 1:1 crop for LinkedIn/Facebook.',
    'Shallow or moderate depth of field. Quiet mood. No busy scenes.',

    // Brand kit
    `Photographic style: ${style}.`,
    `Color palette mood (subtle, embedded in light and objects — not graphic overlays): primary ${visual.colorPrimary}, secondary ${visual.colorSecondary}.`,
    visual.world?.trim()
      ? `Stay inside this brand world only: ${visual.world.trim()}.`
      : 'Stay in a coherent minimal real-world setting.',

    people,

    // Hard bans
    `Hard bans: ${visual.forbidden || 'text, logos, watermarks'}.`,
    'Absolutely no text, letters, numbers, captions, UI, or watermarks anywhere in the frame.',

    // Content link (metaphor, not literal illustration of the essay)
    'Translate the idea into a simple visual metaphor or quiet scene — do NOT try to depict the whole argument, and do NOT write any words from the post.',
    `Concept seed: ${concept}`,
  ].join(' ')
}
