"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import QRCode from "@/components/qr-code"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Mock transaction data
const transactions = [
  {
    id: "tx1",
    token: "USDC",
    amount: "10.00",
    status: "pending",
    date: "2023-05-06T10:30:00Z",
    link: "https://crypto.link/s/abc123",
    receiverAddress: "",
    txHash: "",
    isNft: false,
  },
  {
    id: "tx2",
    token: "ETH",
    amount: "0.05",
    status: "claimed",
    date: "2023-05-05T14:20:00Z",
    link: "https://crypto.link/s/def456",
    receiverAddress: "0x5a6b...7c8d",
    txHash: "0xabcd...1234",
    isNft: false,
  },
  {
    id: "tx3",
    token: "CryptoPunk #1234",
    amount: "1",
    status: "expired",
    date: "2023-05-01T09:15:00Z",
    link: "https://crypto.link/s/ghi789",
    receiverAddress: "",
    txHash: "",
    isNft: true,
    nftImage: "/placeholder.svg?height=50&width=50",
  },
]

export default function TransactionHistory() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [selectedTx, setSelectedTx] = useState<string | null>(null)

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleClaim = (txId: string) => {
    // Mock claiming functionality
    console.log(`Claiming transaction ${txId}`)
    // In a real app, this would trigger a wallet transaction
  }

  const openDetails = (txId: string) => {
    setSelectedTx(txId)
  }

  const closeDetails = () => {
    setSelectedTx(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Unclaimed
          </Badge>
        )
      case "claimed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Claimed
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSelectedTransaction = () => {
    return transactions.find((tx) => tx.id === selectedTx)
  }

  return (
    <>
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-medium">Transaction History</h2>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <Collapsible
                key={tx.id}
                open={openItems[tx.id]}
                onOpenChange={() => toggleItem(tx.id)}
                className="rounded-lg border bg-white"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => openDetails(tx.id)}
                >
                  <div className="flex items-center gap-3">
                    {tx.isNft && (
                      <img src={tx.nftImage || "/placeholder.svg"} alt="NFT" className="h-10 w-10 rounded-md" />
                    )}
                    <div>
                      <div className="font-medium">
                        {tx.token} {!tx.isNft && tx.amount}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tx.status)}
                    <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                        {openItems[tx.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent className="border-t bg-gray-50 p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500">Link</div>
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm">{tx.link}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(tx.link)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {tx.receiverAddress && (
                      <div>
                        <div className="text-xs font-medium text-gray-500">Receiver</div>
                        <div className="text-sm">{tx.receiverAddress}</div>
                      </div>
                    )}

                    {tx.txHash && (
                      <div>
                        <div className="text-xs font-medium text-gray-500">Transaction</div>
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm">{tx.txHash}</div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {tx.status === "pending" && (
                      <Button
                        className="mt-2 w-full bg-green-500 text-white hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClaim(tx.id)
                        }}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedTx !== null} onOpenChange={closeDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4">
              {(() => {
                const tx = getSelectedTransaction()
                if (!tx) return null

                return (
                  <>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Token</h3>
                          <div className="font-medium">
                            {tx.token} {!tx.isNft && tx.amount}
                          </div>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-500">Date</h3>
                        <div className="text-sm">{formatDate(tx.date)}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Link</h3>
                      <div className="mt-1 flex items-center gap-2 rounded-md border bg-gray-50 p-2">
                        <div className="truncate text-sm">{tx.link}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(tx.link)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <QRCode value={tx.link} size={150} />
                    </div>

                    {tx.receiverAddress && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Receiver</h3>
                        <div className="text-sm">{tx.receiverAddress}</div>
                      </div>
                    )}

                    {tx.txHash && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Transaction Hash</h3>
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm">{tx.txHash}</div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {tx.status === "pending" && (
                      <Button
                        className="w-full bg-green-500 text-white hover:bg-green-600"
                        onClick={() => handleClaim(tx.id)}
                      >
                        Claim
                      </Button>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
