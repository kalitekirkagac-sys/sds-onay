import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req) {
  // Tüm aktif kişileri, tokenleri ve yayındaki içerikleri çekiyoruz
  const { data, error } = await db()
    .from("people")
    .select("id, ad_soyad, unvan, aktif, tokens(token, son_gecerlilik, contents(id, baslik, donem, yayinda))")
    .eq("aktif", true)
    .order("ad_soyad");

  if (error) {
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  const taban = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");

  // Sadece aktif linki olan kişileri listeye hazırlayalım
  const liste = (data || [])
    .map((k) => ({
      id: k.id,
      ad_soyad: k.ad_soyad,
      unvan: k.unvan,
      linkler: (k.tokens || [])
        .filter((t) => t.contents && t.contents.yayinda)
        .map((t) => ({
          baslik: t.contents.baslik,
          donem: t.contents.donem,
          son_gecerlilik: t.son_gecerlilik,
          link: `${taban}/onay/${t.token}`
        }))
    }))
    .filter((k) => k.linkler.length > 0);

  return NextResponse.json({ liste });
}