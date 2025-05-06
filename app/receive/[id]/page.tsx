import CryptoReceive from "@/components/crypto-receive"

export default function ReceivePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Crypto Transfer</h1>
        <CryptoReceive transactionId={params.id} />
      </div>
    </main>
  )
}
