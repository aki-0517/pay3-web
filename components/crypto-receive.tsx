"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Info, Check, Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Mock transaction data - in a real app, this would be fetched from an API
const mockTransactions = {
  abc123: {
    id: "abc123",
    token: "USDC",
    amount: "10.00",
    sender: "0x1a2b...3c4d",
    senderName: "Alex",
    status: "pending",
    date: "2023-05-06T10:30:00Z",
    isNft: false,
  },
  def456: {
    id: "def456",
    token: "ETH",
    amount: "0.05",
    sender: "0x5a6b...7c8d",
    senderName: "Taylor",
    status: "pending",
    date: "2023-05-05T14:20:00Z",
    isNft: false,
  },
  ghi789: {
    id: "ghi789",
    token: "CryptoPunk #1234",
    amount: "1",
    sender: "0x9e8f...2a3b",
    senderName: "Jordan",
    status: "pending",
    date: "2023-05-01T09:15:00Z",
    isNft: true,
    nftImage: "/placeholder.svg?height=200&width=200",
  },
}

interface CryptoReceiveProps {
  transactionId: string
}

export default function CryptoReceive({ transactionId }: CryptoReceiveProps) {
  const [walletConnected, setWalletConnected] = useState(false)
  const [assetClaimed, setAssetClaimed] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const tx = mockTransactions[transactionId as keyof typeof mockTransactions]
      if (tx) {
        setTransaction(tx)
      } else {
        setError("Transaction not found")
      }
      setLoading(false)
    }, 500)
  }, [transactionId])

  const connectWallet = () => {
    // Mock wallet connection
    setWalletConnected(true)
  }

  const claimAsset = () => {
    // Mock asset claiming
    setAssetClaimed(true)
  }

  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-medium text-red-500">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-medium">Transaction Not Found</h2>
          <p className="mt-2 text-gray-600">The link you followed may be expired or invalid.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        {!walletConnected ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-medium">{transaction.senderName} sent you crypto!</h2>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold">
                  {transaction.isNft ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={transaction.nftImage || "/placeholder.svg?height=150&width=150"}
                        alt="NFT"
                        className="mb-2 h-32 w-32 rounded-md"
                      />
                      {transaction.token}
                    </div>
                  ) : (
                    <>
                      {transaction.amount} {transaction.token}
                    </>
                  )}
                </div>
              </div>
              <p className="mt-4 text-gray-600">Connect your wallet to claim it</p>
            </div>

            <div className="absolute right-4 top-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5 text-gray-500" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About Smart Wallet</DialogTitle>
                    <DialogDescription>
                      Coinbase Smart Wallet is a self-custodial wallet that lets you securely store and manage your
                      crypto assets. It uses passkeys or biometric authentication for a seamless experience without seed
                      phrases.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">Easy to Use</h4>
                        <p className="text-sm text-gray-500">
                          No seed phrases to remember, just use your device's biometrics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">Secure</h4>
                        <p className="text-sm text-gray-500">Your keys are stored securely on your device</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">No Gas Fees</h4>
                        <p className="text-sm text-gray-500">We cover gas fees for your transactions</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-600" size="lg" onClick={connectWallet}>
              Connect with Coinbase Smart Wallet
            </Button>

            <div className="mt-4 text-center text-sm text-gray-500">
              New to crypto? No problem! You can create a wallet in seconds.
            </div>
          </>
        ) : !assetClaimed ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Wallet Connected</h2>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <Wallet className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-500">You've Received</h3>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {transaction.isNft ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={transaction.nftImage || "/placeholder.svg?height=150&width=150"}
                        alt="NFT"
                        className="mb-2 h-32 w-32 rounded-md"
                      />
                      {transaction.token}
                    </div>
                  ) : (
                    <>
                      {transaction.amount} {transaction.token}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                From: {transaction.senderName} ({transaction.sender})
              </div>
            </div>

            <Button className="w-full bg-green-500 text-white hover:bg-green-600" size="lg" onClick={claimAsset}>
              Claim Asset
            </Button>

            <div className="mt-2 text-center text-xs text-gray-500">
              No gas fees required. We'll cover that for you.
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-medium">Asset Claimed Successfully!</h2>
              <p className="mt-2 text-center text-gray-600">
                {transaction.isNft ? transaction.token : `${transaction.amount} ${transaction.token}`} has been added to
                your wallet
              </p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                View in Wallet
              </Button>

              <Button className="w-full bg-green-500 text-white hover:bg-green-600">Done</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
