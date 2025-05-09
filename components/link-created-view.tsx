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
import { useLanguage, t } from "@/lib/i18n"

export default function LinkCreatedView({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
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
    : t('link.loadingId', language)

  // 共有リンク用の説明テキスト
  const shareDescription = t('link.shareDescription', language).replace('{id}', displayLinkId);

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
            {t('common.back', language)}
          </Button>
          <h2 className="text-lg font-medium">{t('link.created', language)}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {shareDescription}
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
                  {copied ? t('common.copied', language) : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Button className="w-full" onClick={onBack}>
                {t('link.createAnother', language)}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-gray-500">
            {t('link.loading', language)}
          </div>
        )}
      </CardContent>
      <Toaster />
    </Card>
  )
}
