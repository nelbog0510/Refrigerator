import type { ReactNode } from 'react'

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

/** 환경 설정 단계의 임시 화면. 기능 구현 시 각 페이지에서 제거한다. */
export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-ink-muted mt-2">{description}</p>
      <p className="rounded-card bg-brand-100 mt-6 p-4 text-sm">
        이 화면은 아직 구현되지 않았습니다.
      </p>
      {children}
    </section>
  )
}
