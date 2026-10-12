import { z } from 'zod'
import { EXPIRY_TYPES, INGREDIENT_CATEGORIES, STORAGE_LOCATIONS } from '@/types/inventory'

export const LOT_STATUSES = ['active', 'consumed', 'discarded', 'deleted'] as const

// ingredient_lots 행. DB 컬럼명을 그대로 쓴다.
export const lotSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(INGREDIENT_CATEGORIES),
  quantity: z.number(),
  unit: z.string(),
  storage_location: z.enum(STORAGE_LOCATIONS),
  purchased_on: z.string().nullable(),
  registered_at: z.string(),
  expires_on: z.string().nullable(),
  expiry_type: z.enum(EXPIRY_TYPES),
  price: z.number().nullable(),
  memo: z.string().nullable(),
  status: z.enum(LOT_STATUSES),
  updated_at: z.string(),
})
export type Lot = z.infer<typeof lotSchema>

/** 사용자가 입력·수정하는 값 */
export type LotInput = Pick<
  Lot,
  | 'name'
  | 'category'
  | 'quantity'
  | 'unit'
  | 'storage_location'
  | 'purchased_on'
  | 'expires_on'
  | 'expiry_type'
  | 'price'
  | 'memo'
>

export const EVENT_TYPES = ['add', 'update', 'move', 'consume', 'delete', 'restore'] as const

export const lotEventSchema = z.object({
  id: z.string(),
  event_type: z.enum(EVENT_TYPES),
  actor: z.enum(['user', 'ai']),
  created_at: z.string(),
})
export type LotEvent = z.infer<typeof lotEventSchema>

export const EVENT_TYPE_LABELS: Record<LotEvent['event_type'], string> = {
  add: '등록',
  update: '수정',
  move: '보관 장소 이동',
  consume: '사용',
  delete: '삭제',
  restore: '복구',
}
