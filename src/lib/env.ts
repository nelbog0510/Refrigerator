import { z } from 'zod'

const supabaseEnvSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(1),
})

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>

/** 값이 없거나 형식이 잘못되면 null. 호출부에서 "미연결" 상태로 처리한다. */
export function parseSupabaseEnv(raw: {
  url?: string
  anonKey?: string
}): SupabaseEnv | null {
  const result = supabaseEnvSchema.safeParse(raw)
  return result.success ? result.data : null
}

export const supabaseEnv = parseSupabaseEnv({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})
