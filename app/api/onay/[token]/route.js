import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { dogrulamaKoduUret } from "../../../../lib/auth";

// Hekim onayı: token geçerliyse onayı kaydeder, doğrulama kodu döner.
export async function POST(req, { params }) {
  // 🔥 DÜZELTME BURADA: params nesnesini await ile çözümlüyoruz
  const { token } = await params;
  
  if (!token)
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 403 });

  const { data: t } = await db()
    .from("tokens")
    .select("token, person_id, content_id, son_gecerlilik, ilk_acilis")
    .eq("token", token)
    .single();

  const gecersiz =
    !t ||
    (t.son_gecerlilik && new Date(t.son_gecerlilik + "T23:59:59") < new Date());

  if (gecersiz)
    return NextResponse.json({ hata: "Yetkisiz erişim" }, { status: 403 });

  // Zaten onaylanmış mı?
  const { data: mevcut } = await db()
    .from("approvals")
    .select("dogrulama_kodu, onay_zamani")
    .eq("person_id", t.person_id)
    .eq("content_id", t.content_id)
    .single();

  if (mevcut) {
    return NextResponse.json({
      zaten_onaylandi: true,
      dogrulama_kodu: mevcut.dogrulama_kodu,
      onay_zamani: mevcut.onay_zamani
    });
  }

  const kod = dogrulamaKoduUret();
  const { error } = await db().from("approvals").insert({
    person_id: t.person_id,
    content_id: t.content_id,
    onay_durumu: "ONAYLANDI",
    dogrulama_kodu: kod
  });
  if (error)
    return NextResponse.json({ hata: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, dogrulama_kodu: kod });
}