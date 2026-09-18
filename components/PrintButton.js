"use client";

export default function PrintButton() {
  return (
    <button className="btn yesil" type="button" onClick={() => window.print()}>
      📄 PDF Olarak Kaydet
    </button>
  );
}
