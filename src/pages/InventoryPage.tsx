import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { buttonPrimary, buttonSecondary, inputClass } from '@/components/styles'
import type { InventoryFlash } from '@/features/inventory/flash'
import { LotCard } from '@/features/inventory/LotCard'
import { inventoryErrorMessage, useLots, useRestoreLot } from '@/features/inventory/queries'
import {
  filterLots,
  SORT_OPTIONS,
  type SortKey,
  sortLots,
} from '@/features/inventory/sortFilter'
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategory,
  STORAGE_LOCATION_LABELS,
  STORAGE_LOCATIONS,
  type StorageLocation,
} from '@/types/inventory'

function FlashBanner({ flash }: { flash: InventoryFlash }) {
  const navigate = useNavigate()
  const location = useLocation()
  const restoreLot = useRestoreLot()

  function replaceFlash(next: InventoryFlash | null) {
    navigate({ search: location.search }, { replace: true, state: next })
  }

  function handleUndo() {
    if (!flash.undoDeleteLotId || restoreLot.isPending) return
    restoreLot.mutate(flash.undoDeleteLotId, {
      onSuccess: (lot) => replaceFlash({ notice: `‘${lot.name}’을(를) 복구했습니다.` }),
    })
  }

  return (
    <div className="rounded-card border-line mt-4 flex flex-wrap items-center gap-3 border bg-white p-3 text-sm">
      <p role="status" className="flex-1">
        {flash.notice}
      </p>
      {flash.undoDeleteLotId && (
        <button
          type="button"
          onClick={handleUndo}
          disabled={restoreLot.isPending}
          className="text-accent-strong font-semibold underline disabled:opacity-50"
        >
          {restoreLot.isPending ? '복구 중…' : '되돌리기'}
        </button>
      )}
      <button type="button" onClick={() => replaceFlash(null)} className="text-ink-muted underline">
        닫기
      </button>
      {restoreLot.isError && (
        <p role="alert" className="text-danger w-full">
          복구하지 못했습니다. {inventoryErrorMessage(restoreLot.error)}
        </p>
      )}
    </div>
  )
}

export function InventoryPage() {
  const routerLocation = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<IngredientCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('expiry')
  const lots = useLots()

  const requested = searchParams.get('loc')
  const location = STORAGE_LOCATIONS.includes(requested as StorageLocation)
    ? (requested as StorageLocation)
    : 'fridge'
  const flash = routerLocation.state as InventoryFlash | null

  const allLots = lots.data ?? []
  const visibleLots = sortLots(filterLots(allLots, { location, category, search }), sortKey)
  const locationLabel = STORAGE_LOCATION_LABELS[location]

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">재료 관리</h1>
        <Link to={`/add?loc=${location}`} className={buttonPrimary}>
          재료 추가
        </Link>
      </div>

      {flash?.notice && <FlashBanner flash={flash} />}

      <div role="tablist" aria-label="보관 장소" className="mt-6 flex gap-2">
        {STORAGE_LOCATIONS.map((item) => {
          const count = allLots.filter((lot) => lot.storage_location === item).length
          const selected = item === location
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSearchParams({ loc: item }, { replace: true, state: flash })}
              className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                selected ? 'bg-brand-200 font-semibold' : 'border-line border bg-white'
              }`}
            >
              {STORAGE_LOCATION_LABELS[item]}
              {lots.isSuccess && <span className="text-ink-muted"> {count}</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="text-sm font-semibold">
          재료 검색
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="재료명"
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold">
          카테고리
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory | 'all')}
            className={inputClass}
          >
            <option value="all">전체</option>
            {INGREDIENT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          정렬
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={inputClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="tabpanel" aria-label={`${locationLabel} 재료`} className="mt-6">
        {lots.isPending && (
          <p role="status" className="text-ink-muted">
            재료를 불러오는 중입니다…
          </p>
        )}

        {lots.isError && (
          <div role="alert" className="rounded-card bg-white p-4">
            <p className="text-danger text-sm">{inventoryErrorMessage(lots.error)}</p>
            <button type="button" onClick={() => lots.refetch()} className={`${buttonSecondary} mt-3`}>
              다시 시도
            </button>
          </div>
        )}

        {lots.isSuccess && allLots.length === 0 && (
          <div className="rounded-card bg-brand-100 p-6 text-center">
            <p className="font-semibold">아직 등록된 재료가 없습니다.</p>
            <p className="text-ink-muted mt-1 text-sm">
              예: 계란 10개, 우유 1L, 양파 3개처럼 지금 가지고 있는 재료부터 등록해 보세요.
            </p>
            <Link to={`/add?loc=${location}`} className={`${buttonPrimary} mt-4`}>
              첫 재료 추가하기
            </Link>
          </div>
        )}

        {lots.isSuccess && allLots.length > 0 && visibleLots.length === 0 && (
          <p className="text-ink-muted">
            {search.trim() !== '' || category !== 'all'
              ? '조건에 맞는 재료가 없습니다.'
              : `${locationLabel}에 등록된 재료가 없습니다.`}
          </p>
        )}

        {visibleLots.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {visibleLots.map((lot) => (
              <li key={lot.id}>
                <LotCard lot={lot} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
