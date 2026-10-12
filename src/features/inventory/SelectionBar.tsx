import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface SelectionBarProps {
  count: number
  isDeleting: boolean
  error: string | null
  onDelete: () => void
}

const actionClass = 'rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40'
// 아직 만들지 않은 기능. 눌리지 않게 막고 이유를 알려 준다.
const pendingClass = `${actionClass} cursor-not-allowed`

/** 선택 모드에서 하단에 뜨는 일괄 작업 바 */
export function SelectionBar({ count, isDeleting, error, onDelete }: SelectionBarProps) {
  const [confirming, setConfirming] = useState(false)
  const showConfirm = confirming && count > 0

  return (
    <div className="fixed inset-x-4 bottom-20 md:right-8 md:bottom-6 md:left-64">
      <div
        role="region"
        aria-label="선택한 재료 작업"
        className="bg-ink mx-auto flex max-w-xl items-center gap-2 rounded-2xl py-2 pr-2 pl-4 text-white shadow-lg"
      >
        {showConfirm ? (
          <>
            <p role="alert" className="flex-1 text-sm font-bold">
              {count}개를 삭제할까요?
            </p>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isDeleting}
              className={`${actionClass} bg-white/15`}
            >
              취소
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className={`${actionClass} bg-brand-200 text-danger`}
            >
              {isDeleting ? '삭제 중…' : '삭제하기'}
            </button>
          </>
        ) : (
          <>
            <p role="status" className="flex-1 text-sm font-bold">
              {count}개 선택
            </p>
            <button
              type="button"
              disabled
              aria-label="보관 장소 이동 (준비 중)"
              title="보관 장소 이동은 아직 준비 중입니다."
              className={`${pendingClass} bg-white/15`}
            >
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              disabled
              aria-label="레시피 (준비 중)"
              title="선택한 재료로 레시피 찾기는 아직 준비 중입니다."
              className={`${pendingClass} bg-accent text-white`}
            >
              레시피
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={count === 0}
              className={`${actionClass} bg-brand-200 text-danger`}
            >
              삭제
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger mx-auto mt-2 max-w-xl rounded-xl bg-white p-2 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
