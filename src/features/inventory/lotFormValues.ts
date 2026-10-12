import { z } from 'zod'
import type { Lot, LotInput } from '@/features/inventory/types'
import {
  EXPIRY_TYPES,
  INGREDIENT_CATEGORIES,
  STORAGE_LOCATIONS,
  type StorageLocation,
} from '@/types/inventory'

/** 폼 입력값. 모두 문자열로 다루고 저장 직전에 변환한다. */
export interface LotFormValues {
  name: string
  quantity: string
  unit: string
  storage_location: string
  category: string
  purchased_on: string
  expires_on: string
  expiry_type: string
  price: string
  memo: string
}

export type LotFormErrors = Partial<Record<keyof LotFormValues, string>>

export const UNIT_SUGGESTIONS = ['개', 'g', 'kg', 'ml', 'L', '단', '봉', '팩', '병', '모', '줄']

export function emptyLotFormValues(location: StorageLocation = 'fridge'): LotFormValues {
  return {
    name: '',
    quantity: '',
    unit: '개',
    storage_location: location,
    category: '기타',
    purchased_on: '',
    expires_on: '',
    expiry_type: 'unknown',
    price: '',
    memo: '',
  }
}

export function lotToFormValues(lot: Lot): LotFormValues {
  return {
    name: lot.name,
    quantity: String(lot.quantity),
    unit: lot.unit,
    storage_location: lot.storage_location,
    category: lot.category,
    purchased_on: lot.purchased_on ?? '',
    expires_on: lot.expires_on ?? '',
    expiry_type: lot.expiry_type,
    price: lot.price === null ? '' : String(lot.price),
    memo: lot.memo ?? '',
  }
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const optionalDate = z
  .string()
  .refine((v) => v === '' || isRealDate(v), '날짜 형식이 올바르지 않습니다.')

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '재료명을 입력해 주세요.')
    .max(50, '재료명은 50자 이내로 입력해 주세요.'),
  quantity: z
    .string()
    .trim()
    .min(1, '수량을 입력해 주세요.')
    .refine((v) => Number.isFinite(Number(v)), '수량은 숫자로 입력해 주세요.')
    .refine((v) => Number(v) > 0, '수량은 0보다 커야 합니다.'),
  unit: z
    .string()
    .trim()
    .min(1, '단위를 입력해 주세요.')
    .max(10, '단위는 10자 이내로 입력해 주세요.'),
  storage_location: z.enum(STORAGE_LOCATIONS, '보관 장소를 선택해 주세요.'),
  category: z.enum(INGREDIENT_CATEGORIES, '카테고리를 선택해 주세요.'),
  purchased_on: optionalDate,
  expires_on: optionalDate,
  expiry_type: z.enum(EXPIRY_TYPES),
  price: z
    .string()
    .trim()
    .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), {
      message: '가격은 0 이상의 숫자로 입력해 주세요.',
    }),
  memo: z.string().trim().max(500, '메모는 500자 이내로 입력해 주세요.'),
})

export type ParsedLotForm =
  | { ok: true; input: LotInput }
  | { ok: false; errors: LotFormErrors }

export function parseLotForm(values: LotFormValues): ParsedLotForm {
  const result = formSchema.safeParse(values)
  if (!result.success) {
    const errors: LotFormErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof LotFormValues
      errors[field] ??= issue.message
    }
    return { ok: false, errors }
  }

  const data = result.data
  const expiresOn = data.expires_on || null
  return {
    ok: true,
    input: {
      name: data.name,
      quantity: Number(data.quantity),
      unit: data.unit,
      storage_location: data.storage_location,
      category: data.category,
      purchased_on: data.purchased_on || null,
      expires_on: expiresOn,
      // 날짜가 없으면 유형도 의미가 없다.
      expiry_type: expiresOn ? data.expiry_type : 'unknown',
      price: data.price === '' ? null : Number(data.price),
      memo: data.memo || null,
    },
  }
}
