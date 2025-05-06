"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Wallet, Plus, LogOut } from "lucide-react"
import LinkCreatedView from "@/components/link-created-view"
import { useConnect, useAccount, usePublicClient, useSignMessage, useDisconnect } from "wagmi"
import { SiweMessage, generateNonce } from "siwe"
import { cbWalletConnector } from "@/wagmi"
import type { Hex } from "viem"

export default function SenderUI() {
  const [selectedToken, setSelectedToken] = useState("")
  const [amount, setAmount] = useState("")
  const [linkCreated, setLinkCreated] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [signature, setSignature] = useState<Hex | undefined>(undefined)
  const [message, setMessage] = useState<SiweMessage | undefined>(undefined)
  const [valid, setValid] = useState<boolean | undefined>(undefined)

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const { connect } = useConnect({
    mutation: {
      onSuccess: async (data) => {
        try {
          setVerifying(true)
          const address = data.accounts[0]
          const chainId = data.chainId
          
          const nonce = await generateNonce()
          
          const m = new SiweMessage({
            domain: window.location.host,
            address,
            chainId,
            uri: window.location.origin,
            version: "1",
            statement: "Smart Wallet SIWE Example",
            nonce: nonce,
            issuedAt: new Date().toISOString(),
            expirationTime: new Date(Date.now() + 1000 * 30).toISOString(),
          })
          
          console.log("生成されたSIWEメッセージ:", m)
          setMessage(m)
          
          const preparedMessage = m.prepareMessage()
          console.log("署名用メッセージ:", preparedMessage)
          signMessage({ message: preparedMessage })
        } catch (error) {
          console.error("SIWE メッセージ作成エラー:", error)
          setVerifying(false)
        }
      },
    },
  })

  const client = usePublicClient()
  
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess: async (sig, variables) => {
        console.log("署名成功:", sig)
        setSignature(sig)
        setTimeout(() => checkValid(), 1000)
      },
      onError: (error) => {
        console.error("署名エラー:", error)
        setVerifying(false)
      }
    },
  })

  const checkValid = useCallback(async () => {
    if (!signature || !address || !client || !message) {
      console.log("検証に必要な情報が不足しています:", {
        signature: !!signature,
        address: !!address,
        client: !!client,
        message: !!message
      })
      return
    }
    
    try {
      const preparedMessage = message.prepareMessage()
      console.log("検証用メッセージ:", preparedMessage)
      
      const isValid = await client.verifyMessage({
        address: address,
        message: preparedMessage,
        signature,
      })
      
      console.log("検証結果:", isValid)
      setValid(isValid)
      setVerifying(false)
      
    } catch (error) {
      console.error("検証エラー:", error)
      setValid(false)
      setVerifying(false)
    }
  }, [signature, address, client, message])

  useEffect(() => {
    if (signature && !verifying) {
      checkValid()
    }
  }, [signature, checkValid, verifying])

  const connectWallet = async () => {
    try {
      setVerifying(true)
      await connect({ connector: cbWalletConnector })
    } catch (error) {
      console.error("ウォレット接続エラー:", error)
      setVerifying(false)
    }
  }

  const createLink = () => {
    const mockLink = "https://crypto.link/s/abc123"
    setGeneratedLink(mockLink)
    setLinkCreated(true)
  }

  const resetForm = () => {
    setLinkCreated(false)
    setSelectedToken("")
    setAmount("")
  }

  const handleDisconnect = () => {
    disconnect()
    setSignature(undefined)
    setMessage(undefined)
    setValid(undefined)
    setVerifying(false)
    setSelectedToken("")
    setAmount("")
  }

  if (linkCreated) {
    return <LinkCreatedView link={generatedLink} onBack={resetForm} />
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium">Wallet</h2>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                <Wallet className="h-4 w-4" />
                <span className="max-w-[120px] truncate">{address}</span>
              </div>
              <Button 
                onClick={handleDisconnect} 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet} variant="outline" size="sm">
              Connect
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Select Token</label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="nft">NFT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedToken === "nft" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">Select NFT</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-green-500">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-1 block text-xs text-gray-500">Select NFT</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">Amount</label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}

          <Button
            className="mt-6 w-full bg-green-500 text-white hover:bg-green-600"
            size="lg"
            onClick={createLink}
            disabled={!isConnected || !selectedToken || (selectedToken !== "nft" && !amount)}
          >
            Create Link
          </Button>
        </div>

        {verifying ? (
          <p className="mt-4 text-yellow-600">検証中...</p>
        ) : (
          valid !== undefined && (
            <p className={`mt-4 ${valid ? "text-green-600" : "text-red-600"}`}>
              検証結果: {valid ? "成功" : "失敗"}
            </p>
          )
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            <p>接続状態: {isConnected ? "接続済み" : "未接続"}</p>
            <p>アドレス: {address || "なし"}</p>
            <p>署名あり: {!!signature}</p>
            <p>メッセージあり: {!!message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
