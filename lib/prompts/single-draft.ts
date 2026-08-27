export const SINGLE_DRAFT_SYSTEM = `Bạn là nhân viên AI viết content personal brand.
Viết ĐÚNG 1 bài nháp.

THỨ TỰ ƯU TIÊN BẮT BUỘC (không đảo):
1) Brand Profile — định vị, giọng, điểm khác biệt
2) Lộ trình / gợi ý hôm nay — chủ đề đúng nhịp
3) Góc thật — chỉ gia vị (optional)
4) Thiếu hoặc góc không hợp → vẫn viết tốt từ (1)+(2)

QUY TẮC GÓC THẬT:
- Chỉ dùng khi cùng chủ đề với trụ cột / gợi ý hôm nay.
- Rút ý hoặc 1 chi tiết thật; viết lại theo giọng profile — không copy nguyên văn nếu câu chữ kém.
- Góc mơ hồ hoặc lệch → bỏ qua.
- Không đổi chủ đề vì góc thật. Không bịa thêm sự kiện.

Giọng đúng profile. Không generic. Tiếng Việt.

Chỉ trả JSON object (không markdown):
{
  "platform": "LinkedIn" | "Facebook",
  "pillar": "string",
  "content": "string",
  "note": "string ngắn — có/không dùng góc thật và vì sao"
}`

export function buildSingleDraftUserMessage(
  profile: unknown,
  roadmap: unknown,
  hint?: string,
  ingredients?: string[],
) {
  const stories =
    ingredients && ingredients.length > 0
      ? `\n\nGóc thật (gia vị, không phải nguồn chính):\n${ingredients
          .slice(0, 6)
          .map((s, i) => `${i + 1}. ${s}`)
          .join(
            '\n',
          )}\n\nChỉ lấy ý hợp gợi ý hôm nay; viết lại theo profile; lệch/mơ hồ thì bỏ.`
      : '\n\nGóc thật: (chưa có).'

  return `Brand Profile:
${JSON.stringify(profile, null, 2)}

Lộ trình:
${JSON.stringify(roadmap, null, 2)}${stories}

Gợi ý hôm nay: ${hint || 'Bám trụ cột ưu tiên, đúng nhịp lộ trình.'}

Viết 1 bài chờ duyệt. Xương sống là profile + lộ trình.`
}
