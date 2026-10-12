import { Link } from 'react-router-dom'
import { ExpiryBadge } from '@/features/inventory/ExpiryBadge'
import type { Lot } from '@/features/inventory/types'

export function LotCard({ lot }: { lot: Lot }) {
  return (
    <Link
      to={`/inventory/${lot.id}`}
      className="rounded-card border-line hover:bg-brand-100 flex h-full flex-col gap-2 border bg-white p-4"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-semibold break-all">{lot.name}</span>
        <span className="shrink-0 text-sm">
          {lot.quantity}
          {lot.unit}
        </span>
      </span>
      <span className="text-ink-muted text-xs">{lot.category}</span>
      <span>
        <ExpiryBadge lot={lot} />
      </span>
      {lot.expires_on && <span className="text-ink-muted text-xs">{lot.expires_on}</span>}
    </Link>
  )
}
