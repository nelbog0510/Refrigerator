import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseEnv } from '@/lib/env'

// 환경 변수가 없으면 null. 연결된 척하지 않고 UI에서 미연결 상태를 안내한다.
// DB 스키마가 확정되면 `supabase gen types typescript` 결과를 createClient<Database> 로 연결한다.
export const supabase: SupabaseClient | null = supabaseEnv
  ? createClient(supabaseEnv.url, supabaseEnv.anonKey)
  : null

export const isSupabaseConfigured = supabase !== null
