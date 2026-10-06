"use client";

import { useState, useEffect, useMemo } from "react";

export default function PortalSayfasi() {
  const [arama, setArama] = useState("");
  const [tumListe, setTumListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function veriCek() {
      try {
        const res = await fetch("/api/portal");
        const data = await res.json();
        setTumListe(data.liste || []);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    }
    veriCek();
  }, []);

  const filtrelenmisListe = useMemo(() => {
    if (!arama.trim()) return [];
    
    const aranan = arama.trim().toLocaleLowerCase("tr-TR");
    
    return tumListe.filter((kisi) => {
      const adSoyadKucuk = (kisi.ad_soyad || "").toLocaleLowerCase("tr-TR");
      return adSoyadKucuk.includes(aranan);
    });
  }, [arama, tumListe]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#1e3a8a", margin: "0 0 8px 0" }}>🏥 Kırkağaç DH - Onay Portalı</h2>
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          Lütfen adınızı veya soyadınızı yazarak aratın ve onay bekleyen içeriklerinize ulaşın.
        </p>
      </div>

      <div style={{ position: "sticky", top: "10px", zIndex: 10, background: "#f1f5f9", padding: "8px 0" }}>
        <input
          type="text"
          placeholder="🔍 Ad veya soyad yazın (Örn: Yazıcı)..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: "16px",
            borderRadius: "10px",
            border: "2px solid #cbd5e1",
            outline: "none",
            background: "#fff",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
          }}
          autoFocus
        />
      </div>

      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {yukleniyor && <p style={{ textAlign: "center", color: "#64748b" }}>Yükleniyor...</p>}

        {!arama.trim() && !yukleniyor && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
            <p style={{ fontSize: "15px", margin: 0 }}>👆 Yukarıdaki arama kutusuna adınızı yazmaya başlayın.</p>
          </div>
        )}

        {arama.trim() && !yukleniyor && filtrelenmisListe.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <p style={{ color: "#64748b", margin: 0 }}>Aktif onay bekleyen kaydınız bulunamadı.</p>
          </div>
        )}

        {filtrelenmisListe.map((kisi) => (
          <div
            key={kisi.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>
                {kisi.unvan ? `${kisi.unvan} ` : ""}
                {kisi.ad_soyad}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>ONAYLANACAK İÇERİKLER:</span>
              {kisi.linkler.map((l, idx) => (
                <a
                  key={idx}
                  href={l.link}
                  style={{
                    display: "block",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#1d4ed8",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  📄 {l.baslik}
                  {l.donem && <span style={{ display: "block", fontSize: "12px", color: "#64748b", fontWeight: "normal", marginTop: "2px" }}>Dönem: {l.donem}</span>}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}