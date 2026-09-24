import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";

function yetkiYok() {
  return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
}

export async function GET(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { data, error } = await db()
    .from("groups")
    .select("*, people(id)")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({
    gruplar: (data || []).map((g) => ({ id: g.id, ad: g.ad, kisi_sayisi: (g.people || []).length }))
  });
}

export async function POST(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const { ad } = await req.json();
  if (!ad?.trim())
    return NextResponse.json({ hata: "Grup adı zorunlu" }, { status: 400 });
  const { error } = await db().from("groups").insert({ ad: ad.trim() });
  if (error)
    return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!oturumDogrula(req)) return yetkiYok();
  const id = new URL(req.url).searchParams.get("id");
  // Kişiler grupsuz kalır (FK on delete set null)
  const { error } = await db().from("groups").delete().eq("id", id);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
