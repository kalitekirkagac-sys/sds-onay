"use client";

import { useState } from "react";

export default function OnayClient({
  durum,
  token,
  adSoyad,
  unvan,
  baslik,
  html,
  onayliMi,
  kod
}) {
  const [onaylandi, setOnaylandi] = useState(!!onayliMi);
  const [kodum, setKodum] = useState(kod);
  const [kutucuk, setKutucuk] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState("");

  // ---- YETKİSİZ EKRAN ----
  if (durum === "yetkisiz") {
    return (
      <div className="yetkisiz">
        <div className="kart">
          <div className="ikon">🔒</div>
          <h2>Yetkisiz Erişim</h2>
          <p style={{ color: "#64748b" }}>
            Bu bağlantı geçersiz ya da süresi dolmuş.
            <br />
            Lütfen kalite birimiyle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  // ---- ONAY KAYDET ----
  async function onayla() {
    setBekliyor(true);
    setHata("");
    const r = await fetch(`/api/onay/${token}`, { method: "POST" });
    const d = await r.json();
    setBekliyor(false);
    if (!r.ok) {
      setHata(d.hata || "Bir hata oluştu.");
      return;
    }
    setOnaylandi(true);
    setKodum(d.dogrulama_kodu);
  }

  return (
    <div className="onay-kapsayici">
      {/* ÜST BANT: ONAY BUTONU EN ÜSTTE */}
      <div className="onay-bant">
        <p className="baslik">{baslik}</p>
        <p className="kisi">
          Sayın {unvan ? unvan + " " : ""}
          {adSoyad}
        </p>

        {onaylandi ? (
          <div>
            <p style={{ color: "#15803d", fontWeight: 700, margin: "0 0 8px" }}>
              ✔ Teşekkürler, onayınız kaydedildi.
            </p>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>Doğrulama Kodunuz:</p>
            <div className="kod-kutusu">{kodum}</div>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              Bu kodu not alabilir veya ekran görüntüsünü saklayabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="onay-satiri">
            <label>
              <input
                type="checkbox"
                checked={kutucuk}
                onChange={(e) => setKutucuk(e.target.checked)}
              />
              Okudum, inceledim ve onaylıyorum.
            </label>
            <button className="btn yesil" disabled={!kutucuk || bekliyor} onClick={onayla}>
              {bekliyor ? "Kaydediliyor…" : "✅ Onaylıyorum"}
            </button>
          </div>
        )}
        {hata && <p style={{ color: "#dc2626", marginTop: 8 }}>{hata}</p>}
      </div>

      {/* İÇERİK ALANI */}
      <div className="icerik-alani" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
