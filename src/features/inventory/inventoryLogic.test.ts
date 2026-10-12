import { describe, expect, it } from 'vitest'
import { expiryBadgeText, getExpiryStatus } from '@/features/inventory/expiry'
import { emptyLotFormValues, parseLotForm } from '@/features/inventory/lotFormValues'
import { filterLots, sortLots } from '@/features/inventory/sortFilter'
import type { Lot } from '@/features/inventory/types'

function lot(overrides: Partial<Lot>): Lot {
  return {
    id: 'id',
    name: '재료',
    category: '기타',
    quantity: 1,
    unit: '개',
    storage_location: 'fridge',
    purchased_on: null,
    registered_at: '2026-10-01T00:00:00+00:00',
    expires_on: null,
    expiry_type: 'unknown',
    price: null,
    memo: null,
    status: 'active',
    updated_at: '2026-10-01T00:00:00+00:00',
    ...overrides,
  }
}

describe('getExpiryStatus', () => {
  const today = new Date(2026, 9, 12) // 2026-10-12

  it.each([
    [null, 'none', '소비기한 미등록'],
    ['2026-10-10', 'expired', '기한 경과 2일'],
    ['2026-10-12', 'today', '오늘까지'],
    ['2026-10-13', 'soon', 'D-1'],
    ['2026-10-15', 'soon', 'D-3'],
    ['2026-10-16', 'near', 'D-4'],
    ['2026-10-19', 'near', 'D-7'],
    ['2026-10-20', 'ok', 'D-8'],
    ['2026-11-01', 'ok', 'D-20'],
  ])('%s → %s (%s)', (expiresOn, level, text) => {
    expect(getExpiryStatus(expiresOn, today)).toMatchObject({ level, text })
  })

  it('기한 유형을 문구에 함께 표시한다', () => {
    expect(expiryBadgeText(getExpiryStatus('2026-10-15', today), 'sell_by')).toBe('유통기한 D-3')
    expect(expiryBadgeText(getExpiryStatus(null, today), 'use_by')).toBe('소비기한 미등록')
  })
})

describe('parseLotForm', () => {
  const valid = { ...emptyLotFormValues('freezer'), name: ' 우유 ', quantity: '1.5', unit: 'L' }

  it('필수값만 있어도 저장할 값으로 변환한다', () => {
    expect(parseLotForm(valid)).toEqual({
      ok: true,
      input: {
        name: '우유',
        quantity: 1.5,
        unit: 'L',
        storage_location: 'freezer',
        category: '기타',
        purchased_on: null,
        expires_on: null,
        expiry_type: 'unknown',
        price: null,
        memo: null,
      },
    })
  })

  it('기한 날짜가 없으면 기한 유형을 저장하지 않는다', () => {
    const parsed = parseLotForm({ ...valid, expiry_type: 'use_by' })
    expect(parsed.ok && parsed.input.expiry_type).toBe('unknown')
  })

  it('기한 날짜와 유형을 함께 보존한다', () => {
    const parsed = parseLotForm({ ...valid, expires_on: '2026-10-20', expiry_type: 'sell_by' })
    expect(parsed.ok && parsed.input).toMatchObject({
      expires_on: '2026-10-20',
      expiry_type: 'sell_by',
    })
  })

  it.each([
    [{ name: '   ' }, 'name', '재료명을 입력해 주세요.'],
    [{ quantity: '' }, 'quantity', '수량을 입력해 주세요.'],
    [{ quantity: '많이' }, 'quantity', '수량은 숫자로 입력해 주세요.'],
    [{ quantity: '0' }, 'quantity', '수량은 0보다 커야 합니다.'],
    [{ quantity: '-2' }, 'quantity', '수량은 0보다 커야 합니다.'],
    [{ unit: '' }, 'unit', '단위를 입력해 주세요.'],
    [{ storage_location: '베란다' }, 'storage_location', '보관 장소를 선택해 주세요.'],
    [{ expires_on: '2026-02-31' }, 'expires_on', '날짜 형식이 올바르지 않습니다.'],
    [{ price: '-100' }, 'price', '가격은 0 이상의 숫자로 입력해 주세요.'],
  ])('잘못된 입력 %o 은 %s 오류를 낸다', (patch, field, message) => {
    const parsed = parseLotForm({ ...valid, ...patch })
    expect(parsed).toEqual({ ok: false, errors: { [field]: message } })
  })
})

describe('filterLots / sortLots', () => {
  const lots = [
    lot({ id: 'a', name: '우유', category: '달걀·유제품', expires_on: '2026-10-20', quantity: 1 }),
    lot({ id: 'b', name: '대파', category: '채소', expires_on: null, quantity: 3 }),
    lot({
      id: 'c',
      name: '두부',
      category: '가공식품',
      expires_on: '2026-10-14',
      quantity: 2,
      registered_at: '2026-10-05T00:00:00+00:00',
    }),
    lot({ id: 'd', name: '냉동 만두', storage_location: 'freezer' }),
  ]
  const ids = (items: Lot[]) => items.map((item) => item.id)

  it('보관 장소·카테고리·검색어로 거른다', () => {
    expect(ids(filterLots(lots, { location: 'fridge', category: 'all', search: '' }))).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(ids(filterLots(lots, { location: 'freezer', category: 'all', search: '' }))).toEqual([
      'd',
    ])
    expect(ids(filterLots(lots, { location: 'fridge', category: '채소', search: '' }))).toEqual([
      'b',
    ])
    expect(ids(filterLots(lots, { location: 'fridge', category: 'all', search: ' 두 ' }))).toEqual([
      'c',
    ])
  })

  it('정렬 기준별로 정렬하고 기한 미등록은 뒤로 보낸다', () => {
    const fridge = lots.slice(0, 3)
    expect(ids(sortLots(fridge, 'expiry'))).toEqual(['c', 'a', 'b'])
    expect(ids(sortLots(fridge, 'name'))).toEqual(['b', 'c', 'a'])
    expect(ids(sortLots(fridge, 'quantity'))).toEqual(['b', 'c', 'a'])
    expect(ids(sortLots(fridge, 'recent'))[0]).toBe('c')
  })
})
