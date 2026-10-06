"use client";

import { useEffect, useMemo, useState } from "react";
import RichEditor from "./RichEditor";

// ---------- yardımcılar ----------
function csvIndir(dosyaAdi, basliklar, satirlar) {
  const kac = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const csv =
    "\uFEFF" +
    [basliklar.map(kac).join(";"), ...satirlar.map((r) => r.map(kac).join(";"))].join(
      "\r\n"
    );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = dosyaAdi;
  a.click();
}

const bugunSonu = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

// ---------- ana bileşen ----------
export default function AdminApp() {
  const [sekme, setSekme] = useState("icerikler");
  const [kisiler, setKisiler] = useState([]);
  const [gruplar, setGruplar] = useState([]);
  const [icerikler, setIcerikler] = useState([]);

  async function kisileriYukle() {
    const r = await fetch("/api/kisiler");
    const d = await r.json();
    if (d.kisiler) setKisiler(d.kisiler);
  }
  async function gruplariYukle() {
    const r = await fetch("/api/gruplar");
    const d = await r.json();
    if (d.gruplar) setGruplar(d.gruplar);
  }
  async function icerikleriYukle() {
    const r = await fetch("/api/icerikler");
    const d = await r.json();
    if (d.icerikler) setIcerikler(d.icerikler);
  }

  useEffect(() => {
    kisileriYukle();
    gruplariYukle();
    icerikleriYukle();
  }, []);

  function kisiveGrupYenile() {
    kisileriYukle();
    gruplariYukle();
  }

  async function cikis() {
    await fetch("/api/cikis", { method: "POST" });
    location.href = "/giris";
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div className="satir" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>🏹 SMS Onay Sistemi</h1>
        <button className="btn kucuk kirmizi" onClick={cikis}>
          Çıkış
        </button>
      </div>

      <div className="sekmeler" style={{ marginTop: 16 }}>
        {[
          ["icerikler", "1️⃣ Yayınlar (İçerikler)"],
          ["kisiler", "2️⃣ Gruplar ve Kişiler"],
          ["linkler", "3️⃣ Link Üretimi"],
          ["rapor", "4️⃣ Onay Raporu"]
        ].map(([k, e]) => (
          <div
            key={k}
            className={`sekme ${sekme === k ? "aktif" : ""}`}
            onClick={() => setSekme(k)}
          >
            {e}
          </div>
        ))}
      </div>

      {sekme === "icerikler" && (
        <IceriklerTab icerikler={icerikler} yenile={icerikleriYukle} />
      )}
      {sekme === "kisiler" && (
        <KisilerTab
          kisiler={kisiler}
          gruplar={gruplar}
          yenile={kisiveGrupYenile}
        />
      )}
      {sekme === "linkler" && (
        <LinklerTab icerikler={icerikler} gruplar={gruplar} />
      )}
      {sekme === "rapor" && <RaporTab icerikler={icerikler} />}
    </div>
  );
}

// ---------- KİŞİLER ve GRUPLAR ----------
function KisilerTab({ kisiler, gruplar, yenile }) {
  const [ad, setAd] = useState("");
  const [unvan, setUnvan] = useState("");
  const [seciliGrupIdleri, setSeciliGrupIdleri] = useState([]);
  const [yeniGrup, setYeniGrup] = useState("");
  const [toplu, setToplu] = useState("");
  const [topluGrupIdleri, setTopluGrupIdleri] = useState([]);
  const [mesaj, setMesaj] = useState("");

  // Düzenleme modundaki kişi ID'si ve onun seçili grupları
  const [duzenlenenKisiId, setDuzenlenenKisiId] = useState(null);
  const [duzenleGrupIdleri, setDuzenleGrupIdleri] = useState([]);

  async function grupEkle() {
    if (!yeniGrup.trim()) return;
    const r = await fetch("/api/gruplar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad: yeniGrup })
    });
    const d = await r.json();
    if (d.hata) alert(d.hata);
    setYeniGrup("");
    yenile();
  }

  async function tekEkle(e) {
    e.preventDefault();
    const r = await fetch("/api/kisiler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ad_soyad: ad,
        unvan,
        grup_idleri: seciliGrupIdleri
      })
    });
    const d = await r.json();
    if (d.hata) {
      alert(d.hata);
      return;
    }
    setAd("");
    setUnvan("");
    setSeciliGrupIdleri([]);
    yenile();
  }

 async function topluEkle() {
    const r = await fetch("/api/kisiler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toplu,
        grup_idleri: topluGrupIdleri // Çoklu grup ID'lerini buraya ekledik
      })
    });
    const d = await r.json();
    setMesaj(d.eklenen ? `✅ ${d.eklenen} kişi eklendi.` : d.hata || "Hata");
    setToplu("");
    setTopluGrupIdleri([]);
    yenile();
  }

  return (
    <>
      <div className="kart">
        <h3>📁 Gruplar</h3>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Örnek: SDS03, SDS04, SDS05 (hekimlere paylaşılan analizler), Komite (karar
          metinleri)…
        </p>
        <div className="satir">
          <input
            placeholder="Yeni grup adı (örn. SDS03)"
            value={yeniGrup}
            onChange={(e) => setYeniGrup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), grupEkle())}
          />
          <button className="btn" style={{ flex: 0 }} onClick={grupEkle}>
            Grup Ekle
          </button>
        </div>
        {gruplar.length > 0 && (
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Grup</th>
                <th>Kişi Sayısı</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gruplar.map((g) => (
                <tr key={g.id}>
                  <td><b>{g.ad}</b></td>
                  <td>{g.kisi_sayisi}</td>
                  <td>
                    <button
                      className="btn kucuk kirmizi"
                      onClick={async () => {
                        if (!confirm(`"${g.ad}" grubu silinsin mi?`))
                          return;
                        await fetch(`/api/gruplar?id=${g.id}`, { method: "DELETE" });
                        yenile();
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="kart">
        <h3>➕ Tek Kişi Ekle</h3>
        <form onSubmit={tekEkle}>
          <div className="satir" style={{ marginBottom: 10 }}>
            <input placeholder="Ad Soyad" value={ad} onChange={(e) => setAd(e.target.value)} required />
            <input placeholder="Unvan (örn. Prf. Dr.)" value={unvan} onChange={(e) => setUnvan(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Bağlı Olacağı Gruplar:
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "8px", border: "1px solid var(--cizgi)", borderRadius: "8px", background: "#fff" }}>
              {gruplar.length === 0 ? (
                <span style={{ fontSize: 13, color: "#64748b" }}>Önce grup eklemelisiniz.</span>
              ) : (
                gruplar.map((g) => (
                  <label key={g.id} style={{ display: "flex", gap: "5px", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={seciliGrupIdleri.includes(g.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeciliGrupIdleri([...seciliGrupIdleri, g.id]);
                        } else {
                          setSeciliGrupIdleri(seciliGrupIdleri.filter((id) => id !== g.id));
                        }
                      }}
                      style={{ width: 16, height: 16, accentColor: "var(--mavi)" }}
                    />
                    {g.ad}
                  </label>
                ))
              )}
            </div>
          </div>
          <button className="btn">Kişiyi Ekle</button>
        </form>
      </div>

      <div className="kart">
        <h3>📋 Toplu Ekleme</h3>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Her satıra bir kişi: <code>Ad Soyad;Unvan</code> (Excel'den kopyalayabilirsiniz).
          Aşağıdan birden fazla grup seçerseniz eklenenler o grupların tümüne kaydedilir.
        </p>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Eklenecek Gruplar:
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "8px", border: "1px solid var(--cizgi)", borderRadius: "8px", background: "#fff" }}>
            {gruplar.map((g) => (
              <label key={g.id} style={{ display: "flex", gap: "5px", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={topluGrupIdleri.includes(g.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTopluGrupIdleri([...topluGrupIdleri, g.id]);
                    } else {
                      setTopluGrupIdleri(topluGrupIdleri.filter((id) => id !== g.id));
                    }
                  }}
                  style={{ width: 16, height: 16, accentColor: "var(--mavi)" }}
                />
                {g.ad}
              </label>
            ))}
          </div>
        </div>
        <textarea rows={5} value={toplu} onChange={(e) => setToplu(e.target.value)}
          placeholder={"Ahmet Yılmaz;Prf. Dr.\nAyşe Demir;Doç. Dr."} />
        <button className="btn" style={{ marginTop: 8 }} onClick={topluEkle}>
          Toplu Ekle
        </button>
        {mesaj && <span style={{ marginLeft: 10 }}>{mesaj}</span>}
      </div>

      <div className="kart">
        <h3>👥 Kişi Listesi ({kisiler.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Unvan</th>
              <th>Gruplar</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {kisiler.map((k) => {
              const isDuzenleniyor = duzenlenenKisiId === k.id;
              return (
                <tr key={k.id}>
                  <td>{k.ad_soyad}</td>
                  <td>{k.unvan || "-"}</td>
                  <td>
                    {isDuzenleniyor ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {gruplar.map((g) => (
                            <label key={g.id} style={{ display: "flex", gap: "4px", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={duzenleGrupIdleri.includes(g.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDuzenleGrupIdleri([...duzenleGrupIdleri, g.id]);
                                  } else {
                                    setDuzenleGrupIdleri(duzenleGrupIdleri.filter((id) => id !== g.id));
                                  }
                                }}
                              />
                              {g.ad}
                            </label>
                          ))}
                        </div>
                        <div>
                          <button
                            className="btn kucuk yesil"
                            onClick={async () => {
                              await fetch("/api/kisiler", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: k.id, grup_idleri: duzenleGrupIdleri })
                              });
                              setDuzenlenenKisiId(null);
                              yenile();
                            }}
                          >
                            Kaydet
                          </button>{" "}
                          <button className="btn kucuk" onClick={() => setDuzenlenenKisiId(null)}>İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {k.gruplar && k.gruplar.length > 0 ? (
                          k.gruplar.map((g) => (
                            <span key={g.id} style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                              {g.ad}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>Grupsuz</span>
                        )}
                        <button
                          className="btn kucuk"
                          style={{ padding: "2px 6px", fontSize: "11px", marginLeft: "auto" }}
                          onClick={() => {
                            setDuzenlenenKisiId(k.id);
                            setDuzenleGrupIdleri(k.gruplar ? k.gruplar.map((g) => g.id) : []);
                          }}
                        >
                          Düzenle
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`durum ${k.aktif ? "onaylandi" : "onaylamadi"}`}>
                      {k.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn kucuk sari"
                      onClick={async () => {
                        await fetch("/api/kisiler", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: k.id, aktif: !k.aktif })
                        });
                        yenile();
                      }}
                    >
                      {k.aktif ? "Pasifleştir" : "Aktifleştir"}
                    </button>{" "}
                    <button
                      className="btn kucuk kirmizi"
                      onClick={async () => {
                        if (!confirm(`${k.ad_soyad} silinsin mi?`)) return;
                        await fetch(`/api/kisiler?id=${k.id}`, { method: "DELETE" });
                        yenile();
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- İÇERİKLER ----------
function IceriklerTab({ icerikler, yenile }) {
  const [secili, setSecili] = useState(null);
  const [baslik, setBaslik] = useState("");
  const [donem, setDonem] = useState("");
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (secili) {
      setBaslik(secili.baslik);
      setDonem(secili.donem || "");
      setHtml(secili.html || "");
    }
  }, [secili]);

  async function kaydet(e) {
    e.preventDefault();
    const r = await fetch("/api/icerikler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: secili?.id, baslik, donem, html })
    });
    const d = await r.json();
    if (d.id) {
      setSecili({ id: d.id, baslik, donem, html });
      yenile();
      alert("✅ Kaydedildi.");
    } else alert(d.hata);
  }

  return (
    <>
      <div className="kart">
        <div className="satir" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>
            {secili ? "✏️ İçeriği Düzenle" : "📝 Yeni Aylık Paylaşım"}
          </h3>
          <div>
            {secili && (
              <button className="btn kucuk sari" onClick={() => setSecili(null)}>
                Yeni İçerik
              </button>
            )}
          </div>
        </div>
        <form onSubmit={kaydet} style={{ marginTop: 12 }}>
          <div className="satir">
            <input placeholder="Başlık (örn. Eylül 2026 – Enfeksiyon Kontrol Analizi)"
              value={baslik} onChange={(e) => setBaslik(e.target.value)} />
            <input placeholder="Dönem (örn. 2026-09)" value={donem}
              onChange={(e) => setDonem(e.target.value)} style={{ maxWidth: 160 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <RichEditor value={html} onChange={setHtml} />
          </div>
          <button className="btn" style={{ marginTop: 12 }}>💾 Kaydet</button>
        </form>
      </div>

      <div className="kart">
        <h3>📚 İçerik Listesi ({icerikler.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Dönem</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {icerikler.map((c) => (
              <tr key={c.id}>
                <td>{c.baslik}</td>
                <td>{c.donem || "-"}</td>
                <td>
                  <span className={`durum ${c.yayinda ? "onaylandi" : "acilmamis"}`}>
                    {c.yayinda ? "Yayında" : "Taslak"}
                  </span>
                </td>
                <td>
                  <button className="btn kucuk" onClick={() => setSecili(c)}>
                    Düzenle
                  </button>{" "}
                  <button
                    className={`btn kucuk ${c.yayinda ? "sari" : "yesil"}`}
                    onClick={async () => {
                      await fetch("/api/icerikler", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: c.id, yayinda: !c.yayinda })
                      });
                      yenile();
                    }}
                  >
                    {c.yayinda ? "Yayından Al" : "Yayınla"}
                  </button>{" "}
                  <button
                    className="btn kucuk kirmizi"
                    onClick={async () => {
                      if (!confirm("İçerik ve tüm linkleri silinsin mi?")) return;
                      await fetch(`/api/icerikler?id=${c.id}`, { method: "DELETE" });
                      if (secili?.id === c.id) setSecili(null);
                      yenile();
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- LİNK ÜRETİMİ ----------
function LinklerTab({ icerikler, gruplar }) {
  const [contentId, setContentId] = useState("");
  const [gecerlilik, setGecerlilik] = useState(bugunSonu());
  const [seciliGruplar, setSeciliGruplar] = useState({});
  const [linkler, setLinkler] = useState([]);
  const [mesaj, setMesaj] = useState("");

  async function yukle() {
    if (!contentId) return;
    const r = await fetch(`/api/linkler?content_id=${contentId}`);
    const d = await r.json();
    setLinkler(d.linkler || []);
  }

  useEffect(() => {
    setLinkler([]);
    setMesaj("");
    if (contentId) yukle();
  }, [contentId]);

  const yayindaOlan = icerikler.filter((c) => c.yayinda);
  const icerik = icerikler.find((c) => c.id === contentId);

  function smsMetni(l) {
    return (
      `Sayın ${l.unvan ? l.unvan + " " : ""}${l.ad_soyad},` +
      ` "${icerik?.baslik || "Aylık Paylaşım"}" konulu içeriğimizi okuyup kontrol etmeniz ve onay vermeniz için` +
      ` lütfen aşağıdaki bağlantıya tıklayınız:` +
      `\n${l.link}` +
      `\n(Onayınız sistemde tarih ve doğrulama kodu ile kayıt altına alınacaktır.)`
    );
  }

  function grupToggle(id) {
    setSeciliGruplar((eski) => ({ ...eski, [id]: !eski[id] }));
  }

  function hepsiniSec(kontrol) {
    const yeni = {};
    gruplar.forEach((g) => (yeni[g.id] = kontrol));
    yeni["__grupsuz"] = kontrol;
    setSeciliGruplar(yeni);
  }

  async function uret() {
    const secilenler = Object.entries(seciliGruplar)
      .filter(([, secili]) => secili)
      .map(([id]) => id);
    if (!secilenler.length) {
      alert("En az bir grup seçin.");
      return;
    }
    const r = await fetch("/api/linkler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_id: contentId,
        son_gecerlilik: gecerlilik,
        gruplar: secilenler
      })
    });
    const d = await r.json();
    setMesaj(
      d.uretilen !== undefined
        ? `✅ ${d.uretilen} yeni link üretildi, geçerlilik tarihi güncellendi.`
        : d.hata
    );
    yukle();
  }

  return (
    <>
      <div className="kart">
        <h3>🔗 Toplu Link Üretimi</h3>
        {yayindaOlan.length === 0 ? (
          <p style={{ color: "#dc2626" }}>
            ⚠️ Önce "Yayınlar" sekmesinden bir içeriği yayınlayın.
          </p>
        ) : (
          <>
            <div className="satir">
              <select value={contentId} onChange={(e) => setContentId(e.target.value)}>
                <option value="">— İçerik seçin —</option>
                {yayindaOlan.map((c) => (
                  <option key={c.id} value={c.id}>{c.baslik}</option>
                ))}
              </select>
              <input type="date" value={gecerlilik} onChange={(e) => setGecerlilik(e.target.value)}
                title="Son geçerlilik tarihi" style={{ maxWidth: 180 }} />
              <button className="btn" style={{ flex: 0 }} onClick={uret} disabled={!contentId}>
                Token Üret
              </button>
            </div>

            {contentId && (
              <div style={{ marginTop: 14 }}>
                <div className="satir" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <b style={{ fontSize: 14 }}>🎯 Hangi gruplara paylaşılsın?</b>
                  <div>
                    <button className="btn kucuk" onClick={() => hepsiniSec(true)}>Tümünü Seç</button>{" "}
                    <button className="btn kucuk sari" onClick={() => hepsiniSec(false)}>Temizle</button>
                  </div>
                </div>
                {gruplar.length === 0 ? (
                  <p style={{ color: "#d97706", fontSize: 14 }}>
                    ⚠️ Henüz grup yok — "Gruplar ve Kişiler" sekmesinden grup ekleyin.
                  </p>
                ) : (
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 15 }}>
                    {gruplar.map((g) => (
                      <label key={g.id} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!seciliGruplar[g.id]}
                          onChange={() => grupToggle(g.id)}
                          style={{ width: 18, height: 18, accentColor: "#1d4ed8" }}
                        />
                        {g.ad} ({g.kisi_sayisi})
                      </label>
                    ))}
                    <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!seciliGruplar["__grupsuz"]}
                        onChange={() => grupToggle("__grupsuz")}
                        style={{ width: 18, height: 18, accentColor: "#1d4ed8" }}
                      />
                      Grupsuz kişiler
                    </label>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {mesaj && <p>{mesaj}</p>}
      </div>

      {linkler.length > 0 && (
        <div className="kart">
          <div className="satir" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>SMS Linkleri ({linkler.length})</h3>
            <div>
			<button
                className="btn kucuk kirmizi"
                style={{ marginRight: 8 }}
                onClick={async () => {
                  if (!confirm("⚠️ Bu içerik için üretilmiş TÜM linkler (tokenler) silinecek. Emin misiniz?")) return;
                  const r = await fetch(`/api/linkler?content_id=${contentId}`, {
                    method: "DELETE"
                  });
                  const d = await r.json();
                  if (d.ok) {
                    setLinkler([]);
                    alert("✅ Tüm linkler başarıyla silindi.");
                  } else {
                    alert(d.hata || "Bir hata oluştu");
                  }
                }}
              >
                🗑️ Tüm Linkleri Sil
              </button>
              <button
                className="btn kucuk"
                onClick={() => navigator.clipboard.writeText(linkler.map((l) => smsMetni(l)).join("\n\n---\n\n"))}
              >
                📋 Tümünü Kopyala (SMS)
              </button>{" "}
              <button
                className="btn kucuk yesil"
                onClick={() =>
                  csvIndir(
                    "sms-linkleri.csv",
                    ["Ad Soyad", "Unvan", "SMS Linki", "Son Geçerlilik"],
                    linkler.map((l) => [l.ad_soyad, l.unvan, l.link, l.son_gecerlilik || ""])
                  )
                }
              >
                ⬇️ CSV İndir
              </button>
            </div>
          </div>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Kişi</th>
                <th>Link</th>
                <th>İlk Açılış</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linkler.map((l) => (
                <tr key={l.token}>
                  <td>{l.ad_soyad}{l.aktif ? "" : " (pasif)"}</td>
                  <td style={{ wordBreak: "break-all", fontSize: 12 }}>{l.link}</td>
                  <td>{l.ilk_acilis ? new Date(l.ilk_acilis).toLocaleString("tr-TR") : "—"}</td>
                  <td>
                    <button className="btn kucuk"
                      onClick={() => navigator.clipboard.writeText(smsMetni(l))}>
                      📩 SMS
                    </button>{" "}
                    <button className="btn kucuk sari"
                      onClick={() => navigator.clipboard.writeText(l.link)}>
                      Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------- RAPOR ----------
function RaporTab({ icerikler }) {
  const [contentId, setContentId] = useState("");
  const [rapor, setRapor] = useState([]);
  const [icerik, setIcerik] = useState(null);

  useEffect(() => {
    if (!contentId) return setRapor([]);
    fetch(`/api/rapor?content_id=${contentId}`)
      .then((r) => r.json())
      .then((d) => setRapor(d.rapor || []));
    setIcerik(icerikler.find((c) => c.id === contentId) || null);
  }, [contentId]);

  const ozet = useMemo(() => {
    const onay = rapor.filter((r) => r.onay_durumu === "ONAYLANDI").length;
    return { onay, toplam: rapor.length };
  }, [rapor]);

  return (
    <>
      <div className="kart">
        <h3>📊 Onay Raporu</h3>
        <select value={contentId} onChange={(e) => setContentId(e.target.value)}>
          <option value="">— İçerik seçin —</option>
          {icerikler.map((c) => (
            <option key={c.id} value={c.id}>{c.baslik}</option>
          ))}
        </select>
        {contentId && (
          <p style={{ marginTop: 10 }}>
            Onaylayan: <b style={{ color: "#15803d" }}>{ozet.onay}</b> / {ozet.toplam}{" "}
            &nbsp;•&nbsp; Bekleyen:{" "}
            <b style={{ color: "#dc2626" }}>{ozet.toplam - ozet.onay}</b>
          </p>
        )}
      </div>

      {rapor.length > 0 && (
        <div className="kart">
          <div className="satir" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn kucuk yesil"
              onClick={() => window.open(`/rapor/${contentId}`, "_blank")}
            >
              📄 PDF / Kanıt Sayfası
            </button>{" "}
            <button
              className="btn kucuk yesil"
              onClick={() =>
                csvIndir(
                  `onay-raporu-${icerik?.donem || contentId}.csv`,
                  ["Tarih-Saat", "Kişi", "Onay Durumu", "Doğrulama Kodu"],
                  rapor.map((r) => [
                    r.onay_zamani
                      ? new Date(r.onay_zamani).toLocaleString("tr-TR")
                      : "",
                    `${r.unvan ? r.unvan + " " : ""}${r.ad_soyad}`,
                    r.onay_durumu,
                    r.dogrulama_kodu
                  ])
                )
              }
            >
              ⬇️ CSV İndir
            </button>
          </div>
          <table style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Tarih-Saat</th>
                <th>Kişi</th>
                <th>Onay Durumu</th>
                <th>Doğrulama Kodu</th>
              </tr>
            </thead>
            <tbody>
              {rapor.map((r, i) => (
                <tr key={i}>
                  <td>
                    {r.onay_zamani
                      ? new Date(r.onay_zamani).toLocaleString("tr-TR")
                      : "—"}
                  </td>
                  <td>{r.unvan ? `${r.unvan} ${r.ad_soyad}` : r.ad_soyad}</td>
                  <td>
                    <span className={`durum ${r.onay_durumu === "ONAYLANDI" ? "onaylandi" : "onaylamadi"}`}>
                      {r.onay_durumu === "ONAYLANDI"
                        ? "✔ ONAYLANDI"
                        : r.link_var
                        ? "BEKLİYOR"
                        : "LİNK YOK"}
                    </span>
                  </td>
                  <td>{r.dogrulama_kodu || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}