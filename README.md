# 胖呆積點器 💞

情侶點數平台：女友做好事加分、做壞事扣分，點數可以兌換獎品。1 分 = NT$100。

## 技術棧

- Next.js 14（App Router + TypeScript + Tailwind CSS）
- Supabase：Postgres（資料）、Storage（照片，私有 bucket `proofs`）、Realtime（雙端同步）
- 部署目標：Vercel

所有寫入與照片簽發都走 Next.js Route Handlers（server 端 service-role key）；瀏覽器只用 anon key 訂閱 Realtime 當 refetch 訊號，不直接寫 DB。

## 一、Supabase 建置

1. 到 [supabase.com](https://supabase.com) 建立免費專案。
2. 跑 migration（二選一）：
   - **SQL Editor**：打開專案的 SQL Editor，貼上 `supabase/migrations/0001_init.sql` 全部內容執行。
   - **Supabase CLI**：
     ```bash
     supabase link --project-ref <你的 project ref>
     supabase db push
     ```
3. 確認 Storage 出現私有 bucket `proofs`（migration 已自動建立；若沒有，到 Storage → New bucket，名稱 `proofs`，**不要**勾 Public）。
4. 確認 Database → Replication → `supabase_realtime` publication 已包含 `entries` / `rewards` / `presets` / `wishes`（migration 已加入）。

## 二、環境變數

複製 `.env.example` 為 `.env.local` 並填入：

| 變數 | 說明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上 → service_role key（**保密**） |
| `COUPLE_CODE` | 情侶通行碼（全站閘門，兩人共用） |
| `ADMIN_PIN` | 管理者 PIN（管理後台） |
| `SESSION_SECRET` | cookie 簽章密鑰，隨機長字串（`openssl rand -hex 32`） |

## 三、本機開發

```bash
npm install
npm run dev
```

打開 http://localhost:3000 → 輸入通行碼即可使用。

## 四、Vercel 部署

1. 專案推上 GitHub。
2. Vercel → New Project → 匯入該 repo（框架自動偵測 Next.js，不用改設定）。
3. 在 Vercel 的 Environment Variables 填入上表全部 6 個變數。
4. Deploy。完成後手機加入主畫面即可當 App 用。

## 頁面

| 路徑 | 說明 |
| --- | --- |
| `/` | 總覽：餘額大卡、本週加減分長條圖、帳本（篩選、照片、狀態） |
| `/rewards` | 兌換所：獎品牆（餘額不足鎖定）、兌換紀錄（待出貨/已完成）、願望清單 |
| `/gf` | 女友專區：好事快速按鈕（每日上限）、提案、關心事件回報 |
| `/admin` | 管理後台（PIN）：快速記帳、審核、CRUD、出貨、關心提醒、CSV 匯出、重置 |

## 設計要點

- **餘額** = `entries` 中 `status='approved'` 的 points 總和；所有數字 `numeric(6,1)`，顯示一位小數。
- **兌換防競態**：Postgres function `redeem_reward` 內用 `pg_advisory_xact_lock` 序列化，餘額不足 raise exception，並發也不會超扣。
- **每日上限**：server 端以台北時區當日計數檢查。
- **Streak**：近 7 天每天都有「乖乖聽話一天」核准紀錄且本週未領過 → 自動 +1.0「連續7天乖乖聽話🔥」+ 慶祝動畫。
- **關心事件**：「意外受傷」「傷害自己」是 0 分的 `kind='care'` 紀錄，不扣分；管理後台顯示關心提醒；30 天內 2 次以上「傷害自己」會溫和顯示關懷文字與安心專線 1925。
- **照片**：client 壓縮 ≤1MB → 上傳私有 bucket → 讀取時 server 簽發 1 小時 signed URL。
- **安全**：RLS 全開、anon 只有 select（供 Realtime）；寫入一律走 server 端 service role；閘門與管理者皆為 httpOnly HMAC 簽章 cookie（90 天 / 24 小時）。
