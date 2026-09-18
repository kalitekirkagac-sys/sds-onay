import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

// Rapor: kişiler + token açılma bilgisi + onay bilgisi
export async function GET(req) {
  if (!oturumDogrula(req))
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  const content_id = new URL(req.url).searchParams.get("content_id");

  const { data: kisiler, error: e1 } = await db()
    .from("people")
    .select("id, ad_soyad, unvan, aktif")
    .order("ad_soyad");
  const { data: onaylar, error: e2 } = await db()
    .from("approvals")
    .select("person_id, onay_zamani, onay_durumu, dogrulama_kodu")
    .eq("content_id", content_id);
  const { data: tokenlar, error: e3 } = await db()
    .from("tokens")
    .select("person_id, ilk_acilis, son_gecerlilik")
    .eq("content_id", content_id);

  if (e1 || e2 || e3)
    return NextResponse.json(
      { hata: (e1 || e2 || e3).message },
      { status: 500 }
    );

  const onayMap = new Map((onaylar || []).map((o) => [o.person_id, o]));
  const tokenMap = new Map((tokenlar || []).map((t) => [t.person_id, t]));

  const rapor = (kisiler || []).map((k) => {
    const o = onayMap.get(k.id);
    const t = tokenMap.get(k.id);
    return {
      ad_soyad: k.ad_soyad,
      unvan: k.unvan,
      aktif: k.aktif,
      link_var: !!t,
      ilk_acilis: t?.ilk_acilis || null,
      onay_durumu: o ? "ONAYLANDI" : "ONAYLAMADI",
      onay_zamani: o?.onay_zamani || null,
      dogrulama_kodu: o?.dogrulama_kodu || ""
    };
  });

  return NextResponse.json({ rapor });
}
