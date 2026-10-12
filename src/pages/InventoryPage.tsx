import { ChevronDown, Funnel, LayoutGrid, List, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { buttonPrimary, buttonSecondary } from '@/components/styles'
import type { InventoryFlash } from '@/features/inventory/flash'
import { LotCard } from '@/features/inventory/LotCard'
import { LotRow } from '@/features/inventory/LotRow'
import {
  inventoryErrorMessage,
  useDeleteLots,
  useLots,
  useRestoreLots,
} from '@/features/inventory/queries'
import { SelectionBar } from '@/features/inventory/SelectionBar'
import {
  filterLots,
  GROUP_OPTIONS,
  type GroupKey,
  groupLots,
  SORT_OPTIONS,
  type SortKey,
  sortLots,
} from '@/features/inventory/sortFilter'
import type { Lot } from '@/features/inventory/types'
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategory,
  STORAGE_LOCATION_LABELS,
  STORAGE_LOCATIONS,
  type StorageLocation,
} from '@/types/inventory'

function changedNotice(lots: Lot[], verb: string) {
  return lots.length === 1
    ? `‘${lots[0].name}’을(를) ${verb}했습니다.`
    : `재료 ${lots.length}개를 ${verb}했습니다.`
}

function FlashBanner({ flash }: { flash: InventoryFlash }) {
  const navigate = useNavigate()
  const location = useLocation()
  const restoreLots = useRestoreLots()
  const undoIds = flash.undoDeleteLotIds ?? []

  function replaceFlash(next: InventoryFlash | null) {
    navigate({ search: location.search }, { replace: true, state: next })
  }

  function handleUndo() {
    if (undoIds.length === 0 || restoreLots.isPending) return
    restoreLots.mutate(undoIds, {
      onSuccess: ({ succeeded, failedCount }) =>
        replaceFlash({
          notice:
            changedNotice(succeeded, '복구') +
            (failedCount > 0 ? ` ${failedCount}개는 복구하지 못했습니다.` : ''),
        }),
    })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 text-sm">
      <p role="status" className="flex-1">
        {flash.notice}
      </p>
      {undoIds.length > 0 && (
        <button
          type="button"
          onClick={handleUndo}
          disabled={restoreLots.isPending}
          className="text-accent-strong font-semibold underline disabled:opacity-50"
        >
          {restoreLots.isPending ? '복구 중…' : '되돌리기'}
        </button>
      )}
      <button type="button" onClick={() => replaceFlash(null)} className="text-ink-muted underline">
        닫기
      </button>
      {restoreLots.isError && (
        <p role="alert" className="text-danger w-full">
          복구하지 못했습니다. {inventoryErrorMessage(restoreLots.error)}
        </p>
      )}
    </div>
  )
}

/** 글자와 화살표만 보이는 드롭다운 */
function InlineSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { key: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="cursor-pointer appearance-none rounded-lg bg-transparent py-1.5 pr-7 pl-2 text-sm font-bold"
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-1.5 size-4" />
    </label>
  )
}

const chipClass = 'rounded-full px-3 py-1.5 text-sm'

export function InventoryPage() {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<IngredientCategory | 'all'>('all')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('expiry')
  const [groupKey, setGroupKey] = useState<GroupKey>('location')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const lots = useLots()
  const deleteLots = useDeleteLots()

  const requested = searchParams.get('loc')
  const location = STORAGE_LOCATIONS.includes(requested as StorageLocation)
    ? (requested as StorageLocation)
    : 'fridge'
  const flash = routerLocation.state as InventoryFlash | null

  const allLots = lots.data ?? []
  const visibleLots = sortLots(filterLots(allLots, { location, category, search }), sortKey)
  const groups = groupLots(visibleLots, groupKey, location)
  // 화면에 보이는 것만 선택으로 친다(그사이 사라진 재료는 제외).
  const selectedLots = visibleLots.filter((lot) => selectedIds.has(lot.id))
  const locationLabel = STORAGE_LOCATION_LABELS[location]
  // 선택 모드에서는 항상 목록으로 보여 준다.
  const showGrid = view === 'grid' && !selecting

  function stopSelecting() {
    setSelecting(false)
    setSelectedIds(new Set())
    deleteLots.reset()
  }

  function toggleSelected(lotId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(lotId)) next.add(lotId)
      return next
    })
  }

  function handleDeleteSelected() {
    if (selectedLots.length === 0 || deleteLots.isPending) return
    deleteLots.mutate(selectedLots, {
      onSuccess: ({ succeeded, failedCount }) => {
        const next: InventoryFlash = {
          notice:
            changedNotice(succeeded, '삭제') +
            (failedCount > 0 ? ` ${failedCount}개는 삭제하지 못했습니다.` : ''),
          undoDeleteLotIds: succeeded.map((lot) => lot.id),
        }
        stopSelecting()
        navigate({ search: routerLocation.search }, { replace: true, state: next })
      },
    })
  }

  return (
    <section className={selecting ? 'pb-20' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">재료 관리</h1>
        <button
          type="button"
          aria-expanded={isCategoryOpen}
          aria-controls="category-filter"
          onClick={() => setIsCategoryOpen((open) => !open)}
          className={`border-line flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
            category === 'all' ? 'bg-white' : 'bg-brand-200'
          }`}
        >
          <Funnel aria-hidden="true" className="size-4" />
          {category === 'all' ? '카테고리' : category}
        </button>
      </div>

      {isCategoryOpen && (
        <div
          id="category-filter"
          role="group"
          aria-label="카테고리 필터"
          className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-white p-3"
        >
          {(['all', ...INGREDIENT_CATEGORIES] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item)
                setIsCategoryOpen(false)
              }}
              className={`${chipClass} ${
                category === item ? 'bg-brand-200 font-bold' : 'border-line border'
              }`}
            >
              {item === 'all' ? '전체' : item}
            </button>
          ))}
        </div>
      )}

      {flash?.notice && <FlashBanner flash={flash} />}

      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 has-focus-visible:outline-2">
        <Search aria-hidden="true" className="text-ink-muted size-5 shrink-0" />
        <input
          type="search"
          aria-label="재료 검색"
          placeholder="재료 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </label>

      <div role="tablist" aria-label="보관 장소" className="mt-3 flex gap-2">
        {STORAGE_LOCATIONS.map((item) => {
          const isSelected = item === location
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedIds(new Set())
                setSearchParams({ loc: item }, { replace: true, state: flash })
              }}
              className={`flex-1 rounded-2xl border py-2.5 ${
                isSelected ? 'bg-brand-200 border-brand-200 font-bold' : 'border-line bg-white'
              }`}
            >
              {STORAGE_LOCATION_LABELS[item]}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <InlineSelect label="정렬" value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
        <InlineSelect
          label="묶어보기"
          value={groupKey}
          options={GROUP_OPTIONS}
          onChange={setGroupKey}
        />
        <span className="flex-1" />
        <button
          type="button"
          aria-label={view === 'list' ? '카드 보기로 전환' : '목록 보기로 전환'}
          onClick={() => setView(view === 'list' ? 'grid' : 'list')}
          disabled={selecting}
          className="rounded-lg p-2 disabled:opacity-40"
        >
          {view === 'list' ? (
            <LayoutGrid aria-hidden="true" className="size-4" />
          ) : (
            <List aria-hidden="true" className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
          disabled={!selecting && visibleLots.length === 0}
          className={`rounded-xl border px-3 py-1.5 text-sm font-bold disabled:opacity-40 ${
            selecting ? 'bg-brand-100 border-brand-200' : 'border-line bg-white'
          }`}
        >
          {selecting ? '완료' : '선택'}
        </button>
      </div>

      <div role="tabpanel" aria-label={`${locationLabel} 재료`} className="mt-4">
        {lots.isPending && (
          <p role="status" className="text-ink-muted">
            재료를 불러오는 중입니다…
          </p>
        )}

        {lots.isError && (
          <div role="alert" className="rounded-2xl bg-white p-4">
            <p className="text-danger text-sm">{inventoryErrorMessage(lots.error)}</p>
            <button type="button" onClick={() => lots.refetch()} className={`${buttonSecondary} mt-3`}>
              다시 시도
            </button>
          </div>
        )}

        {lots.isSuccess && allLots.length === 0 && (
          <div className="bg-brand-100 rounded-2xl p-6 text-center">
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

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.title ?? 'all'}>
              {group.title && <h2 className="mb-2 text-sm font-bold">{group.title}</h2>}
              <ul className={showGrid ? 'grid grid-cols-2 gap-3 md:grid-cols-3' : 'flex flex-col gap-2'}>
                {group.lots.map((lot) => (
                  <li key={lot.id}>
                    {showGrid ? (
                      <LotCard lot={lot} />
                    ) : (
                      <LotRow
                        lot={lot}
                        selecting={selecting}
                        selected={selectedIds.has(lot.id)}
                        onToggle={toggleSelected}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {selecting && (
        <SelectionBar
          count={selectedLots.length}
          isDeleting={deleteLots.isPending}
          error={deleteLots.isError ? inventoryErrorMessage(deleteLots.error) : null}
          onDelete={handleDeleteSelected}
        />
      )}
    </section>
  )
}
