import type { Lot } from '@/features/inventory/types'
import type { IngredientCategory, StorageLocation } from '@/types/inventory'

export const SORT_OPTIONS = [
  { key: 'expiry', label: '기한 임박순' },
  { key: 'recent', label: '최근 등록순' },
  { key: 'name', label: '이름순' },
  { key: 'quantity', label: '수량 많은 순' },
] as const
export type SortKey = (typeof SORT_OPTIONS)[number]['key']

export interface LotFilter {
  location: StorageLocation
  category: IngredientCategory | 'all'
  search: string
}

export function filterLots(lots: Lot[], filter: LotFilter): Lot[] {
  const keyword = filter.search.trim().toLowerCase()
  return lots.filter(
    (lot) =>
      lot.storage_location === filter.location &&
      (filter.category === 'all' || lot.category === filter.category) &&
      (keyword === '' || lot.name.toLowerCase().includes(keyword)),
  )
}

const byName = (a: Lot, b: Lot) => a.name.localeCompare(b.name, 'ko')

const COMPARATORS: Record<SortKey, (a: Lot, b: Lot) => number> = {
  // 기한 미등록은 맨 뒤로 보낸다.
  expiry: (a, b) => {
    if (a.expires_on === b.expires_on) return byName(a, b)
    if (a.expires_on === null) return 1
    if (b.expires_on === null) return -1
    return a.expires_on < b.expires_on ? -1 : 1
  },
  recent: (a, b) => b.registered_at.localeCompare(a.registered_at),
  name: byName,
  quantity: (a, b) => b.quantity - a.quantity || byName(a, b),
}

export function sortLots(lots: Lot[], key: SortKey): Lot[] {
  return [...lots].sort(COMPARATORS[key])
}
