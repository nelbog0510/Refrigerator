import {
  Apple,
  Beef,
  CupSoda,
  Droplet,
  Egg,
  Fish,
  Leaf,
  type LucideIcon,
  Milk,
  Package,
  Sprout,
  Wheat,
} from 'lucide-react'
import type { Lot } from '@/features/inventory/types'
import type { IngredientCategory } from '@/types/inventory'

const CATEGORY_ICONS: Record<IngredientCategory, LucideIcon> = {
  채소: Leaf,
  과일: Apple,
  육류: Beef,
  수산물: Fish,
  '달걀·유제품': Milk,
  곡류: Wheat,
  버섯: Sprout,
  '양념·소스': Droplet,
  가공식품: Package,
  음료: CupSoda,
  기타: Package,
}

export function lotIcon(lot: Pick<Lot, 'name' | 'category'>): LucideIcon {
  // 달걀·유제품 중 달걀만 따로 구분한다.
  if (lot.category === '달걀·유제품' && /계란|달걀/.test(lot.name)) return Egg
  return CATEGORY_ICONS[lot.category]
}
