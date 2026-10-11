// CLAUDE.md 7장 개념 모델 기준. DB 스키마가 확정되면 그에 맞춰 구체화한다.

export const STORAGE_LOCATIONS = ['fridge', 'freezer', 'pantry'] as const
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number]

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  fridge: '냉장',
  freezer: '냉동',
  pantry: '실온',
}

export const INGREDIENT_CATEGORIES = [
  '채소',
  '과일',
  '육류',
  '수산물',
  '달걀·유제품',
  '곡류',
  '버섯',
  '양념·소스',
  '가공식품',
  '음료',
  '기타',
] as const
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

// 포장에 표시된 기한의 유형. 소비기한과 유통기한은 서로 다른 유형으로 보관한다.
export const EXPIRY_TYPES = ['use_by', 'best_before', 'sell_by', 'unknown'] as const
export type ExpiryType = (typeof EXPIRY_TYPES)[number]

export const EXPIRY_TYPE_LABELS: Record<ExpiryType, string> = {
  use_by: '소비기한',
  best_before: '품질유지기한',
  sell_by: '유통기한',
  unknown: '유형 미확인',
}
