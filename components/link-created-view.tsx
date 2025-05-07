"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ChevronLeft } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useSearchParams } from "next/navigation"
import { formatLinkId } from "@/lib/link-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LinkCreatedView({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const [shareLinkUrl, setShareLinkUrl] = useState<string>("")
  const searchParams = useSearchParams()
  const linkId = searchParams.get('id')
  
  useEffect(() => {
    if (linkId) {
      // ID取得、受け取りURLを生成
      const baseUrl = window.location.origin
      const receiveLink = `${baseUrl}/receive/${encodeURIComponent(linkId)}`
      setShareLinkUrl(receiveLink)
    }
  }, [linkId])

  const copyToClipboard = () => {
    if (shareLinkUrl) {
      navigator.clipboard.writeText(shareLinkUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // リンクIDの表示用フォーマット（短縮表示）
  const displayLinkId = linkId ? 
    (linkId.startsWith('0x') ? formatLinkId(linkId as `0x${string}`) : linkId) 
    : '読み込み中...'

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <h2 className="text-lg font-medium">リンク作成完了！</h2>
          <p className="mt-1 text-sm text-gray-500">
            このリンクを共有して、資金を送ります（ID: {displayLinkId}）
          </p>
        </div>

        {shareLinkUrl ? (
          <>
            <div className="mb-4 flex items-center justify-center">
              <QRCodeSVG value={shareLinkUrl} size={180} />
            </div>

            <div className="mb-6 overflow-hidden rounded-md border bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div className="overflow-x-auto whitespace-nowrap text-sm">
                  {shareLinkUrl}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="ml-2 shrink-0"
                >
                  {copied ? "コピー済み" : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" onClick={onBack}>
                別のリンクを作成
              </Button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-gray-500">
            リンク情報を読み込み中...
          </div>
        )}
      </CardContent>
      <Toaster />
    </Card>
  )
}
