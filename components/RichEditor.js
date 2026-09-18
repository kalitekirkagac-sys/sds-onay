"use client";

import { useRef, useEffect } from "react";

export default function RichEditor({ value, onChange }) {
  const ref = useRef(null);
  const isUpdating = useRef(false);

  // Dışarıdan gelen ilk değeri içeri aktar
  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML && !isUpdating.current) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  function uygula(komut, deger = null) {
    ref.current?.focus();
    document.execCommand(komut, false, deger);
    degisti();
  }

  function degisti() {
    if (ref.current) {
      isUpdating.current = true;
      onChange?.(ref.current.innerHTML);
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }

  // Editörün içindeki her şeyi tamamen temizler
  function icerigiTemizle() {
    if (ref.current) {
      ref.current.innerHTML = "";
      degisti();
    }
  }

  function tabloEkle() {
    const html =
      '<table class="custom-table"><tbody>' +
      '<tr><th>Başlık 1</th><th>Başlık 2</th><th>Başlık 3</th></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      "</tbody></table><p><br></p>";
    uygula("insertHTML", html);
  }

  function satirEkle() {
    const secim = window.getSelection();
    const hucre = secim?.anchorNode?.parentElement?.closest?.("td,th");
    const satir = hucre?.closest("tr");
    if (!satir) return alert("Önce tablodaki bir hücreye tıklayın.");
    const sutunSayisi = satir.children.length;
    const yeni = document.createElement("tr");
    for (let i = 0; i < sutunSayisi; i++) {
      const td = document.createElement("td");
      td.innerHTML = "&nbsp;";
      yeni.appendChild(td);
    }
    satir.after(yeni);
    degisti();
  }

  function resimEkle() {
    const url = prompt("Resim adresi (URL):");
    if (url) uygula("insertImage", url);
  }

  return (
    <div className="rich-editor-wrapper">
      {/* Şık ve Modern Araç Çubuğu */}
      <div className="editor-araclar">
        <div className="toolbar-group">
          <button title="Kalın" onClick={(e) => { e.preventDefault(); uygula("bold"); }}><b>B</b></button>
          <button title="İtalik" onClick={(e) => { e.preventDefault(); uygula("italic"); }}><i>I</i></button>
          <button title="Altı Çizili" onClick={(e) => { e.preventDefault(); uygula("underline"); }}><span style={{textDecoration: 'underline'}}>U</span></button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button onClick={(e) => { e.preventDefault(); uygula("formatBlock", "<h2>"); }}>Başlık</button>
          <button onClick={(e) => { e.preventDefault(); uygula("formatBlock", "<p>"); }}>Paragraf</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button title="Madde İşaretli Liste" onClick={(e) => { e.preventDefault(); uygula("insertUnorderedList"); }}>• Liste</button>
          <button title="Numaralı Liste" onClick={(e) => { e.preventDefault(); uygula("insertOrderedList"); }}>1. Liste</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button onClick={(e) => { e.preventDefault(); tabloEkle(); }}>▦ Tablo</button>
          <button onClick={(e) => { e.preventDefault(); satirEkle(); }}>+ Satır</button>
          <button onClick={(e) => { e.preventDefault(); resimEkle(); }}>🖼 Resim</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="btn-danger" onClick={(e) => { e.preventDefault(); icerigiTemizle(); }}>Temizle</button>
        </div>
      </div>

      {/* Düzenleme Alanı */}
      <div
        ref={ref}
        className="editor-alan"
        contentEditable
        suppressContentEditableWarning
        onInput={degisti}
        onBlur={degisti}
      />
      
      <div className="editor-footer">
        <span>İpucu: Word veya Excel&apos;den içerik kopyalayıp doğrudan yapıştırabilirsiniz.</span>
      </div>
    </div>
  );
}