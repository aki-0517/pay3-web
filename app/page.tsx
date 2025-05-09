"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SenderUI from "@/components/sender-ui"
import HistoryTransactions from "@/components/history-transactions"
import { ConnectAndSIWE } from '../components/ConnectAndSIWE'
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { useLanguage, t } from "@/lib/i18n"

export default function Home() {
  const { language } = useLanguage();

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold">
            {t('common.send', language)}
          </h1>

          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send">{t('common.send', language)}</TabsTrigger>
              <TabsTrigger value="history">{t('common.history', language)}</TabsTrigger>
            </TabsList>
            <TabsContent value="send">
              <SenderUI />
            </TabsContent>
            <TabsContent value="history">
              <Suspense fallback={<div>{t('common.loading', language)}</div>}>
                <HistoryTransactions />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
