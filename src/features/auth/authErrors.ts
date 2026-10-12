import type { AuthError } from '@supabase/supabase-js'

const MESSAGES: Record<string, string> = {
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  email_not_confirmed: '이메일 인증이 완료되지 않았습니다. 받은 메일의 링크를 눌러 주세요.',
  user_already_exists: '이미 가입된 이메일입니다. 로그인해 주세요.',
  email_exists: '이미 가입된 이메일입니다. 로그인해 주세요.',
  weak_password: '비밀번호가 너무 약합니다. 더 길고 복잡하게 만들어 주세요.',
  over_email_send_rate_limit: '메일 발송 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.',
  over_request_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
}

export function authErrorMessage(error: AuthError): string {
  return (
    (error.code && MESSAGES[error.code]) ||
    '요청을 처리하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.'
  )
}
