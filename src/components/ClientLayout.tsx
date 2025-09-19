"use client";

import GoogleTranslateButton from "@/components/GoogleTranslateButton";
import ChatbotPopup from "@/components/ChatbotPopup";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleTranslateButton />
      <ChatbotPopup />
      {children}
    </>
  );
}