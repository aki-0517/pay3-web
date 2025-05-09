"use client";

import { useLanguage, Language } from "@/lib/i18n";
import { useState } from "react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none"
      >
        {language === 'en' ? '🇺🇸 English' : '🇯🇵 日本語'}
        <svg
          className="w-4 h-4 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
          <div className="py-1">
            <button
              className={`${
                language === 'en' ? 'bg-gray-100' : ''
              } w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50`}
              onClick={() => changeLanguage('en')}
            >
              🇺🇸 English
            </button>
            <button
              className={`${
                language === 'ja' ? 'bg-gray-100' : ''
              } w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50`}
              onClick={() => changeLanguage('ja')}
            >
              🇯🇵 日本語
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 