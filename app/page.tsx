import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SenderUI from "@/components/sender-ui"
import HistoryTransactions from "@/components/history-transactions"
import { ConnectAndSIWE } from '../components/ConnectAndSIWE'
import { Suspense } from "react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">暗号通貨送金</h1>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">送金</TabsTrigger>
            <TabsTrigger value="history">履歴</TabsTrigger>
          </TabsList>
          <TabsContent value="send">
            <SenderUI />
          </TabsContent>
          <TabsContent value="history">
            <Suspense fallback={<div>読み込み中...</div>}>
              <HistoryTransactions />
            </Suspense>
          </TabsContent>
        </Tabs>

      </div>
    </main>
  )
}
