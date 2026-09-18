"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnaSayfa() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => router.replace(d.giris ? "/admin" : "/giris"));
  }, [router]);

  return (
    <div className="yetkisiz">
      <div className="kart">
        <p>Yükleniyor…</p>
      </div>
    </div>
  );
}
