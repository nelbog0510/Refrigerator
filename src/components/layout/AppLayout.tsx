import { TriangleAlert } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS, type NavItem } from '@/app/navigation'
import { isSupabaseConfigured } from '@/lib/supabase'

function navLinkClass(isActive: boolean, layout: 'side' | 'bottom') {
  const base =
    layout === 'side'
      ? 'flex items-center gap-3 rounded-xl px-3 py-2 text-sm'
      : 'flex flex-1 flex-col items-center gap-1 py-2 text-xs'
  const state = isActive
    ? 'bg-brand-200 font-semibold text-ink'
    : 'text-ink-muted hover:bg-brand-100'
  return `${base} ${state}`
}

function NavItemLink({ item, layout }: { item: NavItem; layout: 'side' | 'bottom' }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) => navLinkClass(isActive, layout)}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span>{item.label}</span>
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-line hidden w-56 shrink-0 border-r bg-white p-4 md:block">
        <p className="mb-6 px-3 text-lg font-bold">AI 스마트 냉장고</p>
        <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItemLink key={item.path} item={item} layout="side" />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!isSupabaseConfigured && (
          <p
            role="status"
            className="text-warning border-line flex items-center gap-2 border-b bg-white px-4 py-2 text-sm"
          >
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
            Supabase 환경 변수가 설정되지 않아 서버에 연결되지 않은 상태입니다. (.env.example
            참고)
          </p>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="하단 메뉴"
        className="border-line fixed inset-x-0 bottom-0 flex border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_ITEMS.filter((item) => item.inBottomNav).map((item) => (
          <NavItemLink key={item.path} item={item} layout="bottom" />
        ))}
      </nav>
    </div>
  )
}
