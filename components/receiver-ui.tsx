"use client"

import { useState } from "react"
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

export default function ReceiverUI() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [assetClaimed, setAssetClaimed] = useState(false)

  // Mock data for the received asset
  const mockAsset = {
    type: "USDC",
    amount: "10.00",
    sender: "0x1a2b...3c4d",
  }

  const connectWallet = () => {
    // Mock wallet connection
    setWalletConnected(true)
  }

  const claimAsset = () => {
    // Mock asset claiming
    setAssetClaimed(true)
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        {!walletConnected ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-medium">You've received crypto!</h2>
              <p className="text-gray-600">Connect your wallet to claim it</p>
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
                  {mockAsset.amount} {mockAsset.type}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">From: {mockAsset.sender}</div>
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
                {mockAsset.amount} {mockAsset.type} has been added to your wallet
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
