import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NAV_ITEMS } from '@/app/navigation'
import { routes } from '@/app/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('라우팅', () => {
  it.each(NAV_ITEMS)('$path 에서 "$label" 화면을 보여준다', ({ path, label }) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
  })

  it('없는 주소는 안내 화면을 보여준다', () => {
    renderAt('/does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: '페이지를 찾을 수 없습니다' }),
    ).toBeInTheDocument()
  })

  it('메뉴 링크로 화면을 이동한다', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: '주요 메뉴' })
    await userEvent.click(within(nav).getByRole('link', { name: '재료 관리' }))
    expect(screen.getByRole('heading', { level: 1, name: '재료 관리' })).toBeInTheDocument()
  })
})
