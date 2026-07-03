import { createClient, SupabaseClient } from "@supabase/supabase-js";

// server 端專用：service-role client（勿在瀏覽器 import）
export function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("缺少 Supabase 環境變數");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
