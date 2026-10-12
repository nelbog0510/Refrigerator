import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLot,
  deleteLot,
  InventoryError,
  listLotEvents,
  listLots,
  type LotRef,
  restoreLot,
  updateLot,
} from '@/features/inventory/api'
import type { LotInput } from '@/features/inventory/types'

// 모든 화면이 이 한 쿼리를 재고의 단일 데이터 소스로 공유한다.
const LOTS_KEY = ['lots'] as const
const lotEventsKey = (lotId: string) => ['lot-events', lotId] as const

export function useLots() {
  return useQuery({ queryKey: LOTS_KEY, queryFn: listLots })
}

export function useLotEvents(lotId: string) {
  return useQuery({ queryKey: lotEventsKey(lotId), queryFn: () => listLotEvents(lotId) })
}

function useInvalidateInventory() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: LOTS_KEY }),
      queryClient.invalidateQueries({ queryKey: ['lot-events'] }),
    ])
}

export function useCreateLot() {
  const invalidate = useInvalidateInventory()
  return useMutation({ mutationFn: createLot, onSuccess: invalidate })
}

export function useUpdateLot() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: ({ lot, input }: { lot: LotRef; input: LotInput }) => updateLot(lot, input),
    // 충돌로 실패했을 때도 최신 내용을 다시 불러온다.
    onSettled: invalidate,
  })
}

export function useDeleteLot() {
  const invalidate = useInvalidateInventory()
  return useMutation({ mutationFn: deleteLot, onSettled: invalidate })
}

/** 여러 건을 한 번에 처리한 결과. 일부만 성공할 수 있다. */
async function settleAll<T>(tasks: Promise<T>[]) {
  const results = await Promise.allSettled(tasks)
  const succeeded = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  if (succeeded.length === 0) {
    throw (results[0] as PromiseRejectedResult).reason
  }
  return { succeeded, failedCount: results.length - succeeded.length }
}

export function useDeleteLots() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (lots: LotRef[]) => settleAll(lots.map(deleteLot)),
    onSettled: invalidate,
  })
}

export function useRestoreLots() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (ids: string[]) => settleAll(ids.map(restoreLot)),
    onSettled: invalidate,
  })
}

export function inventoryErrorMessage(error: unknown): string {
  if (error instanceof InventoryError) return error.message
  return '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.'
}
