import type { BrandVisual } from '@/lib/visual/types'

/** Dựng prompt ảnh — bám kit + ý bài, cấm lệch nhận diện */
export function buildImagePrompt(visual: BrandVisual, postExcerpt: string): string {
  const people =
    visual.peopleMode === 'none'
      ? 'No people, no faces, no hands. Objects, spaces, symbols only.'
      : visual.peopleMode === 'no_face'
        ? 'People may appear only as silhouette or from behind; no readable face, no portrait likeness.'
        : 'People allowed if natural to the scene; avoid stock-handshake clichés; no celebrity likeness.'

  const excerpt = postExcerpt.replace(/\s+/g, ' ').trim().slice(0, 420)

  return [
    'Editorial photograph for a personal-brand social post. High quality, coherent brand world.',
    `Style keywords: ${visual.styleWords}.`,
    `Color mood guided by primary ${visual.colorPrimary} and secondary ${visual.colorSecondary} (subtle, not flat graphic design).`,
    visual.world?.trim() ? `Brand world: ${visual.world.trim()}.` : '',
    people,
    `Forbidden: ${visual.forbidden || 'text, watermarks, logos, busy collages'}.`,
    'Absolutely no text, letters, numbers, or watermarks in the image.',
    'Square composition 1:1, suitable for LinkedIn/Facebook feed.',
    'Creative but consistent — not random surreal chaos.',
    `Visual metaphor inspired by this post idea (do not illustrate text literally): ${excerpt}`,
  ]
    .filter(Boolean)
    .join(' ')
}
