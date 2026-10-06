import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

function yetkiYok() {
  return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
}

export async function GET(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  
  // Kişileri ve ara tablo üzerinden bağlı oldukları grupları çekiyoruz
  const { data, error } = await db()
    .from("people")
    .select("*, group_members(group_id, groups(id, ad))")
    .order("created_at", { ascending: true });
    
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  const kisiler = (data || []).map((k) => {
    const gruplar = (k.group_members || []).map((gm) => gm.groups).filter(Boolean);
    return {
      ...k,
      gruplar: gruplar, // Kişinin ait olduğu grup nesneleri dizisi [{id, ad}, ...]
      grup_idleri: gruplar.map((g) => g.id) // Frontend formları için kolaylık
    };
  });

  return NextResponse.json({ kisiler });
}

export async function POST(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const body = await req.json();

  // Toplu ekleme (Ad Soyad;Unvan şeklinde)
  if (body.toplu) {
    const satirlar = String(body.toplu)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const parcalar = s.split(/[;,\t]/).map((p) => p.trim());
        return {
          ad_soyad: parcalar[0],
          unvan: parcalar[1] || null,
          aktif: true
        };
      })
      .filter((k) => k.ad_soyad);

    if (!satirlar.length)
      return NextResponse.json({ hata: "Geçerli satır bulunamadı" }, { status: 400 });

    const { data: eklenenKisiler, error } = await db()
      .from("people")
      .insert(satirlar)
      .select("id");

    if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

    // Toplu eklemede seçilen çoklu grup ID'lerini group_members tablosuna kaydediyoruz
    const grupIdleri = body.grup_idleri || (body.grup_id ? [body.grup_id] : []);
    if (grupIdleri.length > 0 && eklenenKisiler?.length > 0) {
      const baglantilar = [];
      eklenenKisiler.forEach((kisi) => {
        grupIdleri.forEach((gId) => {
          baglantilar.push({
            person_id: kisi.id,
            group_id: gId
          });
        });
      });
      await db().from("group_members").insert(baglantilar);
    }

    return NextResponse.json({ ok: true, eklenen: satirlar.length });
  }

  // Tekil kişi ekleme
  if (!body.ad_soyad?.trim())
    return NextResponse.json({ hata: "Ad Soyad zorunlu" }, { status: 400 });

  const { data: yeniKisi, error: kisiHata } = await db()
    .from("people")
    .insert({
      ad_soyad: body.ad_soyad.trim(),
      unvan: body.unvan?.trim() || null,
      aktif: true
    })
    .select()
    .single();

  if (kisiHata) return NextResponse.json({ hata: kisiHata.message }, { status: 500 });

  // Seçilen grup ID'leri (Dizi olarak gelmeli, örn: grup_idleri: [id1, id2])
  const grupIdleri = body.grup_idleri || (body.grup_id ? [body.grup_id] : []);
  if (grupIdleri.length > 0) {
    const baglantilar = grupIdleri.map((gId) => ({
      person_id: yeniKisi.id,
      group_id: gId
    }));
    const { error: grupHata } = await db().from("group_members").insert(baglantilar);
    if (grupHata) return NextResponse.json({ hata: grupHata.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { id, aktif, grup_idleri } = await req.json();

  if (!id) return NextResponse.json({ hata: "ID gerekli" }, { status: 400 });

  const guncelleme = {};
  if (aktif !== undefined) guncelleme.aktif = aktif;

  if (Object.keys(guncelleme).length > 0) {
    const { error } = await db().from("people").update(guncelleme).eq("id", id);
    if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  // Eğer gruplar güncellendiyse ara tabloyu senkronize et
  if (grup_idleri !== undefined && Array.isArray(grup_idleri)) {
    // Önce mevcut grup bağlantılarını sil
    await db().from("group_members").delete().eq("person_id", id);

    // Yeni seçilenleri ekle
    if (grup_idleri.length > 0) {
      const yeniBaglantilar = grup_idleri.map((gId) => ({
        person_id: id,
        group_id: gId
      }));
      const { error: eklemeHata } = await db().from("group_members").insert(yeniBaglantilar);
      if (eklemeHata) return NextResponse.json({ hata: eklemeHata.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const id = new URL(req.url).searchParams.get("id");
  
  // Cascade sayesinde group_members kayıtları otomatik silinir
  const { error } = await db().from("people").delete().eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  
  return NextResponse.json({ ok: true });
}