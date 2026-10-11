import { describe, expect, it } from 'vitest'
import { parseSupabaseEnv } from '@/lib/env'

describe('parseSupabaseEnv', () => {
  it('값이 모두 유효하면 그대로 반환한다', () => {
    expect(parseSupabaseEnv({ url: 'https://example.supabase.co', anonKey: 'key' })).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'key',
    })
  })

  it.each([
    { url: undefined, anonKey: undefined },
    { url: '', anonKey: 'key' },
    { url: 'not-a-url', anonKey: 'key' },
    { url: 'https://example.supabase.co', anonKey: '' },
  ])('값이 없거나 잘못되면 null ($url, $anonKey)', (raw) => {
    expect(parseSupabaseEnv(raw)).toBeNull()
  })
})
