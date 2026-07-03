export function fmtPoints(p: number): string {
  const n = Number(p);
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

export function fmtNTD(points: number): string {
  return `NT$${Math.round(Number(points) * 100).toLocaleString("en-US")}`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
