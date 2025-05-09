"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import QRCode from "@/components/qr-code"
import { useAccount } from "wagmi"
import { readContract, writeContract } from "wagmi/actions"
import { formatUnits } from "ethers"
import { config } from "@/wagmi"

// LinkStatusの定義
enum LinkStatus {
  Active = 0,
  Claimed = 1,
  Expired = 2,
  Canceled = 3
}

// コントラクトアドレスとABIの設定
const LINK_CREATOR_ADDRESS = process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA || "0x893AeF7d7FC2E06Eac6C138DD7b6E7e9aEE3022A";

// LinkCreatorコントラクトのABI
const LINK_CREATOR_ABI = [
  // getCreatorLinks関数
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "getCreatorLinks",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getLink関数
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      }
    ],
    "name": "getLink",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "linkId",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiration",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "claimer",
            "type": "address"
          },
          {
            "internalType": "enum ILinkCreator.LinkStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "claimData",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "claimedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct ILinkCreator.Link",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // cancelLink関数
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      }
    ],
    "name": "cancelLink",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// トークン名のマッピング
const TOKEN_SYMBOLS: Record<string, { symbol: string; decimals: number }> = {
  "0x0000000000000000000000000000000000000000": {
    symbol: "ETH",
    decimals: 18
  },
  // Mainnet USDC
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    symbol: "USDC",
    decimals: 6
  },
  // Sepolia USDC
  "0x036cbd53842c5426634e7929541ec2318f3dcf7e": {
    symbol: "USDC",
    decimals: 6
  },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": {
    symbol: "USDT",
    decimals: 6
  },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
    symbol: "WETH",
    decimals: 18
  },
  "0x6b175474e89094c44da98b954eedeac495271d0f": {
    symbol: "DAI",
    decimals: 18
  }
};

// トランザクション型の定義
interface Transaction {
  id: string
  creator: string
  tokenAddress: string
  tokenSymbol: string
  amount: string
  status: LinkStatus
  expiration: number
  createdAt: number
  claimedAt: number
  claimer: string
  link: string
}

// LinkCreatorのレスポンス型定義
interface LinkData {
  linkId: `0x${string}`;
  creator: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: bigint;
  expiration: bigint;
  claimer: `0x${string}`;
  status: number;
  claimData: `0x${string}`;
  createdAt: bigint;
  claimedAt: bigint;
}

export default function HistoryTransactions() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [selectedTx, setSelectedTx] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchTransactions(address)
    }
  }, [address])

  // トランザクション情報を取得する関数
  const fetchTransactions = async (userAddress: string) => {
    setLoading(true)
    try {
      // コントラクトからユーザーのリンクIDリストを取得
      const linkIds = await readContract(config, {
        address: LINK_CREATOR_ADDRESS as `0x${string}`,
        abi: LINK_CREATOR_ABI,
        functionName: 'getCreatorLinks',
        args: [userAddress as `0x${string}`]
      }) as `0x${string}`[];

      console.log("リンクID一覧:", linkIds);

      // 各リンクの詳細情報を取得
      const txPromises = linkIds.map(async (linkId) => {
        try {
          const linkData = await readContract(config, {
            address: LINK_CREATOR_ADDRESS as `0x${string}`,
            abi: LINK_CREATOR_ABI,
            functionName: 'getLink',
            args: [linkId]
          }) as LinkData;

          // 返されたデータを適切な形式に変換
          const tokenAddress = linkData.tokenAddress.toLowerCase();
          const tokenInfo = TOKEN_SYMBOLS[tokenAddress] || {
            symbol: "不明なトークン",
            decimals: 18
          };

          // リンクURL生成（正しいURLパスと完全なlinkIdを使用）
          const link = `${window.location.origin}/receive/${linkId}`;

          return {
            id: linkId,
            creator: linkData.creator,
            tokenAddress: linkData.tokenAddress,
            tokenSymbol: tokenInfo.symbol,
            amount: formatUnits(linkData.amount, tokenInfo.decimals),
            status: linkData.status as LinkStatus,
            expiration: Number(linkData.expiration),
            createdAt: Number(linkData.createdAt),
            claimedAt: Number(linkData.claimedAt),
            claimer: linkData.claimer,
            link
          } as Transaction;
        } catch (error) {
          console.error(`リンク取得エラー (${linkId}):`, error);
          return null;
        }
      });

      // すべてのリンク情報を収集
      const results = await Promise.all(txPromises);
      const validTransactions = results.filter((tx): tx is Transaction => tx !== null);

      // 新しい順に並べ替え
      validTransactions.sort((a, b) => b.createdAt - a.createdAt);

      setTransactions(validTransactions);
    } catch (error) {
      console.error("トランザクション取得エラー:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const openDetails = (txId: string) => {
    setSelectedTx(txId)
  }

  const closeDetails = () => {
    setSelectedTx(null)
  }

  const getStatusBadge = (status: LinkStatus) => {
    switch (status) {
      case LinkStatus.Active:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            未請求
          </Badge>
        )
      case LinkStatus.Claimed:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            請求済み
          </Badge>
        )
      case LinkStatus.Expired:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            期限切れ
          </Badge>
        )
      case LinkStatus.Canceled:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            キャンセル済み
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('ja-JP') + " " + date.toLocaleTimeString('ja-JP', { hour: "2-digit", minute: "2-digit" })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSelectedTransaction = () => {
    return transactions.find((tx) => tx.id === selectedTx)
  }

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "all") return true
    if (activeTab === "active") return tx.status === LinkStatus.Active
    if (activeTab === "claimed") return tx.status === LinkStatus.Claimed
    if (activeTab === "expired") return tx.status === LinkStatus.Expired || tx.status === LinkStatus.Canceled
    return true
  })

  // トランザクションをキャンセルする関数
  const handleCancel = async (txId: string) => {
    try {
      await writeContract(config, {
        address: LINK_CREATOR_ADDRESS as `0x${string}`,
        abi: LINK_CREATOR_ABI,
        functionName: 'cancelLink',
        args: [txId as `0x${string}`]
      });

      console.log(`キャンセルしました: ${txId}`);
      
      // UI上のステータスを更新（実際にはブロックチェーンの確認後に更新すべき）
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === txId 
            ? {...tx, status: LinkStatus.Canceled} 
            : tx
        )
      );
    } catch (error) {
      console.error("キャンセルエラー:", error);
      alert("トランザクションのキャンセルに失敗しました。");
    }
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="active">未請求</TabsTrigger>
              <TabsTrigger value="claimed">請求済み</TabsTrigger>
              <TabsTrigger value="expired">期限切れ/キャンセル</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="py-8 text-center text-gray-500">読み込み中...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">表示するトランザクションがありません</div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((tx) => (
                    <Collapsible
                      key={tx.id}
                      open={openItems[tx.id]}
                      onOpenChange={() => toggleItem(tx.id)}
                      className="rounded-lg border bg-white"
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              {tx.tokenSymbol} {tx.amount}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
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
                            <div className="text-xs font-medium text-gray-500">リンク</div>
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

                          <div>
                            <div className="text-xs font-medium text-gray-500">期限</div>
                            <div className="text-sm">{formatDate(tx.expiration)}</div>
                          </div>

                          {tx.claimer && (
                            <div>
                              <div className="text-xs font-medium text-gray-500">請求者</div>
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm">{tx.claimer}</div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(tx.claimer)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {tx.claimedAt > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-500">請求日時</div>
                              <div className="text-sm">{formatDate(tx.claimedAt)}</div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(tx.id)}
                            className="mt-2 w-full"
                          >
                            詳細を見る
                          </Button>

                          {tx.status === LinkStatus.Active && (
                            <Button
                              className="mt-2 w-full bg-red-500 text-white hover:bg-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancel(tx.id)
                              }}
                            >
                              キャンセル
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={selectedTx !== null} onOpenChange={closeDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>取引詳細</DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4 max-w-full overflow-hidden">
              {(() => {
                const tx = getSelectedTransaction()
                if (!tx) return null

                return (
                  <>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 max-w-[70%]">
                          <h3 className="text-sm font-medium text-gray-500">トークン</h3>
                          <div className="font-medium truncate">
                            {tx.tokenSymbol} {tx.amount}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(tx.status)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-500">作成日時</h3>
                        <div className="text-sm">{formatDate(tx.createdAt)}</div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-500">期限</h3>
                        <div className="text-sm">{formatDate(tx.expiration)}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">リンク</h3>
                      <div className="mt-1 flex items-center gap-2 rounded-md border bg-gray-50 p-2">
                        <div className="truncate text-sm flex-1 min-w-0">{tx.link}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(tx.link)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">QRコード</h3>
                      <div className="mt-1 flex justify-center rounded-md border bg-white p-4">
                        <QRCode value={tx.link} size={180} />
                      </div>
                    </div>

                    {tx.status === LinkStatus.Claimed && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">請求者</h3>
                        <div className="mt-1 flex items-center gap-2 rounded-md border bg-gray-50 p-2">
                          <div className="truncate text-sm flex-1 min-w-0">{tx.claimer}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(tx.claimer)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          <h3 className="text-sm font-medium text-gray-500">請求日時</h3>
                          <div className="text-sm">{formatDate(tx.claimedAt)}</div>
                        </div>
                      </div>
                    )}

                    {tx.status === LinkStatus.Active && (
                      <Button
                        className="w-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          handleCancel(tx.id)
                          closeDetails()
                        }}
                      >
                        キャンセル
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