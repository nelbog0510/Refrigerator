# Refrigerator

AI 스마트 냉장고 관리 웹앱. 기획 요구사항은 [CLAUDE.md](CLAUDE.md) 참고.

## 기술 스택

Vite · React · TypeScript · Tailwind CSS · React Router · TanStack Query · Supabase · zod · Vitest · oxlint

## 시작하기

```bash
npm install
cp .env.example .env.local   # Supabase URL과 anon 키 입력
npm run dev
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 후 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사만 |
| `npm run lint` | oxlint |
| `npm test` | Vitest 1회 실행 |

## 폴더 구조

```
src/
  app/          라우트, 내비게이션 정의
  components/   공용 컴포넌트, 레이아웃
  pages/        화면 단위 컴포넌트
  lib/          Supabase 클라이언트, 환경 변수, React Query 설정
  types/        도메인 타입
  test/         테스트 설정
```
