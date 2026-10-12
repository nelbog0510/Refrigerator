import type { Lot } from '@/features/inventory/types'
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategory,
  type StorageLocation,
} from '@/types/inventory'

export const SORT_OPTIONS = [
  { key: 'expiry', label: '유통기한순' },
  { key: 'recent', label: '최근 등록순' },
  { key: 'name', label: '이름순' },
  { key: 'quantity', label: '수량순' },
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

export const GROUP_OPTIONS = [
  { key: 'location', label: '위치별' },
  { key: 'category', label: '카테고리별' },
  { key: 'none', label: '묶지 않음' },
] as const
export type GroupKey = (typeof GROUP_OPTIONS)[number]['key']

const LOCATION_GROUP_TITLES: Record<StorageLocation, string> = {
  fridge: '냉장실',
  freezer: '냉동실',
  pantry: '실온',
}

export interface LotGroup {
  /** 묶지 않으면 null */
  title: string | null
  lots: Lot[]
}

/** 정렬된 목록을 순서를 유지한 채 묶는다. 빈 묶음은 만들지 않는다. */
export function groupLots(lots: Lot[], key: GroupKey, location: StorageLocation): LotGroup[] {
  if (lots.length === 0) return []
  if (key === 'none') return [{ title: null, lots }]
  if (key === 'location') return [{ title: LOCATION_GROUP_TITLES[location], lots }]
  return INGREDIENT_CATEGORIES.map((category) => ({
    title: category,
    lots: lots.filter((lot) => lot.category === category),
  })).filter((group) => group.lots.length > 0)
}
