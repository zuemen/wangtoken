// HMAC-SHA256 簽章 cookie（Web Crypto，edge 與 node 皆可用）
const te = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64);
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(payload));
  return toB64Url(new Uint8Array(sig));
}

export const GATE_COOKIE = "lp_gate";
export const ADMIN_COOKIE = "lp_admin";
export const GATE_MAX_AGE = 90 * 24 * 60 * 60; // 90 天
export const ADMIN_MAX_AGE = 24 * 60 * 60; // 24 小時

export async function createToken(scope: string, maxAgeSec: number): Promise<string> {
  const secret = process.env.SESSION_SECRET || "";
  const payload = toB64Url(
    te.encode(JSON.stringify({ s: scope, exp: Date.now() + maxAgeSec * 1000 }))
  );
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyToken(token: string | undefined, scope: string): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET || "";
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const expected = await sign(payload, secret);
    if (expected !== sig) return false;
    const data = JSON.parse(fromB64Url(payload));
    return data.s === scope && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
