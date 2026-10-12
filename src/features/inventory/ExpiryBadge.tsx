import { CircleAlert, CircleHelp, Clock, type LucideIcon } from 'lucide-react'
import { type ExpiryLevel, expiryBadgeText, getExpiryStatus } from '@/features/inventory/expiry'
import type { Lot } from '@/features/inventory/types'

// 색상만으로 구분하지 않도록 항상 문구와 아이콘을 함께 보여준다.
const LEVEL_STYLES: Record<ExpiryLevel, { className: string; icon: LucideIcon }> = {
  expired: { className: 'text-danger border-danger', icon: CircleAlert },
  today: { className: 'text-danger border-danger', icon: CircleAlert },
  soon: { className: 'text-warning border-warning', icon: Clock },
  near: { className: 'text-info border-info', icon: Clock },
  ok: { className: 'text-ink-muted border-line', icon: Clock },
  none: { className: 'text-ink-muted border-line border-dashed', icon: CircleHelp },
}

// 목록 행용 간단 배지: 임박(3일 이내·경과)은 붉은색, 그 외는 푸른색
const COMPACT_STYLES: Record<Exclude<ExpiryLevel, 'none'>, string> = {
  expired: 'bg-danger/10 text-danger',
  today: 'bg-danger/10 text-danger',
  soon: 'bg-danger/10 text-danger',
  near: 'bg-info/10 text-info',
  ok: 'bg-info/10 text-info',
}

interface ExpiryBadgeProps {
  lot: Pick<Lot, 'expires_on' | 'expiry_type'>
  /** 기한 유형·아이콘 없이 남은 일수만 표시. 기한 미등록이면 아무것도 그리지 않는다. */
  compact?: boolean
}

export function ExpiryBadge({ lot, compact = false }: ExpiryBadgeProps) {
  const status = getExpiryStatus(lot.expires_on)
  if (compact) {
    if (status.level === 'none') return null
    return (
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${COMPACT_STYLES[status.level]}`}
      >
        {status.text}
      </span>
    )
  }
  const { className, icon: Icon } = LEVEL_STYLES[status.level]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {expiryBadgeText(status, lot.expiry_type)}
    </span>
  )
}
