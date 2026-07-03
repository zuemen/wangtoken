// 台北時區日期工具（每日上限、streak 都以台北日曆日為準）

export function taipeiDateStr(d: Date = new Date()): string {
  // YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(d);
}

export function taipeiStartOfTodayISO(): string {
  return new Date(`${taipeiDateStr()}T00:00:00+08:00`).toISOString();
}

export function taipeiStartOfDaysAgoISO(days: number): string {
  const start = new Date(`${taipeiDateStr()}T00:00:00+08:00`);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString();
}

/** 最近 n 天（含今天）的台北日期字串，由舊到新 */
export function taipeiLastNDates(n: number): string[] {
  const out: string[] = [];
  const base = new Date(`${taipeiDateStr()}T00:00:00+08:00`);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(taipeiDateStr(d));
  }
  return out;
}
