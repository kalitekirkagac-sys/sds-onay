import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "degistir-beni";
const COOKIE = "yonetim_oturumu";
const SURE_MS = 1000 * 60 * 60 * 12; // 12 saat

function hmac(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function oturumOlustur() {
  const son = Date.now() + SURE_MS;
  return `${son}.${hmac(String(son))}`;
}

export function oturumGecerliMi(deger) {
  if (!deger || typeof deger !== "string" || !deger.includes(".")) return false;
  const [son, imza] = deger.split(".");
  if (hmac(son) !== imza) return false;
  if (Number(son) < Date.now()) return false;
  return true;
}

export function oturumDogrula(req) {
  return oturumGecerliMi(req.cookies?.get?.(COOKIE)?.value);
}

export const OTURUM_COOKIE = COOKIE;

export function tokenUret() {
  // kısa ama kriptografik olarak rastgele token
  return crypto.randomBytes(9).toString("base64url");
}

export function dogrulamaKoduUret() {
  const r = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ONAY-${r.slice(0, 4)}-${r.slice(4, 8)}`;
}
