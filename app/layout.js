export const metadata = {
  title: "Kalite Onay Sistemi",
  description: "Aylık kalite analiz ve karar paylaşımları onay sistemi"
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
