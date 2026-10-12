import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '@/app/routes'
import type { Lot, LotEvent, LotInput } from '@/features/inventory/types'

// 실제 Supabase 대신 메모리 저장소로 동작하는 가짜 API. 화면 흐름만 검증한다.
const db = vi.hoisted(() => ({
  lots: [] as Lot[],
  events: [] as (LotEvent & { lot_id: string })[],
  seq: 0,
  failNextWith: null as Error | null,
}))

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        callback('INITIAL_SESSION', { user: { email: 'user@example.com' } })
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
  },
}))

vi.mock('@/features/inventory/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/inventory/api')>()

  const stamp = () => `2026-10-12T00:00:${String(++db.seq).padStart(2, '0')}+00:00`
  const log = (lotId: string, eventType: LotEvent['event_type']) =>
    db.events.unshift({
      id: `event-${++db.seq}`,
      lot_id: lotId,
      event_type: eventType,
      actor: 'user',
      created_at: stamp(),
    })
  const failIfRequested = () => {
    if (!db.failNextWith) return
    const error = db.failNextWith
    db.failNextWith = null
    throw error
  }
  const change = (
    ref: { id: string; updated_at: string },
    patch: Partial<Lot>,
    eventType: LotEvent['event_type'],
  ) => {
    failIfRequested()
    const index = db.lots.findIndex((lot) => lot.id === ref.id)
    if (index < 0 || db.lots[index].updated_at !== ref.updated_at) {
      throw new original.InventoryError('conflict')
    }
    db.lots[index] = { ...db.lots[index], ...patch, updated_at: stamp() }
    log(ref.id, eventType)
    return db.lots[index]
  }

  return {
    ...original,
    listLots: async () => db.lots.filter((lot) => lot.status === 'active'),
    createLot: async (input: LotInput) => {
      failIfRequested()
      const now = stamp()
      const lot: Lot = {
        ...input,
        id: `lot-${++db.seq}`,
        registered_at: now,
        status: 'active',
        updated_at: now,
      }
      db.lots.push(lot)
      log(lot.id, 'add')
      return lot
    },
    updateLot: async (ref: { id: string; updated_at: string }, input: LotInput) =>
      change(ref, input, 'update'),
    deleteLot: async (ref: { id: string; updated_at: string }) =>
      change(ref, { status: 'deleted' }, 'delete'),
    restoreLot: async (id: string) => {
      const lot = db.lots.find((item) => item.id === id)!
      return change(lot, { status: 'active' }, 'restore')
    },
    listLotEvents: async (lotId: string) => db.events.filter((event) => event.lot_id === lotId),
  }
})

function seedLot(overrides: Partial<Lot>): Lot {
  const lot: Lot = {
    id: `lot-${++db.seq}`,
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
  db.lots.push(lot)
  return lot
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

const heading = (name: string) => screen.findByRole('heading', { level: 1, name })
const tab = (name: RegExp) => screen.getByRole('tab', { name })

beforeEach(() => {
  db.lots = []
  db.events = []
  db.seq = 0
  db.failNextWith = null
})

describe('재료 관리 화면', () => {
  it('재고가 없으면 추가 안내를 보여준다', async () => {
    renderAt('/inventory')
    expect(await screen.findByText('아직 등록된 재료가 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '첫 재료 추가하기' })).toHaveAttribute(
      'href',
      '/add?loc=fridge',
    )
  })

  it('보관 장소 탭별로 재료와 건수를 보여준다', async () => {
    seedLot({ name: '우유', quantity: 1, unit: 'L', expires_on: '2000-01-01', expiry_type: 'sell_by' })
    seedLot({ name: '대파', quantity: 3, unit: '단' })
    seedLot({ name: '만두', storage_location: 'freezer' })
    renderAt('/inventory')

    const milk = await screen.findByRole('link', { name: /우유/ })
    expect(milk).toHaveTextContent('1L')
    expect(milk).toHaveTextContent(/기한 경과 \d+일/)
    expect(screen.getByRole('link', { name: /대파/ })).toHaveTextContent('소비기한 미등록')
    expect(screen.queryByRole('link', { name: /만두/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '냉장실' })).toBeInTheDocument()

    await userEvent.click(tab(/냉동/))
    expect(await screen.findByRole('link', { name: /만두/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /우유/ })).not.toBeInTheDocument()

    await userEvent.click(tab(/실온/))
    expect(await screen.findByText('실온에 등록된 재료가 없습니다.')).toBeInTheDocument()
  })

  it('검색과 카테고리로 목록을 좁힌다', async () => {
    seedLot({ name: '우유', category: '달걀·유제품' })
    seedLot({ name: '대파', category: '채소' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })

    await userEvent.type(screen.getByLabelText('재료 검색'), '대')
    expect(screen.queryByRole('link', { name: /우유/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /대파/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '카테고리' }))
    await userEvent.click(screen.getByRole('button', { name: '과일' }))
    expect(await screen.findByText('조건에 맞는 재료가 없습니다.')).toBeInTheDocument()
  })

  it('불러오기에 실패하면 오류와 다시 시도 버튼을 보여준다', async () => {
    const api = await import('@/features/inventory/api')
    const spy = vi
      .spyOn(api, 'listLots')
      .mockRejectedValueOnce(new api.InventoryError('missing_table'))
    renderAt('/inventory')

    expect(await screen.findByRole('alert')).toHaveTextContent('DB에 재료 테이블이 없습니다.')
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('아직 등록된 재료가 없습니다.')).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('재료 관리 화면의 보기 옵션', () => {
  it('카테고리별로 묶고 카드 보기로 전환한다', async () => {
    seedLot({ name: '우유', category: '달걀·유제품' })
    seedLot({ name: '대파', category: '채소' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })

    await userEvent.selectOptions(screen.getByLabelText('묶어보기'), '카테고리별')
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '채소',
      '달걀·유제품',
    ])

    await userEvent.selectOptions(screen.getByLabelText('묶어보기'), '묶지 않음')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '카드 보기로 전환' }))
    expect(screen.getByRole('link', { name: /우유/ })).toHaveTextContent('소비기한 미등록')
    expect(screen.getByRole('button', { name: '목록 보기로 전환' })).toBeInTheDocument()
  })

  it('정렬 기준을 바꾸면 순서가 바뀐다', async () => {
    seedLot({ name: '우유', quantity: 1, expires_on: '2026-10-20' })
    seedLot({ name: '대파', quantity: 3, expires_on: '2026-10-25' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })
    const names = () => screen.getAllByRole('link', { name: /우유|대파/ }).map((a) => a.textContent)

    expect(names()[0]).toContain('우유')
    await userEvent.selectOptions(screen.getByLabelText('정렬'), '수량순')
    expect(names()[0]).toContain('대파')
  })
})

describe('여러 재료 선택', () => {
  it('선택한 재료만 확인 후 삭제하고, 되돌리기로 모두 복구한다', async () => {
    seedLot({ name: '우유' })
    seedLot({ name: '두부' })
    seedLot({ name: '대파' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })

    await userEvent.click(screen.getByRole('button', { name: '선택' }))
    expect(screen.queryByRole('link', { name: /우유/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: /우유/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /두부/ }))
    const bar = screen.getByRole('region', { name: '선택한 재료 작업' })
    expect(within(bar).getByRole('status')).toHaveTextContent('2개 선택')

    await userEvent.click(within(bar).getByRole('button', { name: '삭제' }))
    expect(within(bar).getByRole('alert')).toHaveTextContent('2개를 삭제할까요?')
    expect(db.lots.every((lot) => lot.status === 'active')).toBe(true)
    await userEvent.click(within(bar).getByRole('button', { name: '삭제하기' }))

    expect(await screen.findByText('재료 2개를 삭제했습니다.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /대파/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /우유/ })).not.toBeInTheDocument()
    expect(db.lots.map((lot) => lot.status)).toEqual(['deleted', 'deleted', 'active'])

    await userEvent.click(screen.getByRole('button', { name: '되돌리기' }))
    expect(await screen.findByText('재료 2개를 복구했습니다.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /우유/ })).toBeInTheDocument()
    expect(db.lots.every((lot) => lot.status === 'active')).toBe(true)
  })

  it('삭제 확인에서 취소하거나 완료를 누르면 아무것도 바뀌지 않는다', async () => {
    seedLot({ name: '우유' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })

    await userEvent.click(screen.getByRole('button', { name: '선택' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /우유/ }))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))
    await userEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.getByRole('status')).toHaveTextContent('1개 선택')

    await userEvent.click(screen.getByRole('button', { name: '완료' }))
    expect(screen.queryByRole('region', { name: '선택한 재료 작업' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /우유/ })).toBeInTheDocument()
    expect(db.lots[0].status).toBe('active')
  })

  it('아직 없는 이동·레시피 기능은 눌리지 않는다', async () => {
    seedLot({ name: '우유' })
    renderAt('/inventory')
    await screen.findByRole('link', { name: /우유/ })
    await userEvent.click(screen.getByRole('button', { name: '선택' }))

    expect(screen.getByRole('button', { name: '보관 장소 이동 (준비 중)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '레시피 (준비 중)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled()
  })
})

describe('재료 추가', () => {
  it('필수값이 비어 있으면 저장하지 않고 오류를 보여준다', async () => {
    renderAt('/add')
    await heading('재료 추가')
    await userEvent.click(screen.getByRole('button', { name: '재고에 저장' }))

    expect(await screen.findByText('재료명을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('수량을 입력해 주세요.')).toBeInTheDocument()
    expect(db.lots).toHaveLength(0)
  })

  it('저장하면 선택한 보관 장소 탭에 같은 값으로 나타난다', async () => {
    renderAt('/add')
    await heading('재료 추가')
    await userEvent.type(screen.getByLabelText(/재료명/), '대파')
    await userEvent.type(screen.getByLabelText(/수량/), '3')
    await userEvent.clear(screen.getByLabelText(/단위/))
    await userEvent.type(screen.getByLabelText(/단위/), '단')
    await userEvent.click(screen.getByRole('radio', { name: '냉동' }))
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '채소')
    await userEvent.click(screen.getByRole('button', { name: '재고에 저장' }))

    await heading('재료 관리')
    expect(screen.getByRole('status')).toHaveTextContent('‘대파’을(를) 등록했습니다.')
    expect(tab(/냉동/)).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('link', { name: /대파/ })).toHaveTextContent('3단')
    expect(db.lots).toMatchObject([
      { name: '대파', quantity: 3, unit: '단', storage_location: 'freezer', category: '채소' },
    ])
  })

  it('같은 이름의 재료가 있어도 별도 항목으로 등록한다', async () => {
    seedLot({ name: '우유', expires_on: '2026-10-20' })
    renderAt('/add')
    await heading('재료 추가')
    await userEvent.type(screen.getByLabelText(/재료명/), '우유')
    expect(await screen.findByText(/같은 이름의 재료가 이미 1건 있습니다/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/수량/), '2')
    await userEvent.click(screen.getByRole('button', { name: '재고에 저장' }))

    await heading('재료 관리')
    expect(await screen.findAllByRole('link', { name: /우유/ })).toHaveLength(2)
  })

  it('저장에 실패하면 입력을 유지한 채 오류를 보여준다', async () => {
    const api = await import('@/features/inventory/api')
    db.failNextWith = new api.InventoryError('request_failed')
    renderAt('/add')
    await heading('재료 추가')
    await userEvent.type(screen.getByLabelText(/재료명/), '두부')
    await userEvent.type(screen.getByLabelText(/수량/), '1')
    await userEvent.click(screen.getByRole('button', { name: '재고에 저장' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('요청을 처리하지 못했습니다.')
    expect(screen.getByLabelText(/재료명/)).toHaveValue('두부')
    expect(db.lots).toHaveLength(0)
  })
})

describe('재료 상세', () => {
  it('수정하면 상세와 이력에 반영된다', async () => {
    const lot = seedLot({ name: '양파', quantity: 3 })
    renderAt(`/inventory/${lot.id}`)
    await heading('양파')
    expect(screen.getByText('3개')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '수정' }))
    const quantity = screen.getByLabelText(/수량/)
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '2')
    await userEvent.click(screen.getByRole('button', { name: '수정 내용 저장' }))

    expect(await screen.findByText('2개')).toBeInTheDocument()
    expect(db.lots[0]).toMatchObject({ quantity: 2, storage_location: 'fridge' })
    const history = screen.getByRole('heading', { name: '변경 이력' }).parentElement!
    expect(await within(history).findByText('수정')).toBeInTheDocument()
  })

  it('그사이 다른 곳에서 바뀌었으면 덮어쓰지 않고 충돌을 알린다', async () => {
    const lot = seedLot({ name: '양파', quantity: 3 })
    renderAt(`/inventory/${lot.id}`)
    await heading('양파')
    await userEvent.click(screen.getByRole('button', { name: '수정' }))
    const quantity = screen.getByLabelText(/수량/)
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '2')

    // 다른 기기에서 먼저 변경된 상황
    db.lots[0] = { ...db.lots[0], quantity: 5, updated_at: '2026-10-12T09:00:00+00:00' }
    await userEvent.click(screen.getByRole('button', { name: '수정 내용 저장' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('먼저 변경되었습니다')
    expect(db.lots[0].quantity).toBe(5)
  })

  it('삭제를 취소하면 아무것도 바뀌지 않는다', async () => {
    const lot = seedLot({ name: '양파' })
    renderAt(`/inventory/${lot.id}`)
    await heading('양파')
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(db.lots[0].status).toBe('active')
  })

  it('확인 후 삭제하고, 되돌리기로 복구한다', async () => {
    const lot = seedLot({ name: '양파' })
    renderAt(`/inventory/${lot.id}`)
    await heading('양파')
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }))

    await heading('재료 관리')
    expect(screen.getByRole('status')).toHaveTextContent('‘양파’을(를) 삭제했습니다.')
    await waitFor(() => expect(screen.queryByRole('link', { name: /양파/ })).not.toBeInTheDocument())
    expect(db.lots[0].status).toBe('deleted')

    await userEvent.click(screen.getByRole('button', { name: '되돌리기' }))
    expect(await screen.findByRole('link', { name: /양파/ })).toBeInTheDocument()
    expect(await screen.findByText('‘양파’을(를) 복구했습니다.')).toBeInTheDocument()
    expect(db.lots[0].status).toBe('active')
  })

  it('없는 재료는 안내를 보여준다', async () => {
    renderAt('/inventory/unknown')
    expect(await heading('재료를 찾을 수 없습니다')).toBeInTheDocument()
  })
})
