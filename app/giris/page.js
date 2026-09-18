"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Giris() {
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const router = useRouter();

  async function girisYap(e) {
    e.preventDefault();
    setBekliyor(true);
    setHata("");
    const r = await fetch("/api/giris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sifre })
    });
    setBekliyor(false);
    if (r.ok) router.push("/admin");
    else setHata("Şifre hatalı.");
  }

  return (
    <div className="yetkisiz">
      <form className="kart" onSubmit={girisYap} style={{ minWidth: 320 }}>
        <h2>🔐 Yönetim Girişi</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Kalite Onay Sistemi yönetim paneli
        </p>
        <input
          type="password"
          placeholder="Yönetici şifresi"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          autoFocus
        />
        {hata && <p style={{ color: "#dc2626", fontSize: 14 }}>{hata}</p>}
        <button className="btn" style={{ width: "100%", marginTop: 12 }} disabled={bekliyor}>
          {bekliyor ? "Giriliyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
