-- 1단계 MVP: 재료 로트와 변경 이력 (CLAUDE.md 7장)
-- 공동 냉장고(Fridge/Household)는 확장 단계에서 추가한다. 지금은 사용자 단위로만 소유한다.

create table public.ingredient_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name text not null check (char_length(btrim(name)) > 0),
  category text not null default '기타' check (
    category in (
      '채소', '과일', '육류', '수산물', '달걀·유제품', '곡류',
      '버섯', '양념·소스', '가공식품', '음료', '기타'
    )
  ),
  quantity numeric not null check (quantity >= 0),
  unit text not null check (char_length(btrim(unit)) > 0),
  storage_location text not null check (storage_location in ('fridge', 'freezer', 'pantry')),

  purchased_on date,
  registered_at timestamptz not null default now(),

  -- 포장에 표시된 기한(원본). 이동·재계산 시에도 덮어쓰지 않는다.
  expires_on date,
  expiry_type text not null default 'unknown' check (
    expiry_type in ('use_by', 'best_before', 'sell_by', 'unknown')
  ),

  -- 참고용 추정 보관 기간. 포장 표시 기한과 별도로 관리한다.
  estimated_keep_until date,
  estimate_source text,

  price numeric check (price >= 0),
  memo text,

  status text not null default 'active' check (
    status in ('active', 'consumed', 'discarded', 'deleted')
  ),
  -- 부분 이동으로 갈라져 나온 로트라면 원래 로트
  parent_lot_id uuid references public.ingredient_lots (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredient_lots_user_location_idx
  on public.ingredient_lots (user_id, storage_location);
create index ingredient_lots_user_expires_idx
  on public.ingredient_lots (user_id, expires_on);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingredient_lots_set_updated_at
  before update on public.ingredient_lots
  for each row execute function public.set_updated_at();

create table public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lot_id uuid not null references public.ingredient_lots (id) on delete cascade,
  -- 부분 이동 시 상대 로트(원래 로트 ↔ 파생 로트)
  related_lot_id uuid references public.ingredient_lots (id) on delete set null,

  event_type text not null check (
    event_type in ('add', 'update', 'move', 'consume', 'delete', 'restore')
  ),
  actor text not null default 'user' check (actor in ('user', 'ai')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index inventory_events_lot_idx
  on public.inventory_events (lot_id, created_at desc);
create index inventory_events_user_idx
  on public.inventory_events (user_id, created_at desc);

-- 사용자별 접근 제어: 본인 데이터만 읽고 쓸 수 있다.
alter table public.ingredient_lots enable row level security;
alter table public.inventory_events enable row level security;

create policy "본인 재료 조회" on public.ingredient_lots
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 재료 등록" on public.ingredient_lots
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "본인 재료 수정" on public.ingredient_lots
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "본인 재료 삭제" on public.ingredient_lots
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 이력은 추가와 조회만 허용한다(수정·삭제 불가).
create policy "본인 이력 조회" on public.inventory_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 이력 기록" on public.inventory_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
