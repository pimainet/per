export type CompanionContext = {
  firstName?: string
  hasProfile: boolean
  profileLocked: boolean
  hasRoadmap: boolean
  draftCount: number
}

function hourGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Khuya rồi'
  if (h < 11) return 'Chào buổi sáng'
  if (h < 13) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function companionGreeting(ctx: CompanionContext) {
  const name = ctx.firstName?.trim()
  const base = hourGreeting()
  if (name) return `${base}, ${name}.`
  return `${base}.`
}

export function companionMessage(ctx: CompanionContext): string {
  if (!ctx.hasProfile) {
    return 'Mình ở đây để đi cùng bạn. Chỉ cần 8 câu trả lời thật — phần còn lại mình lo.'
  }
  if (!ctx.profileLocked) {
    return 'Hồ sơ đã có phác thảo. Xem lại một lượt, khóa khi thấy đúng — mình sẽ bám theo đó.'
  }
  if (!ctx.hasRoadmap) {
    return 'Định vị đã rõ. Bước tiếp theo: lộ trình giai đoạn — để mỗi bài không bị rời rạc.'
  }
  if (ctx.draftCount > 0) {
    return `Có ${ctx.draftCount} bài chờ duyệt. Duyệt khi sẵn sàng — không cần viết từ đầu.`
  }
  return 'Mình vẫn ở đây. Thương hiệu xây bằng nhịp đều, không bằng ngày bùng nổ.'
}

export function companionMotivation(): string {
  const lines = [
    'Một bài đúng giọng còn hơn năm bài cho có.',
    'Bạn không cần hoàn hảo. Chỉ cần xuất hiện đều và thật.',
    'Hôm nay chỉ cần một bước nhỏ — mình giữ nhịp cho bạn.',
    'Người nhớ bạn vì góc nhìn, không vì số lượng bài.',
    'Nghỉ cũng được. Khi quay lại, mình vẫn nắm đúng hồ sơ của bạn.',
  ]
  const day = Math.floor(Date.now() / 86400000)
  return lines[day % lines.length]
}
