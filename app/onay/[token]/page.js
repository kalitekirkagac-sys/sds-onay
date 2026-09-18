import { db } from "../../../lib/db";
import OnayClient from "../../../components/OnayClient";

export const metadata = { title: "Onay Ekranı" };

export default async function OnaySayfasi({ params }) {
  // DÜZELTME BURADA: params artık bir Promise olduğundan await ile çözümleniyor
  const { token } = await params;

  const { data: t } = await db()
    .from("tokens")
    .select(
      "token, person_id, content_id, son_gecerlilik, ilk_acilis, people(ad_soyad, unvan), contents(baslik, html, yayinda)"
    )
    .eq("token", token)
    .single();

  const gecerli =
    t &&
    t.people &&
    t.contents &&
    t.contents.yayinda &&
    (!t.son_gecerlilik ||
      new Date(t.son_gecerlilik + "T23:59:59") >= new Date());

  // Geçersiz token → yetkisiz ekran
  if (!gecerli) return <OnayClient durum="yetkisiz" />;

  // İlk açılış zamanını kaydet (rapor için)
  if (!t.ilk_acilis) {
    await db().from("tokens").update({ ilk_acilis: new Date().toISOString() }).eq("token", token);
  }

  // Zaten onaylanmış mı?
  const { data: onay } = await db()
    .from("approvals")
    .select("dogrulama_kodu, onay_zamani")
    .eq("person_id", t.person_id)
    .eq("content_id", t.content_id)
    .single();

  return (
    <OnayClient
      durum="ok"
      token={token}
      adSoyad={t.people.ad_soyad}
      unvan={t.people.unvan}
      baslik={t.contents.baslik}
      html={t.contents.html}
      onayliMi={!!onay}
      kod={onay?.dogrulama_kodu || null}
    />
  );
}