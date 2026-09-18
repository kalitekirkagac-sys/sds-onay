import { db } from "../../../lib/db";
import { oturumDogrula } from "../../../lib/auth";
import { headers } from "next/headers";
import PrintButton from "../../../components/PrintButton";

export const metadata = { title: "Rapor Çıktısı" };

// Admin-only yazdırma/PDF sayfası: analiz içeriği + Kanıt-Onaylar tablosu
export default async function RaporCikti({ params }) {
  // 1. headers() artık bir Promise olduğu için await kullanıyoruz
  const headersList = await headers();
  const cookieStore = headersList.get("cookie") || "";
  
  const eslesme = cookieStore.match(/yonetim_oturumu=([^;]+)/);
  const girildi =
    !!eslesme && oturumDogrula({ cookies: { get: () => ({ value: decodeURIComponent(eslesme[1]) }) } });

  if (!girildi) {
    return (
      <div className="yetkisiz">
        <div className="kart">
          <h2>🔒 Yetkisiz</h2>
          <p>Bu sayfayı görüntülemek için yönetim paneline giriş yapmalısınız.</p>
          <a className="btn" href="/giris">Giriş Yap</a>
        </div>
      </div>
    );
  }

  // 2. params da bir Promise olduğu için await ediyoruz
  const { id } = await params;
  
  const { data: icerik } = await db()
    .from("contents")
    .select("*")
    .eq("id", id)
    .single();

  if (!icerik) {
    return (
      <div className="yetkisiz">
        <div className="kart"><h2>İçerik bulunamadı</h2></div>
      </div>
    );
  }

  const { data: onaylar } = await db()
    .from("approvals")
    .select("onay_zamani, dogrulama_kodu, people(unvan, ad_soyad)")
    .eq("content_id", id)
    .order("onay_zamani", { ascending: true });

  const onaySayisi = (onaylar || []).length;

  return (
    <div className="yazdir-kapsayici">
      <div className="yazdir-araclar no-print">
        <PrintButton />
        <a className="btn kucuk" href="/admin">← Panele Dön</a>
      </div>

      <h1 style={{ textAlign: "center", fontSize: 20 }}>{icerik.baslik}</h1>
      {icerik.donem && (
        <p style={{ textAlign: "center", color: "#475569", marginTop: -6 }}>
          Dönem: {icerik.donem}
        </p>
      )}

      <div className="icerik-alani" style={{ padding: 0, border: "none" }}
        dangerouslySetInnerHTML={{ __html: icerik.html }} />

      <h2 style={{ fontSize: 16, marginTop: 30, borderTop: "2px solid #1d4ed8", paddingTop: 10 }}>
        Kanıt – Onaylar ({onaySayisi} kişi)
      </h2>
      {onaySayisi === 0 ? (
        <p style={{ color: "#64748b" }}>Henüz onay kaydı yok.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Kişi</th>
              <th>Onay Tarihi - Saati</th>
              <th>Doğrulama Kodu</th>
            </tr>
          </thead>
          <tbody>
            {(onaylar || []).map((o, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {o.people?.unvan ? `${o.people.unvan} ` : ""}
                  {o.people?.ad_soyad}
                </td>
                <td>{new Date(o.onay_zamani).toLocaleString("tr-TR")}</td>
                <td>{o.dogrulama_kodu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ fontSize: 11, color: "#64748b", marginTop: 24 }}>
        Bu rapor SDS Onay Sistemi üzerinden {new Date().toLocaleString("tr-TR")} tarihinde
        oluşturulmuştur. Onaylar dijital ortamda tanımlanmış kişiye özel token doğrulamalı bağlantılar
        ile verilmiştir.
      </p>
    </div>
  );
}