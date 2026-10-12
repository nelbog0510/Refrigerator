import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NAV_ITEMS } from '@/app/navigation'
import { routes } from '@/app/routes'

type AuthCallback = (event: string, session: unknown) => void

const auth = vi.hoisted(() => ({
  session: null as unknown,
  listener: null as AuthCallback | null,
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      onAuthStateChange: (callback: AuthCallback) => {
        auth.listener = callback
        callback('INITIAL_SESSION', auth.session)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: auth.signInWithPassword,
      signUp: auth.signUp,
      signOut: auth.signOut,
    },
  },
}))

vi.mock('@/features/inventory/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/inventory/api')>()),
  listLots: async () => [],
}))

const SESSION = { user: { email: 'user@example.com' } }

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name })
}

async function fillCredentials(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('이메일'), email)
  await userEvent.type(screen.getByLabelText('비밀번호'), password)
}

beforeEach(() => {
  auth.session = null
  auth.listener = null
  auth.signInWithPassword.mockReset().mockResolvedValue({ error: null })
  auth.signUp.mockReset().mockResolvedValue({ data: { session: null }, error: null })
  auth.signOut.mockReset().mockResolvedValue({ error: null })
})

describe('로그인한 상태의 라우팅', () => {
  beforeEach(() => {
    auth.session = SESSION
  })

  it.each(NAV_ITEMS)('$path 에서 "$label" 화면을 보여준다', async ({ path, label }) => {
    renderAt(path)
    expect(await heading(label)).toBeInTheDocument()
  })

  it('없는 주소는 안내 화면을 보여준다', async () => {
    renderAt('/does-not-exist')
    expect(await heading('페이지를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('메뉴 링크로 화면을 이동한다', async () => {
    renderAt('/')
    const nav = await screen.findByRole('navigation', { name: '주요 메뉴' })
    await userEvent.click(within(nav).getByRole('link', { name: '재료 관리' }))
    expect(await heading('재료 관리')).toBeInTheDocument()
  })

  it('/login 으로 들어오면 홈으로 보낸다', async () => {
    renderAt('/login')
    expect(await heading('홈')).toBeInTheDocument()
  })

  it('설정에서 로그아웃하면 로그인 화면으로 돌아간다', async () => {
    auth.signOut.mockImplementation(async () => {
      auth.listener?.('SIGNED_OUT', null)
      return { error: null }
    })
    renderAt('/settings')
    expect(await screen.findByText('user@example.com')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(await heading('로그인')).toBeInTheDocument()
  })
})

describe('로그인하지 않은 상태', () => {
  it('보호된 화면 대신 로그인 화면을 보여준다', async () => {
    renderAt('/inventory')
    expect(await heading('로그인')).toBeInTheDocument()
  })

  it('로그인에 성공하면 원래 가려던 화면으로 이동한다', async () => {
    auth.signInWithPassword.mockImplementation(async () => {
      auth.listener?.('SIGNED_IN', SESSION)
      return { error: null }
    })
    renderAt('/inventory')
    await heading('로그인')
    await fillCredentials('user@example.com', 'secret12')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret12',
    })
    expect(await heading('재료 관리')).toBeInTheDocument()
  })

  it('로그인에 실패하면 오류를 보여주고 화면에 머문다', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    renderAt('/login')
    await heading('로그인')
    await fillCredentials('user@example.com', 'wrongpw')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
    expect(await heading('로그인')).toBeInTheDocument()
  })

  it('입력이 잘못되면 서버에 요청하지 않는다', async () => {
    renderAt('/login')
    await heading('로그인')
    await fillCredentials('user@example.com', '123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호는 6자 이상')
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('회원가입 후 세션이 없으면 인증 메일 안내를 보여준다', async () => {
    renderAt('/login')
    await heading('로그인')
    await userEvent.click(screen.getByRole('button', { name: /회원가입/ }))
    await heading('회원가입')
    await fillCredentials('new@example.com', 'secret12')
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))

    expect(auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret12' })
    expect(await screen.findByRole('status')).toHaveTextContent('인증 메일을 보냈습니다')
  })
})
