import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { useAuth } from '@/features/auth/authContext'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    if (!supabase || isSigningOut) return
    setIsSigningOut(true)
    setError(null)
    const { error: authError } = await supabase.auth.signOut()
    if (authError) {
      setError('로그아웃하지 못했습니다. 다시 시도해 주세요.')
      setIsSigningOut(false)
      return
    }
    // 다음 사용자에게 이전 사용자의 캐시가 보이지 않게 한다.
    queryClient.clear()
  }

  return (
    <PagePlaceholder
      title="설정"
      description="계정, 알림, 언어·테마, 데이터 관리를 설정합니다."
    >
      <section className="rounded-card mt-6 bg-white p-4">
        <h2 className="font-semibold">연결된 계정</h2>
        <p className="text-ink-muted mt-1 text-sm">{session?.user.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="border-line mt-4 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {isSigningOut ? '로그아웃 중…' : '로그아웃'}
        </button>
        {error && (
          <p role="alert" className="text-danger mt-2 text-sm">
            {error}
          </p>
        )}
      </section>
    </PagePlaceholder>
  )
}
