import type { Session } from '@supabase/supabase-js'
import { type ReactNode, useEffect, useState } from 'react'
import { AuthContext } from '@/features/auth/authContext'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return
    // 구독 직후 INITIAL_SESSION 이벤트로 저장된 세션이 전달된다.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={{ session, isLoading }}>{children}</AuthContext>
}
