import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-ink-muted mt-2">주소가 잘못되었거나 삭제된 페이지입니다.</p>
      <Link to="/" className="text-accent-strong mt-6 inline-block font-semibold underline">
        홈으로 이동
      </Link>
    </section>
  )
}
