"use client";

import React from "react";
import CryptoReceive from "@/components/crypto-receive"
import { AppShell } from "@/components/app-shell"
import { useLanguage, t } from "@/lib/i18n"

// Next.js 15でparamsをReact.useでアンラップする
export default function ReceivePage({ params }: { params: { id: string } }) {
  const { language } = useLanguage();
  const unwrappedParams = React.use(params as any) as { id: string };
  const id = unwrappedParams.id;
  
  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold">
            {t('common.receive', language)}
          </h1>
          <CryptoReceive transactionId={id} />
        </div>
      </div>
    </AppShell>
  )
}
