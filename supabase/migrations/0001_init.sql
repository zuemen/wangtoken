-- 愛的存摺 初始化 migration
create extension if not exists pgcrypto;

-- ========== 資料表 ==========
create table presets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bonus','deduct')),
  label text not null,
  points numeric(6,1) not null,
  requires_review boolean default false,
  daily_limit int,
  active boolean default true,
  created_at timestamptz default now()
);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  icon text, name text not null,
  cost numeric(6,1) not null,
  market_price int,
  active boolean default true,
  created_at timestamptz default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  actor text not null check (actor in ('gf','admin')),
  kind text not null check (kind in ('bonus','deduct','redeem','proposal','care')),
  label text not null,
  points numeric(6,1) not null default 0,
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  photo_path text, note text,
  reward_id uuid references rewards(id),
  fulfilled boolean,          -- 兌換紀錄用：null=非兌換, false=待出貨, true=已完成
  reviewed_at timestamptz
);

create table wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null, url text, note text,
  status text default 'open' check (status in ('open','added','rejected')),
  created_at timestamptz default now()
);

create index entries_created_at_idx on entries (created_at desc);
create index entries_status_idx on entries (status);

-- ========== 函式 ==========
-- 餘額 = approved entries 的 points 總和
create or replace function ledger_balance()
returns numeric
language sql stable
set search_path = public
as $$
  select coalesce(sum(points), 0) from entries where status = 'approved';
$$;

-- 兌換：advisory lock 防競態，餘額足夠才寫入
create or replace function redeem_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost numeric;
  v_name text;
  v_icon text;
  v_balance numeric;
  v_id uuid;
begin
  -- 同一把鎖序列化所有兌換，交易結束自動釋放
  perform pg_advisory_xact_lock(hashtext('love_passbook_ledger'));

  select cost, name, icon into v_cost, v_name, v_icon
  from rewards where id = p_reward_id and active = true;
  if not found then
    raise exception 'REWARD_NOT_FOUND';
  end if;

  select coalesce(sum(points), 0) into v_balance
  from entries where status = 'approved';

  if v_balance < v_cost then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  insert into entries (actor, kind, label, points, status, reward_id, fulfilled)
  values ('gf', 'redeem', coalesce(v_icon || ' ', '') || v_name, -v_cost, 'approved', p_reward_id, false)
  returning id into v_id;

  return v_id;
end;
$$;

-- ========== RLS：全開啟；anon 只能 select（Realtime 用），寫入只靠 service role ==========
alter table presets enable row level security;
alter table rewards enable row level security;
alter table entries enable row level security;
alter table wishes enable row level security;

create policy "anon can read presets" on presets for select to anon using (true);
create policy "anon can read rewards" on rewards for select to anon using (true);
create policy "anon can read entries" on entries for select to anon using (true);
create policy "anon can read wishes" on wishes for select to anon using (true);

-- ========== Realtime ==========
alter publication supabase_realtime add table entries, rewards, presets, wishes;

-- ========== Storage：私有 proofs bucket ==========
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- ========== 種子資料 ==========
insert into presets (type, label, points, requires_review, daily_limit) values
  ('bonus', '乖乖聽話一天', 0.1, false, 1),
  ('bonus', '主動關心噓寒問暖', 0.2, false, 2),
  ('bonus', '說我愛你', 0.1, false, 1),
  ('bonus', '誇獎稱讚我', 0.2, false, 2),
  ('bonus', '幫忙做家事', 0.5, false, null),
  ('bonus', '早起叫我起床', 0.2, false, 1),
  ('bonus', '陪我聊到很晚安慰我', 0.3, false, null),
  ('bonus', '準時吃三餐並回報', 0.1, false, 1),
  ('bonus', '早睡23:30前', 0.1, false, 1),
  ('bonus', '一起運動', 0.3, false, null),
  ('bonus', '主動規劃約會', 0.8, true, null),
  ('bonus', '學新料理做給我吃', 1.0, true, null),
  ('bonus', '準備驚喜或禮物', 1.0, true, null),
  ('bonus', '紀念日用心準備', 2.0, true, null),
  ('deduct', '不回訊息', -0.5, false, null),
  ('deduct', '約會遲到', -0.3, false, null),
  ('deduct', '臨時放鴿子', -2.0, false, null),
  ('deduct', '說謊', -3.0, false, null),
  ('deduct', '單純惹我生氣', -5.0, false, null);

insert into rewards (icon, name, cost, market_price) values
  ('🍰', '甜點下午茶', 3, 300),
  ('💆', '全套按摩券', 3, null),
  ('🚗', '當一日司機', 4, null),
  ('🎬', '電影約會之夜', 6, 600),
  ('🐰', '大耳狗喜拿玩偶(中型)', 12, 1200),
  ('💄', 'Dior癮誘唇膏', 15, 1500),
  ('🎨', 'Dior五色眼影盤', 26, 2600),
  ('🌸', 'Miss Dior香水50ml', 39, 3900);
