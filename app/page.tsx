import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SenderUI from "@/components/sender-ui"
import TransactionHistory from "@/components/transaction-history"
import { ConnectAndSIWE } from '../components/ConnectAndSIWE'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Crypto Transfer</h1>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="send">
            <SenderUI />
          </TabsContent>
          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        </Tabs>

      </div>
    </main>
  )
}
