import type { ExpiryType } from '@/types/inventory'

export type ExpiryLevel = 'none' | 'expired' | 'today' | 'soon' | 'near' | 'ok'

// 임박 기준(일). 추후 설정에서 바꿀 수 있게 한곳에 둔다.
export const EXPIRY_THRESHOLDS = { soon: 3, near: 7 }

export interface ExpiryStatus {
  level: ExpiryLevel
  /** 오늘 기준 남은 일수. 음수면 경과. 기한 미등록이면 null */
  daysLeft: number | null
  text: string
}

const DAY_MS = 24 * 60 * 60 * 1000

function toUtcDay(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day) / DAY_MS
}

/** 'YYYY-MM-DD' 날짜까지 남은 일수 (사용자 기기의 오늘 날짜 기준) */
export function daysUntil(dateString: string, today: Date = new Date()): number {
  const [year, month, day] = dateString.split('-').map(Number)
  return (
    toUtcDay(year, month, day) -
    toUtcDay(today.getFullYear(), today.getMonth() + 1, today.getDate())
  )
}

// 등록된 날짜만으로 계산한 표시용 상태다. 식품의 안전 여부를 판정하지 않는다.
export function getExpiryStatus(expiresOn: string | null, today: Date = new Date()): ExpiryStatus {
  if (!expiresOn) return { level: 'none', daysLeft: null, text: '소비기한 미등록' }

  const daysLeft = daysUntil(expiresOn, today)
  if (daysLeft < 0) return { level: 'expired', daysLeft, text: `기한 경과 ${-daysLeft}일` }
  if (daysLeft === 0) return { level: 'today', daysLeft, text: '오늘까지' }

  const level =
    daysLeft <= EXPIRY_THRESHOLDS.soon ? 'soon' : daysLeft <= EXPIRY_THRESHOLDS.near ? 'near' : 'ok'
  return { level, daysLeft, text: `D-${daysLeft}` }
}

const SHORT_TYPE_LABELS: Record<ExpiryType, string> = {
  use_by: '소비기한',
  best_before: '품질유지기한',
  sell_by: '유통기한',
  unknown: '표시 기한',
}

/** 예: "유통기한 D-3", "소비기한 미등록" */
export function expiryBadgeText(status: ExpiryStatus, expiryType: ExpiryType): string {
  if (status.level === 'none') return status.text
  return `${SHORT_TYPE_LABELS[expiryType]} ${status.text}`
}
