import { NextResponse } from "next/server";
import { OTURUM_COOKIE, oturumOlustur } from "../../../lib/auth";

export async function POST(req) {
  const { sifre } = await req.json();
  if (!sifre || sifre !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ hata: "Şifre hatalı" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OTURUM_COOKIE, oturumOlustur(), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 12,
    path: "/"
  });
  return res;
}
