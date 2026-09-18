import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

function yetkiYok() {
  return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
}

export async function GET(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { data, error } = await db()
    .from("contents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ icerikler: data });
}

export async function POST(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { id, baslik, donem, html } = await req.json();
  if (!baslik?.trim())
    return NextResponse.json({ hata: "Başlık zorunlu" }, { status: 400 });

  if (id) {
    const { error } = await db()
      .from("contents")
      .update({ baslik: baslik.trim(), donem: donem || null, html: html || "" })
      .eq("id", id);
    if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const { data, error } = await db()
    .from("contents")
    .insert({ baslik: baslik.trim(), donem: donem || null, html: html || "" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { id, yayinda } = await req.json();
  const { error } = await db()
    .from("contents")
    .update({ yayinda })
    .eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await db().from("contents").delete().eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
