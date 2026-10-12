import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/features/auth/authContext'
import { authErrorMessage } from '@/features/auth/authErrors'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup'

const MODE_LABELS: Record<Mode, string> = { login: '로그인', signup: '회원가입' }

const credentialsSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
})

const inputClass = 'border-line mt-1 w-full rounded-xl border bg-white px-3 py-2'

export function LoginPage() {
  const { session } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || isSubmitting) return
    setError(null)
    setNotice(null)

    const parsed = credentialsSchema.safeParse({ email: email.trim(), password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword(parsed.data)
        if (authError) setError(authErrorMessage(authError))
      } else {
        const { data, error: authError } = await supabase.auth.signUp(parsed.data)
        if (authError) {
          setError(authErrorMessage(authError))
        } else if (!data.session) {
          // 이메일 인증을 켠 프로젝트는 가입 직후 세션이 없다.
          setNotice('인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.')
          setMode('login')
          setPassword('')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
    setNotice(null)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-8">
      <p className="text-ink-muted text-sm">AI 스마트 냉장고</p>
      <h1 className="mt-1 text-2xl font-bold">{MODE_LABELS[mode]}</h1>

      {!supabase && (
        <p role="alert" className="text-warning rounded-card mt-4 bg-white p-3 text-sm">
          Supabase 환경 변수가 설정되지 않아 로그인할 수 없습니다. .env.example을 참고해
          .env.local을 만든 뒤 개발 서버를 다시 시작해 주세요.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <label className="text-sm font-semibold">
          이메일
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold">
          비밀번호
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-info text-sm">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={!supabase || isSubmitting}
          className="bg-accent rounded-xl px-4 py-2 font-semibold disabled:opacity-50"
        >
          {isSubmitting ? '처리 중…' : MODE_LABELS[mode]}
        </button>
      </form>

      <button
        type="button"
        onClick={switchMode}
        className="text-accent-strong mt-4 self-start text-sm font-semibold underline"
      >
        {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
      </button>
    </main>
  )
}
