import CryptoReceive from "@/components/crypto-receive"

// Next.js 15では、paramsがPromiseになりました
export default async function ReceivePage({ params }: { params: Promise<{ id: string }> }) {
  // paramsをawaitしてからidを取得
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Crypto Transfer</h1>
        <CryptoReceive transactionId={id} />
      </div>
    </main>
  )
}
