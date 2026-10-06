import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

// Rapor: Sadece bu içerik için token üretilmiş olan kişiler listelenir
export async function GET(req) {
  if (!oturumDogrula(req))
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  const content_id = new URL(req.url).searchParams.get("content_id");

  if (!content_id)
    return NextResponse.json({ hata: "İçerik ID gerekli" }, { status: 400 });

  // 1. Önce bu içerik için üretilmiş tokenleri ve bağlı oldukları kişileri çekelim
  const { data: tokenler, error: e1 } = await db()
    .from("tokens")
    .select("person_id, ilk_acilis, son_gecerlilik, people(ad_soyad, unvan, aktif)")
    .eq("content_id", content_id);

  // 2. Bu içerik için verilmiş onayları çekelim
  const { data: onaylar, error: e2 } = await db()
    .from("approvals")
    .select("person_id, onay_zamani, onay_durumu, dogrulama_kodu")
    .eq("content_id", content_id);

  if (e1 || e2)
    return NextResponse.json(
      { hata: (e1 || e2).message },
      { status: 500 }
    );

  const onayMap = new Map((onaylar || []).map((o) => [o.person_id, o]));

  // 3. Sadece tokeni olan kişileri rapora dönüştürelim
  const rapor = (tokenler || []).map((t) => {
    const o = onayMap.get(t.person_id);
    const kisi = t.people || {};
    return {
      ad_soyad: kisi.ad_soyad,
      unvan: kisi.unvan,
      aktif: kisi.aktif,
      link_var: true,
      ilk_acilis: t.ilk_acilis || null,
      onay_durumu: o ? "ONAYLANDI" : "ONAYLAMADI",
      onay_zamani: o?.onay_zamani || null,
      dogrulama_kodu: o?.dogrulama_kodu || ""
    };
  });

  return NextResponse.json({ rapor });
}