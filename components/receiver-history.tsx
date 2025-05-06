"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock received assets data
const receivedAssets = [
  {
    id: "rx1",
    token: "USDC",
    amount: "10.00",
    date: "2023-05-06T10:30:00Z",
    sender: "0x1a2b...3c4d",
    txHash: "0xabcd...1234",
    isNft: false,
  },
  {
    id: "rx2",
    token: "ETH",
    amount: "0.05",
    date: "2023-05-01T14:20:00Z",
    sender: "0x5a6b...7c8d",
    txHash: "0xefgh...5678",
    isNft: false,
  },
]

export default function ReceiverHistory() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="mt-6 border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="mb-4 text-lg font-medium">Received Assets</h2>

        <div className="space-y-4">
          {receivedAssets.map((asset) => (
            <div key={asset.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {asset.token} {!asset.isNft && asset.amount}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(asset.date)}</div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Received
                </Badge>
              </div>
              <div className="mt-2 text-xs text-gray-500">From: {asset.sender}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
