import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export interface AuthState {
  session: Session | null
  /** 저장된 세션을 확인하는 중 */
  isLoading: boolean
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return value
}
