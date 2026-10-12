import { NavLink, Outlet } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS, type BottomNavItem, NAV_ITEMS, type NavItem } from '@/app/navigation'

function SideNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
          isActive ? 'bg-brand-200 text-ink font-semibold' : 'text-ink-muted hover:bg-brand-100'
        }`
      }
    >
      <Icon aria-hidden="true" className="size-5" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function BottomNavLink({ item }: { item: BottomNavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className="group flex flex-1 flex-col items-center gap-1 pt-2 pb-2 text-xs"
    >
      {({ isActive }) => (
        <>
          {item.primary ? (
            // 바 위로 솟은 원형 버튼
            <span className="bg-brand-200 ring-brand-50 -mt-9 flex size-16 items-center justify-center rounded-full shadow-lg ring-4 group-hover:brightness-95">
              <Icon aria-hidden="true" strokeWidth={1.75} className="text-ink size-8" />
            </span>
          ) : (
            <span
              className={`flex h-9 w-14 items-center justify-center rounded-full ${
                isActive ? 'bg-brand-200' : 'group-hover:bg-brand-100'
              }`}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={`size-6 ${isActive ? 'text-ink' : 'text-ink-muted'}`}
              />
            </span>
          )}
          <span className={isActive ? 'text-ink font-bold' : 'text-ink-muted'}>{item.label}</span>
        </>
      )}
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
            <SideNavLink key={item.path} item={item} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="하단 메뉴"
        className="border-line fixed inset-x-0 bottom-0 flex items-end border-t bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {BOTTOM_NAV_ITEMS.map((item) => (
          <BottomNavLink key={item.path} item={item} />
        ))}
      </nav>
    </div>
  )
}
