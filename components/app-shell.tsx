"use client";

import { ReactNode, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { Header } from "./header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { language } = useLanguage();
  
  // 言語設定が変わったときにdocumentのlang属性を更新
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
} 