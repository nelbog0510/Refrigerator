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

export function ExpiryBadge({ lot }: { lot: Pick<Lot, 'expires_on' | 'expiry_type'> }) {
  const status = getExpiryStatus(lot.expires_on)
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
