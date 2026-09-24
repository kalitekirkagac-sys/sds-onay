import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula, tokenUret } from "../../../lib/auth";

// Seçili içerik için tüm aktif kişilere link (token) üretir.
// Halihazırda token'ı olanlar için yeni üretmez.
export async function POST(req) {
  if (!oturumDogrula(req))
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  const { content_id, son_gecerlilik, gruplar } = await req.json();

  const { data: icerik } = await db()
    .from("contents")
    .select("id, yayinda")
    .eq("id", content_id)
    .single();
  if (!icerik)
    return NextResponse.json({ hata: "İçerik bulunamadı" }, { status: 404 });

  // Seçilen gruplardaki aktif kişiler (grup seçilmemişse tüm aktif kişiler)
  let kisiler = [];
  if (Array.isArray(gruplar) && gruplar.length) {
    const grupsuzIsteniyor = gruplar.includes("__grupsuz");
    const grupIdleri = gruplar.filter((g) => g !== "__grupsuz");
    let sorgu = db().from("people").select("id, grup_id").eq("aktif", true);
    if (grupIdleri.length) sorgu = sorgu.in("grup_id", grupIdleri);
    const { data } = await sorgu;
    kisiler = data || [];
    if (grupsuzIsteniyor) {
      const { data: grupsuz } = await db()
        .from("people")
        .select("id, grup_id")
        .eq("aktif", true)
        .is("grup_id", null);
      kisiler = [...kisiler, ...(grupsuz || [])];
    }
  } else {
    const { data } = await db().from("people").select("id, grup_id").eq("aktif", true);
    kisiler = data || [];
  }
  const { data: mevcut } = await db()
    .from("tokens")
    .select("person_id")
    .eq("content_id", content_id);

  const olanlar = new Set((mevcut || []).map((t) => t.person_id));
  const eklenecek = (kisiler || [])
    .filter((k) => !olanlar.has(k.id))
    .map((k) => ({
      token: tokenUret(),
      person_id: k.id,
      content_id,
      son_gecerlilik: son_gecerlilik || null
    }));

  if (eklenecek.length) {
    const { error } = await db().from("tokens").insert(eklenecek);
    if (error)
      return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  // Seçili kapsamdaki mevcut tokenların geçerlilik tarihini güncelle
  if (son_gecerlilik && (mevcut || []).length) {
    const hedefKisiIdler = new Set(kisiler.map((k) => k.id));
    if (hedefKisiIdler.size) {
      await db()
        .from("tokens")
        .update({ son_gecerlilik })
        .eq("content_id", content_id)
        .in("person_id", [...hedefKisiIdler]);
    }
  }

  return NextResponse.json({ ok: true, uretilen: eklenecek.length });
}

// İçeriğin token + kişi listesini döndürür
export async function GET(req) {
  if (!oturumDogrula(req))
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  const content_id = new URL(req.url).searchParams.get("content_id");
  const { data, error } = await db()
    .from("tokens")
    .select("token, son_gecerlilik, ilk_acilis, people(ad_soyad, unvan, aktif)")
    .eq("content_id", content_id);
  if (error)
    return NextResponse.json({ hata: error.message }, { status: 500 });

  // Sondaki fazladan slash'ları temizle (//onay/ hatasını önler)
  const taban = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");
  const linkler = (data || []).map((t) => ({
    token: t.token,
    ad_soyad: t.people?.ad_soyad,
    unvan: t.people?.unvan,
    aktif: t.people?.aktif,
    son_gecerlilik: t.son_gecerlilik,
    ilk_acilis: t.ilk_acilis,
    link: `${taban}/onay/${t.token}`
  }));
  return NextResponse.json({ linkler });
}
