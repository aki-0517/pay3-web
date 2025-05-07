"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QRCodeSVG } from 'qrcode.react'
import { Copy, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface LinkCreatedViewProps {
  link: string
  onBack: () => void
}

export default function LinkCreatedView({ link, onBack }: LinkCreatedViewProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link copied to clipboard",
        duration: 2000,
      })
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err)
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium">送金リンク生成完了</h2>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <QRCodeSVG value={link} size={200} />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 bg-transparent border-none focus:outline-none text-sm"
            />
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            このリンクを送金先の相手に共有してください
          </p>
        </div>
      </CardContent>
      <Toaster />
    </Card>
  )
}
