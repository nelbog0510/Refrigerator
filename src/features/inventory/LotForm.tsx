import { type FormEvent, type ReactNode, useState } from 'react'
import { buttonPrimary, buttonSecondary, inputClass } from '@/components/styles'
import {
  type LotFormErrors,
  type LotFormValues,
  parseLotForm,
  UNIT_SUGGESTIONS,
} from '@/features/inventory/lotFormValues'
import type { Lot, LotInput } from '@/features/inventory/types'
import {
  EXPIRY_TYPE_LABELS,
  EXPIRY_TYPES,
  INGREDIENT_CATEGORIES,
  STORAGE_LOCATION_LABELS,
  STORAGE_LOCATIONS,
  type StorageLocation,
} from '@/types/inventory'

interface LotFormProps {
  initialValues: LotFormValues
  submitLabel: string
  isPending: boolean
  submitError: string | null
  onSubmit: (input: LotInput) => void
  onCancel?: () => void
  /** 수정 화면에서는 보관 장소를 바꾸지 못하게 한다(이동은 별도 절차). */
  lockLocation?: boolean
  /** 같은 이름의 재료가 이미 있는지 안내하기 위한 현재 재고 */
  existingLots?: Lot[]
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold">
        {label}
        {required && <span className="text-danger"> (필수)</span>}
        {children}
      </label>
      {error && (
        <p role="alert" className="text-danger mt-1 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export function LotForm({
  initialValues,
  submitLabel,
  isPending,
  submitError,
  onSubmit,
  onCancel,
  lockLocation = false,
  existingLots = [],
}: LotFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<LotFormErrors>({})

  function set(field: keyof LotFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isPending) return
    const parsed = parseLotForm(values)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    onSubmit(parsed.input)
  }

  const trimmedName = values.name.trim()
  const sameNameCount =
    trimmedName === '' ? 0 : existingLots.filter((lot) => lot.name === trimmedName).length

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="재료명" required error={errors.name}>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
      </Field>
      {sameNameCount > 0 && (
        <p role="status" className="text-info -mt-2 text-sm">
          같은 이름의 재료가 이미 {sameNameCount}건 있습니다. 합치지 않고 별도 항목으로
          등록됩니다.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="수량" required error={errors.quantity}>
          <input
            type="text"
            inputMode="decimal"
            value={values.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            aria-invalid={Boolean(errors.quantity)}
            className={inputClass}
          />
        </Field>
        <Field label="단위" required error={errors.unit}>
          <input
            type="text"
            list="unit-suggestions"
            value={values.unit}
            onChange={(e) => set('unit', e.target.value)}
            aria-invalid={Boolean(errors.unit)}
            className={inputClass}
          />
        </Field>
        <datalist id="unit-suggestions">
          {UNIT_SUGGESTIONS.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
      </div>

      {lockLocation ? (
        <p className="text-sm">
          <span className="font-semibold">보관 장소</span>{' '}
          {STORAGE_LOCATION_LABELS[values.storage_location as StorageLocation]}
          <span className="text-ink-muted block">
            보관 장소 이동 기능은 아직 구현되지 않아 여기서는 바꿀 수 없습니다.
          </span>
        </p>
      ) : (
        <fieldset>
          <legend className="text-sm font-semibold">
            보관 장소<span className="text-danger"> (필수)</span>
          </legend>
          <div className="mt-1 flex gap-2">
            {STORAGE_LOCATIONS.map((location) => (
              <label
                key={location}
                className="border-line has-checked:bg-brand-200 flex-1 cursor-pointer rounded-xl border bg-white px-3 py-2 text-center text-sm has-checked:font-semibold has-focus-visible:outline-2"
              >
                <input
                  type="radio"
                  name="storage_location"
                  value={location}
                  checked={values.storage_location === location}
                  onChange={() => set('storage_location', location)}
                  className="sr-only"
                />
                {STORAGE_LOCATION_LABELS[location]}
              </label>
            ))}
          </div>
          {errors.storage_location && (
            <p role="alert" className="text-danger mt-1 text-sm">
              {errors.storage_location}
            </p>
          )}
        </fieldset>
      )}

      <Field label="카테고리" error={errors.category}>
        <select
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          className={inputClass}
        >
          {INGREDIENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="포장 표시 기한" error={errors.expires_on}>
          <input
            type="date"
            value={values.expires_on}
            onChange={(e) => set('expires_on', e.target.value)}
            aria-invalid={Boolean(errors.expires_on)}
            className={inputClass}
          />
        </Field>
        <Field label="기한 유형" error={errors.expiry_type}>
          <select
            value={values.expiry_type}
            onChange={(e) => set('expiry_type', e.target.value)}
            disabled={values.expires_on === ''}
            className={`${inputClass} disabled:opacity-50`}
          >
            {EXPIRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {EXPIRY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-ink-muted -mt-2 text-sm">
        포장에 적힌 날짜를 그대로 입력해 주세요. 비워 두면 ‘소비기한 미등록’으로 표시됩니다.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="구매일" error={errors.purchased_on}>
          <input
            type="date"
            value={values.purchased_on}
            onChange={(e) => set('purchased_on', e.target.value)}
            aria-invalid={Boolean(errors.purchased_on)}
            className={inputClass}
          />
        </Field>
        <Field label="가격(원)" error={errors.price}>
          <input
            type="text"
            inputMode="numeric"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            aria-invalid={Boolean(errors.price)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="메모" error={errors.memo}>
        <textarea
          rows={2}
          value={values.memo}
          onChange={(e) => set('memo', e.target.value)}
          aria-invalid={Boolean(errors.memo)}
          className={inputClass}
        />
      </Field>

      {submitError && (
        <p role="alert" className="text-danger text-sm">
          {submitError}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? '저장 중…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isPending} className={buttonSecondary}>
            취소
          </button>
        )}
      </div>
    </form>
  )
}
