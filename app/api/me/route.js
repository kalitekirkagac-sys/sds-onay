import { NextResponse } from "next/server";
import { oturumDogrula } from "../../../lib/auth";

export async function GET(req) {
  return NextResponse.json({ giris: oturumDogrula(req) });
}
