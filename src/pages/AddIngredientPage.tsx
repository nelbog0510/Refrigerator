import { useNavigate, useSearchParams } from 'react-router-dom'
import type { InventoryFlash } from '@/features/inventory/flash'
import { LotForm } from '@/features/inventory/LotForm'
import { emptyLotFormValues } from '@/features/inventory/lotFormValues'
import { inventoryErrorMessage, useCreateLot, useLots } from '@/features/inventory/queries'
import type { LotInput } from '@/features/inventory/types'
import { STORAGE_LOCATIONS, type StorageLocation } from '@/types/inventory'

export function AddIngredientPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lots = useLots()
  const createLot = useCreateLot()

  const requested = searchParams.get('loc')
  const initialLocation = STORAGE_LOCATIONS.includes(requested as StorageLocation)
    ? (requested as StorageLocation)
    : 'fridge'

  function handleSubmit(input: LotInput) {
    createLot.mutate(input, {
      onSuccess: (lot) => {
        const flash: InventoryFlash = { notice: `‘${lot.name}’을(를) 등록했습니다.` }
        navigate(`/inventory?loc=${lot.storage_location}`, { state: flash })
      },
    })
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-bold">재료 추가</h1>
      <p className="text-ink-muted mt-2">
        재료를 직접 입력해 등록합니다. 자연어 입력과 영수증 인식은 아직 구현되지 않았습니다.
      </p>
      <div className="rounded-card mt-6 bg-white p-4">
        <LotForm
          initialValues={emptyLotFormValues(initialLocation)}
          submitLabel="재고에 저장"
          isPending={createLot.isPending}
          submitError={createLot.isError ? inventoryErrorMessage(createLot.error) : null}
          onSubmit={handleSubmit}
          existingLots={lots.data}
        />
      </div>
    </section>
  )
}
