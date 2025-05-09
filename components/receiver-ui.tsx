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
import { useLanguage, t } from "@/lib/i18n"

export default function ReceiverUI() {
  const { language } = useLanguage();
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
              <h2 className="mb-2 text-xl font-medium">{t('receiver.title', language)}</h2>
              <p className="text-gray-600">{t('receiver.connectPrompt', language)}</p>
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
                    <DialogTitle>{t('receiver.aboutTitle', language)}</DialogTitle>
                    <DialogDescription>
                      {t('receiver.aboutDescription', language)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">{t('receiver.feature1Title', language)}</h4>
                        <p className="text-sm text-gray-500">
                          {t('receiver.feature1Desc', language)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">{t('receiver.feature2Title', language)}</h4>
                        <p className="text-sm text-gray-500">{t('receiver.feature2Desc', language)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">{t('receiver.feature3Title', language)}</h4>
                        <p className="text-sm text-gray-500">{t('receiver.feature3Desc', language)}</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-600" size="lg" onClick={connectWallet}>
              {t('receiver.connectButton', language)}
            </Button>

            <div className="mt-4 text-center text-sm text-gray-500">
              {t('receiver.newUserPrompt', language)}
            </div>
          </>
        ) : !assetClaimed ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{t('receiver.walletConnected', language)}</h2>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <Wallet className="mr-1 h-3 w-3" />
                  {t('receiver.connected', language)}
                </Badge>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-500">{t('receiver.youReceived', language)}</h3>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {mockAsset.amount} {mockAsset.type}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">{t('receiver.from', language)}: {mockAsset.sender}</div>
            </div>

            <Button className="w-full bg-green-500 text-white hover:bg-green-600" size="lg" onClick={claimAsset}>
              {t('receiver.claimAsset', language)}
            </Button>

            <div className="mt-2 text-center text-xs text-gray-500">
              {t('receiver.noGasFees', language)}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-medium">{t('receiver.claimSuccess', language)}</h2>
              <p className="mt-2 text-center text-gray-600">
                {mockAsset.amount} {mockAsset.type} {t('receiver.addedToWallet', language)}
              </p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                {t('receiver.viewWallet', language)}
              </Button>

              <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                {t('receiver.done', language)}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
