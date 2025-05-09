"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage, t } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const { language } = useLanguage();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Subject 4.png" 
                alt={t('app.title', language)} 
                width={150} 
                height={40} 
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
} 