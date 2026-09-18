# 🏹 SDS SMS ile Onay Sistemi

Aylık sds analiz ve karar metinlerini SMS ile gönderilen token'lı linklerle
hekimlere ulaştırıp "Okudum, onaylıyorum" onayı toplayan web uygulaması.

## Özellikler
- Yönetim paneli: Kişi ekleme (tek/Toplu), aylık zengin metin içerik (tablo, resim destekli)
- Kişi + içerik bazlı tekil token link üretimi, toplu CSV çıktısı
- Geçersiz/süresi dolmuş linkte "🔒 Yetkisiz Erişim" ekranı
- Onay sayfası: "Okudum, onaylıyorum" butonu **en üstte**, içerik altında
- Kayıt: tarih-saat, kişi, onay durumu, benzersiz doğrulama kodu
- Rapor sekmesi + CSV (Excel) indirme

## Kurulum

### 1) Supabase (veritabanı — ücretsiz)
1. supabase.com → yeni proje oluştur.
2. SQL Editor → `supabase/schema.sql` içeriğini çalıştır.
3. Settings → API → **Project URL** ve **service_role key** değerlerini al.

### 2) Projeyi çalıştır (yerel)
```bash
cd sds-onay
npm install
copy .env.local.example .env.local   # (Windows) değerleri doldurun
npm run dev
```
Tarayıcı: http://localhost:3000 → yönetim şifrenizle giriş yapın.

### 3) GitHub + Vercel (yayın)
1. GitHub'da boş repo aç, bu klasörü yükle:
   ```bash
   git init && git add . && git commit -m "ilk sürüm"
   git remote add origin https://github.com/KULLANICI/sds-onay.git
   git push -u origin main
   ```
2. vercel.com → GitHub ile giriş → "Add New Project" → bu repoyu seç.
3. Environment Variables bölümüne `.env.local` içindeki 5 değeri gir
   (PUBLIC_URL = https://proje-adiniz.vercel.app olacak).
4. Deploy → hazır. Linkler bu adrese göre üretilir.

## Kullanım Akışı
1. **Kişiler** sekmesi → komite üyelerini ve hekimleri ekle (Excel'den kopyala-yapıştır destekli).
2. **İçerikler** → aylık analizi/kararı yaz veya Word'den kopyala → **Yayınla**.
3. **Link Üretimi** → içeriği seç, son geçerlilik tarihini belirle → **Token Üret** → CSV indir->PDF indir kanıtlı.
4. CSV'deki linkleri kurum SMS programından hekimlere gönder.
5. **Onay Raporu** → kim onayladı, ne zaman, doğrulama kodu → CSV indir.

## Güvenlik Notları
- Token'lar kriptografik rastgele; kişi + içerik + dönem bazlı geçerli.
- Tüm tablolar RLS ile korunur; sadece sunucu (service key) erişir.
- Yönetim paneli şifre korumalı, oturum imzalı (12 saat).
- KVKK: SMS'te kişisel bilgi taşımayın; link yalnızca rastgele token içerir.
