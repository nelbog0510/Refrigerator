import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buttonDanger, buttonSecondary } from '@/components/styles'
import { ExpiryBadge } from '@/features/inventory/ExpiryBadge'
import type { InventoryFlash } from '@/features/inventory/flash'
import { LotForm } from '@/features/inventory/LotForm'
import { lotToFormValues } from '@/features/inventory/lotFormValues'
import {
  inventoryErrorMessage,
  useDeleteLot,
  useLotEvents,
  useLots,
  useUpdateLot,
} from '@/features/inventory/queries'
import { EVENT_TYPE_LABELS, type Lot, type LotInput } from '@/features/inventory/types'
import { EXPIRY_TYPE_LABELS, STORAGE_LOCATION_LABELS } from '@/types/inventory'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

function LotHistory({ lotId }: { lotId: string }) {
  const events = useLotEvents(lotId)
  return (
    <section className="rounded-card mt-4 bg-white p-4">
      <h2 className="font-semibold">변경 이력</h2>
      {events.isPending && <p className="text-ink-muted mt-2 text-sm">불러오는 중입니다…</p>}
      {events.isError && (
        <p role="alert" className="text-danger mt-2 text-sm">
          이력을 불러오지 못했습니다. {inventoryErrorMessage(events.error)}
        </p>
      )}
      {events.isSuccess && events.data.length === 0 && (
        <p className="text-ink-muted mt-2 text-sm">기록된 이력이 없습니다.</p>
      )}
      {events.isSuccess && events.data.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {events.data.map((event) => (
            <li key={event.id} className="flex justify-between gap-3">
              <span>{EVENT_TYPE_LABELS[event.event_type]}</span>
              <span className="text-ink-muted">{formatDateTime(event.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LotSummary({ lot }: { lot: Lot }) {
  const rows: [string, string][] = [
    ['수량', `${lot.quantity}${lot.unit}`],
    ['보관 장소', STORAGE_LOCATION_LABELS[lot.storage_location]],
    ['카테고리', lot.category],
    [
      '포장 표시 기한',
      lot.expires_on
        ? `${lot.expires_on} (${EXPIRY_TYPE_LABELS[lot.expiry_type]})`
        : '소비기한 미등록',
    ],
    ['구매일', lot.purchased_on ?? '미입력'],
    ['등록일', formatDateTime(lot.registered_at)],
    ['가격', lot.price === null ? '미입력' : `${lot.price.toLocaleString('ko-KR')}원`],
    ['메모', lot.memo ?? '없음'],
  ]
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-ink-muted">{term}</dt>
          <dd className="break-all whitespace-pre-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function LotDetail({ lot }: { lot: Lot }) {
  const navigate = useNavigate()
  const updateLot = useUpdateLot()
  const deleteLot = useDeleteLot()
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view')

  function handleUpdate(input: LotInput) {
    updateLot.mutate({ lot, input }, { onSuccess: () => setMode('view') })
  }

  function handleDelete() {
    if (deleteLot.isPending) return
    deleteLot.mutate(lot, {
      onSuccess: () => {
        const flash: InventoryFlash = {
          notice: `‘${lot.name}’을(를) 삭제했습니다.`,
          undoDeleteLotIds: [lot.id],
        }
        navigate(`/inventory?loc=${lot.storage_location}`, { state: flash })
      },
    })
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold break-all">{lot.name}</h1>
        <ExpiryBadge lot={lot} />
      </div>

      <section className="rounded-card mt-6 bg-white p-4">
        {mode === 'edit' ? (
          <LotForm
            // 충돌 후 최신 내용을 다시 받으면 폼도 새 값으로 초기화한다.
            key={lot.updated_at}
            initialValues={lotToFormValues(lot)}
            submitLabel="수정 내용 저장"
            isPending={updateLot.isPending}
            submitError={updateLot.isError ? inventoryErrorMessage(updateLot.error) : null}
            onSubmit={handleUpdate}
            onCancel={() => {
              updateLot.reset()
              setMode('view')
            }}
            lockLocation
          />
        ) : (
          <>
            <LotSummary lot={lot} />
            <p className="text-ink-muted mt-4 text-xs">
              표시 기한은 입력한 날짜를 그대로 보여 줍니다. 실제 섭취 가능 여부는 보관 상태와 제품
              상태를 직접 확인해 주세요.
            </p>

            {mode === 'view' && (
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setMode('edit')} className={buttonSecondary}>
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setMode('confirmDelete')}
                  className={buttonSecondary}
                >
                  삭제
                </button>
              </div>
            )}

            {mode === 'confirmDelete' && (
              <div role="alertdialog" aria-labelledby="delete-title" className="bg-brand-100 mt-4 rounded-xl p-4">
                <p id="delete-title" className="font-semibold">
                  ‘{lot.name}’ {lot.quantity}
                  {lot.unit}을(를) 삭제할까요?
                </p>
                <p className="text-ink-muted mt-1 text-sm">
                  재고 목록에서 사라집니다. 삭제 직후에는 되돌릴 수 있습니다.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteLot.isPending}
                    className={buttonDanger}
                  >
                    {deleteLot.isPending ? '삭제 중…' : '삭제하기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteLot.reset()
                      setMode('view')
                    }}
                    disabled={deleteLot.isPending}
                    className={buttonSecondary}
                  >
                    취소
                  </button>
                </div>
                {deleteLot.isError && (
                  <p role="alert" className="text-danger mt-2 text-sm">
                    {inventoryErrorMessage(deleteLot.error)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <LotHistory lotId={lot.id} />
    </>
  )
}

export function LotDetailPage() {
  const { lotId } = useParams()
  const lots = useLots()
  const lot = lots.data?.find((item) => item.id === lotId)

  return (
    <section className="max-w-xl">
      <Link to="/inventory" className="text-accent-strong text-sm font-semibold underline">
        재료 관리로 돌아가기
      </Link>

      {lots.isPending && (
        <p role="status" className="text-ink-muted mt-4">
          재료를 불러오는 중입니다…
        </p>
      )}

      {lots.isError && (
        <div role="alert" className="rounded-card mt-4 bg-white p-4">
          <p className="text-danger text-sm">{inventoryErrorMessage(lots.error)}</p>
          <button type="button" onClick={() => lots.refetch()} className={`${buttonSecondary} mt-3`}>
            다시 시도
          </button>
        </div>
      )}

      {lots.isSuccess && !lot && (
        <>
          <h1 className="mt-2 text-2xl font-bold">재료를 찾을 수 없습니다</h1>
          <p className="text-ink-muted mt-2">이미 삭제되었거나 주소가 잘못되었습니다.</p>
        </>
      )}

      {lot && <LotDetail lot={lot} />}
    </section>
  )
}
