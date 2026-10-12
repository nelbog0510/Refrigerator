import type { PostgrestError } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  type Lot,
  type LotEvent,
  type LotInput,
  lotEventSchema,
  lotSchema,
} from '@/features/inventory/types'
import { supabase } from '@/lib/supabase'

const LOT_COLUMNS =
  'id,name,category,quantity,unit,storage_location,purchased_on,registered_at,expires_on,expiry_type,price,memo,status,updated_at'

type InventoryErrorKind = 'not_configured' | 'missing_table' | 'conflict' | 'request_failed'

const ERROR_MESSAGES: Record<InventoryErrorKind, string> = {
  not_configured: 'Supabase가 연결되지 않았습니다. 환경 변수를 확인해 주세요.',
  missing_table:
    'DB에 재료 테이블이 없습니다. supabase/migrations 의 SQL을 Supabase SQL Editor에서 실행해 주세요.',
  conflict:
    '다른 곳에서 이 재료가 먼저 변경되었습니다. 최신 내용을 불러왔으니 확인 후 다시 시도해 주세요.',
  request_failed: '요청을 처리하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.',
}

export class InventoryError extends Error {
  readonly kind: InventoryErrorKind

  constructor(kind: InventoryErrorKind) {
    super(ERROR_MESSAGES[kind])
    this.name = 'InventoryError'
    this.kind = kind
  }
}

function client() {
  if (!supabase) throw new InventoryError('not_configured')
  return supabase
}

function toInventoryError(error: PostgrestError) {
  // PGRST205 / 42P01: 테이블이 아직 만들어지지 않음
  const missing = error.code === 'PGRST205' || error.code === '42P01'
  return new InventoryError(missing ? 'missing_table' : 'request_failed')
}

/** 수정·삭제 대상. updated_at 으로 그사이 다른 변경이 있었는지 확인한다. */
export type LotRef = Pick<Lot, 'id' | 'updated_at'>

export async function listLots(): Promise<Lot[]> {
  const { data, error } = await client()
    .from('ingredient_lots')
    .select(LOT_COLUMNS)
    .eq('status', 'active')
  if (error) throw toInventoryError(error)
  return z.array(lotSchema).parse(data)
}

export async function createLot(input: LotInput): Promise<Lot> {
  const { data, error } = await client()
    .from('ingredient_lots')
    .insert(input)
    .select(LOT_COLUMNS)
    .single()
  if (error) throw toInventoryError(error)
  return lotSchema.parse(data)
}

async function updateActiveLot(ref: LotRef, patch: Partial<LotInput> | { status: 'deleted' }) {
  const { data, error } = await client()
    .from('ingredient_lots')
    .update(patch)
    .eq('id', ref.id)
    .eq('status', 'active')
    .eq('updated_at', ref.updated_at)
    .select(LOT_COLUMNS)
    .maybeSingle()
  if (error) throw toInventoryError(error)
  if (!data) throw new InventoryError('conflict')
  return lotSchema.parse(data)
}

export function updateLot(ref: LotRef, input: LotInput): Promise<Lot> {
  return updateActiveLot(ref, input)
}

// 되돌릴 수 있도록 행을 지우지 않고 상태만 바꾼다.
export function deleteLot(ref: LotRef): Promise<Lot> {
  return updateActiveLot(ref, { status: 'deleted' })
}

export async function restoreLot(id: string): Promise<Lot> {
  const { data, error } = await client()
    .from('ingredient_lots')
    .update({ status: 'active' })
    .eq('id', id)
    .eq('status', 'deleted')
    .select(LOT_COLUMNS)
    .maybeSingle()
  if (error) throw toInventoryError(error)
  if (!data) throw new InventoryError('conflict')
  return lotSchema.parse(data)
}

export async function listLotEvents(lotId: string): Promise<LotEvent[]> {
  const { data, error } = await client()
    .from('inventory_events')
    .select('id,event_type,actor,created_at')
    .eq('lot_id', lotId)
    .order('created_at', { ascending: false })
  if (error) throw toInventoryError(error)
  return z.array(lotEventSchema).parse(data)
}
