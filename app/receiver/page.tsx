import ReceiverUI from "@/components/receiver-ui"

export default function ReceiverPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Claim Crypto</h1>
        <ReceiverUI />
      </div>
    </main>
  )
}
