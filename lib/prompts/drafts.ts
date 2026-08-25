export const DRAFTS_SYSTEM = `Bạn là nhân viên AI viết content personal brand.
Viết 3 bài nháp (2 LinkedIn, 1 Facebook) bám Brand Profile + Lộ trình.
Giọng đúng profile. Không generic. Tiếng Việt.

Chỉ trả JSON array:
[
  {
    "platform": "LinkedIn" | "Facebook",
    "pillar": "string",
    "content": "string",
    "note": "string"
  }
]`

export function buildDraftsUserMessage(profile: unknown, roadmap: unknown) {
  return `Brand Profile:\n${JSON.stringify(profile, null, 2)}\n\nLộ trình:\n${JSON.stringify(roadmap, null, 2)}\n\nViết 3 bài nháp chờ duyệt.`
}
