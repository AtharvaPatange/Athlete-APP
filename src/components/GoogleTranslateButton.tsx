
"use client";

import { useState, useRef, useEffect } from "react";
import Script from "next/script";

export default function GoogleTranslateButton() {
  const [showTranslate, setShowTranslate] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [moved, setMoved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize position on client side
  useEffect(() => {
    setIsClient(true);
    setPosition({ 
      x: window.innerWidth - 104, 
      y: window.innerHeight - 104 
    });
  }, []);

  // Update position on window resize
  useEffect(() => {
    if (!isClient) return;
    
    function handleResize() {
      setPosition(pos => ({
        x: Math.min(pos.x, window.innerWidth - 80),
        y: Math.min(pos.y, window.innerHeight - 80)
      }));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]);

  // Drag logic
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      if (dragStart && !moved) {
        const dx = Math.abs(e.clientX - dragStart.x);
        const dy = Math.abs(e.clientY - dragStart.y);
        if (dx > 3 || dy > 3) setMoved(true);
      }
    }
    function onMouseUp(e: MouseEvent) {
      setDragging(false);
      if (!moved) {
        setShowTranslate(v => !v);
      }
      setMoved(false);
      setDragStart(null);
    }
    if (dragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    } else {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, offset, dragStart, moved]);

  // Close popover on outside click
  useEffect(() => {
    if (!showTranslate) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowTranslate(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTranslate]);

  return (
    <>
      {/* Only render when client-side is ready */}
      {isClient && (
        <>
          {/* Floating round button bottom right */}
          <button
            ref={buttonRef}
            className="fixed z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-move border border-gray-200"
            style={{
              left: position.x,
              top: position.y,
              background: '#ffffff',
              color: '#000',
              position: 'fixed',
            }}
            aria-label="Translate"
            onMouseDown={e => {
              setDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
              const rect = buttonRef.current?.getBoundingClientRect();
              setOffset({
                x: e.clientX - (rect?.left ?? 0),
                y: e.clientY - (rect?.top ?? 0),
              });
            }}
          >
            {/* Speaking emoji */}
            <span className="text-xl">🗣️</span>
          </button>
          {/* Popover for language selector */}
          <div
            ref={popoverRef}
            id="google_translate_element"
            className={showTranslate ? "block fixed z-50 bg-white rounded-xl shadow-2xl p-3 border border-gray-200 min-w-[120px]" : "hidden"}
            style={{
              left: position.x,
              top: position.y - 80,
              minWidth: 120,
              maxWidth: 220,
              position: 'fixed',
            }}
          />
          {/* Hide Google logo in the widget and style dropdown */}
          {showTranslate && (
            <style>{`
              .goog-logo-link, .goog-te-gadget-icon { display: none !important; }
              .goog-te-gadget {
                font-size: 11px !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .goog-te-combo {
                font-size: 11px !important;
                padding: 1px 4px !important;
                height: 22px !important;
                min-width: 80px !important;
                border-radius: 5px !important;
                border: 1px solid #e5e7eb !important;
                background: #f8fafc !important;
                margin: 0 auto !important;
                display: block !important;
              }
              .goog-te-banner-frame.skiptranslate { display: none !important; }
              #google_translate_element { min-width: 0 !important; text-align: center; }
            `}</style>
          )}
        </>
      )}
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,hi,gu,ta,te,kn,ml,pa,bn,or,as,mr,ne,ur,sa',
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
