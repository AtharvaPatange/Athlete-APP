"use client";

import { useState } from "react";
import Script from "next/script";

export default function GoogleTranslateButton() {
  const [showTranslate, setShowTranslate] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowTranslate((v) => !v)}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-colors"
        style={{ minWidth: 120 }}
      >
        {showTranslate ? "Hide Translator" : "Translate"}
      </button>
      <div
        id="google_translate_element"
        className={showTranslate ? "block fixed top-16 right-4 z-50 bg-white rounded-lg shadow-lg p-2" : "hidden"}
      />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,hi,gu,ta,te,kn,ml,pa,bn,or,as,mr,ne,ur,ar,zh,ja,ko,fr,de,es,pt,ru,it,th,vi,id,ms,tr,pl,sv,da,no,fi,nl,cs,hu,ro,bg,hr,sk,sl,et,lv,lt,el,he,fa,sw,am,yo,ig,ha,zu,xh,af,st,tn,ts,ss,ve,nr,nd',
              layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true
            }, 'google_translate_element');
          }
        `}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}