"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// トークン名のマッピング
const TOKEN_SYMBOLS: Record<string, string> = {
  "USDC": "USDC",
  "ETH": "ETH",
  "USDT": "USDT",
  // 必要に応じて他のトークンを追加
}

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

  // トークン名を取得する関数
  const getTokenSymbol = (token: string) => {
    return TOKEN_SYMBOLS[token] || "不明なトークン"
  }

  return (
    <Card className="mt-6 border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="mb-4 text-lg font-medium">受け取り履歴</h2>

        <div className="space-y-4">
          {receivedAssets.map((asset) => (
            <div key={asset.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {getTokenSymbol(asset.token)} {!asset.isNft && asset.amount}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(asset.date)}</div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  受け取り済み
                </Badge>
              </div>
              <div className="mt-2 text-xs text-gray-500">送信者: {asset.sender}</div>
              <div className="mt-1 text-xs text-gray-500">
                ※受け取り時に0.5%の手数料が差し引かれます
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
