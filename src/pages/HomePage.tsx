import { Link } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'

const QUICK_LINKS = [
  { to: '/add', label: '재료 추가' },
  { to: '/achievements', label: '관리 성과' },
]

export function HomePage() {
  return (
    <PagePlaceholder
      title="홈"
      description="오늘의 냉장고 상태와 임박 재료, 추천 요리를 한눈에 봅니다."
    >
      <ul className="mt-6 flex flex-wrap gap-3">
        {QUICK_LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="bg-accent inline-block rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </PagePlaceholder>
  )
}
