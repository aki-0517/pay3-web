"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Share2, ArrowLeft } from "lucide-react"
import QRCode from "@/components/qr-code"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface LinkCreatedViewProps {
  link: string
  onBack: () => void
}

export default function LinkCreatedView({ link, onBack }: LinkCreatedViewProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copied to clipboard",
      duration: 2000,
    })
  }

  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Crypto Transfer Link",
          text: "I've sent you some crypto. Claim it here:",
          url: link,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      copyToClipboard()
    }
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <Button variant="ghost" size="sm" className="mb-4 flex items-center gap-1 px-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h2 className="mb-4 text-center text-lg font-medium">Link Created</h2>

        <div className="mb-6 flex items-center gap-2 rounded-md border bg-gray-50 p-3">
          <div className="truncate text-sm">{link}</div>
          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 flex justify-center">
          <QRCode value={link} size={200} />
        </div>

        <Button className="w-full" onClick={shareLink} variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </CardContent>
      <Toaster />
    </Card>
  )
}
