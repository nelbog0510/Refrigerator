import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { lotIcon } from '@/features/inventory/categoryIcons'
import { ExpiryBadge } from '@/features/inventory/ExpiryBadge'
import type { Lot } from '@/features/inventory/types'
import { STORAGE_LOCATION_LABELS } from '@/types/inventory'

interface LotRowProps {
  lot: Lot
  /** 선택 모드에서는 상세로 이동하는 대신 체크박스로 고른다. */
  selecting: boolean
  selected: boolean
  onToggle: (lotId: string) => void
}

function formatMonthDay(dateString: string) {
  const [, month, day] = dateString.split('-').map(Number)
  return `${month}월 ${day}일`
}

const rowClass = 'flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-3'

export function LotRow({ lot, selecting, selected, onToggle }: LotRowProps) {
  const body = (
    <>
      <span className="bg-brand-50 flex size-10 shrink-0 items-center justify-center rounded-xl">
        {createElement(lotIcon(lot), {
          'aria-hidden': true,
          strokeWidth: 1.75,
          className: 'size-5',
        })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">
          <span className="font-bold">{lot.name}</span>{' '}
          <span className="text-ink-muted">
            {lot.quantity}
            {lot.unit}
          </span>
        </span>
        <span className="text-ink-muted block truncate text-xs">
          {lot.category} · {STORAGE_LOCATION_LABELS[lot.storage_location]} ·{' '}
          {lot.expires_on ? formatMonthDay(lot.expires_on) : '소비기한 미등록'}
        </span>
      </span>
      <ExpiryBadge lot={lot} compact />
    </>
  )

  if (selecting) {
    return (
      <label
        className={`${rowClass} cursor-pointer has-focus-visible:outline-2 ${
          selected ? 'border-danger/40' : 'border-transparent'
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(lot.id)}
          className="accent-ink size-5 shrink-0"
        />
        {body}
      </label>
    )
  }

  return (
    <Link to={`/inventory/${lot.id}`} className={`${rowClass} hover:bg-brand-100 border-transparent`}>
      {body}
    </Link>
  )
}
