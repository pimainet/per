/** Quyền dùng sản phẩm — early: trial hẹp / paid theo gói / blocked */

export type AccessLevel = 'trial' | 'paid' | 'blocked'
export type PlanId = 'free' | 'starter' | 'standard' | 'daily'

export type UserAccess = {
  accessLevel: AccessLevel
  plan: PlanId
  paidUntil: string | null
  batchUsed: boolean
  /** posts/week theo gói */
  postsPerWeekCap: number
}

export const PLAN_POSTS: Record<PlanId, number> = {
  free: 3,
  starter: 3,
  standard: 5,
  daily: 7,
}

export const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Miễn phí',
  starter: 'Mở đầu · 3 bài/tuần',
  standard: 'Đều · 5 bài/tuần',
  daily: 'Mỗi ngày · 7 bài/tuần',
}

export function defaultAccess(): UserAccess {
  return {
    accessLevel: 'trial',
    plan: 'free',
    paidUntil: null,
    batchUsed: false,
    postsPerWeekCap: 3,
  }
}

export function normalizeAccess(row: {
  access_level?: string | null
  plan?: string | null
  paid_until?: string | null
  batch_used?: boolean | null
} | null): UserAccess {
  if (!row) return defaultAccess()
  const plan = (['free', 'starter', 'standard', 'daily'].includes(row.plan || '')
    ? row.plan
    : 'free') as PlanId
  let accessLevel = (['trial', 'paid', 'blocked'].includes(row.access_level || '')
    ? row.access_level
    : 'trial') as AccessLevel

  // Hết hạn → về trial
  if (accessLevel === 'paid' && row.paid_until) {
    if (new Date(row.paid_until).getTime() < Date.now()) {
      accessLevel = 'trial'
    }
  }

  return {
    accessLevel,
    plan: accessLevel === 'paid' ? plan : 'free',
    paidUntil: row.paid_until || null,
    batchUsed: Boolean(row.batch_used),
    postsPerWeekCap: accessLevel === 'paid' ? PLAN_POSTS[plan] || 3 : 3,
  }
}

/** Được gọi Claude soạn batch / tạo lại profile / roadmap AI không? */
export function canCallAI(access: UserAccess): { ok: boolean; reason?: string } {
  if (access.accessLevel === 'blocked') {
    return { ok: false, reason: 'Tài khoản chưa được kích hoạt. Liên hệ để mở quyền.' }
  }
  if (access.accessLevel === 'paid') return { ok: true }
  // trial
  return { ok: true } // trial vẫn được AI nhưng batch/cron siết riêng
}

/** Batch đầu (xác nhận lộ trình tạo nhiều bài) */
export function canRunBatch(access: UserAccess): { ok: boolean; reason?: string } {
  if (access.accessLevel === 'blocked') {
    return { ok: false, reason: 'Tài khoản chưa được kích hoạt.' }
  }
  if (access.accessLevel === 'paid') return { ok: true }
  if (access.batchUsed) {
    return {
      ok: false,
      reason: 'Bản dùng thử chỉ soạn batch đầu một lần. Nâng gói để giữ nhịp hàng tuần.',
    }
  }
  return { ok: true }
}

/** Cron lịch tự động */
export function canRunCron(access: UserAccess): boolean {
  return access.accessLevel === 'paid'
}
