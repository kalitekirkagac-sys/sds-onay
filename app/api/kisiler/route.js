import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

function yetkiYok() {
  return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
}

export async function GET(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { data, error } = await db()
    .from("people")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ kisiler: data });
}

export async function POST(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const body = await req.json();

  // Toplu ekleme: her satır "Ad Soyad;Unvan" veya "Ad Soyad,Unvan"
  if (body.toplu) {
    const satirlar = String(body.toplu)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const parcalar = s.split(/[;,\t]/).map((p) => p.trim());
        return { ad_soyad: parcalar[0], unvan: parcalar[1] || null, aktif: true };
      })
      .filter((k) => k.ad_soyad);
    if (!satirlar.length)
      return NextResponse.json({ hata: "Geçerli satır bulunamadı" }, { status: 400 });
    const { error } = await db().from("people").insert(satirlar);
    if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, eklenen: satirlar.length });
  }

  if (!body.ad_soyad?.trim())
    return NextResponse.json({ hata: "Ad Soyad zorunlu" }, { status: 400 });
  const { error } = await db().from("people").insert({
    ad_soyad: body.ad_soyad.trim(),
    unvan: body.unvan?.trim() || null,
    aktif: true
  });
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { id, aktif } = await req.json();
  const { error } = await db().from("people").update({ aktif }).eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await db().from("people").delete().eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
