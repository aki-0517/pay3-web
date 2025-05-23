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
import { useConnect, useAccount, useWriteContract, useSwitchChain, useBalance, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { readContract } from "wagmi/actions"
import { cbWalletConnector } from "@/wagmi"
import { base, baseSepolia } from 'wagmi/chains'
import { formatEther, formatUnits } from 'viem'
import { config } from "@/wagmi"
import { usePaymaster } from "@/hooks/use-paymaster"
import { useLanguage, t } from "@/lib/i18n"

// チェーンID定数の型をより明確に定義
const CHAIN_IDS = {
  BASE_MAINNET: 8453 as number, // Base Mainnet ID
  BASE_SEPOLIA: 84532 as number, // Base Sepolia ID
} as const

// LinkCreatorコントラクトのアドレス
const LINK_CREATOR_ADDRESS = {
  [CHAIN_IDS.BASE_MAINNET]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET || "0x...", 
  [CHAIN_IDS.BASE_SEPOLIA]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA || "0x..."
} as const

// LinkRegistry コントラクトのアドレス
const LINK_REGISTRY_ADDRESS = {
  [CHAIN_IDS.BASE_MAINNET]: process.env.NEXT_PUBLIC_LINK_REGISTRY_ADDRESS_MAINNET || "0x...",
  [CHAIN_IDS.BASE_SEPOLIA]: process.env.NEXT_PUBLIC_LINK_REGISTRY_ADDRESS_SEPOLIA || "0x..."
} as const

// LinkCreator ABIの定義
const LINK_CREATOR_ABI = [
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
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      }
    ],
    "name": "isLinkClaimable",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "claimLink",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// TokenNameのマッピング
const TOKEN_NAMES: {[key: string]: string} = {
  "0x0000000000000000000000000000000000000000": "ETH",
}

interface Link {
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

interface CryptoReceiveProps {
  transactionId: string
}

// チェーンIDの比較に使用する共通関数
const isMainnetChain = (chainId: number | undefined) => {
  return chainId === CHAIN_IDS.BASE_MAINNET;
};

const isSepoliaChain = (chainId: number | undefined) => {
  return chainId === CHAIN_IDS.BASE_SEPOLIA;
};

export default function CryptoReceive({ transactionId }: CryptoReceiveProps) {
  const [walletConnected, setWalletConnected] = useState(false)
  const [assetClaimed, setAssetClaimed] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [linkId, setLinkId] = useState<`0x${string}` | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { switchChain } = useSwitchChain()
  
  // 状態管理のためのstate
  const [isPending, setIsPending] = useState(false)
  const [writeError, setWriteError] = useState<Error | null>(null)

  // PaymasterサポートとCapabilitiesを取得
  const { capabilities, hasPaymasterSupport } = usePaymaster()
  
  // useWriteContractフックを使用
  const { writeContract, isPending: isWritePending, isError: isWriteError, error: contractError } = useWriteContract({
    mutation: {
      async onSuccess(hash) {
        // トランザクションハッシュをステートに保存
        setTxHash(hash)
        
        // APIにクレイム状態を通知
        try {
          await fetch(`/api/links/${transactionId}/claim`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              address,
              txHash: hash
            })
          })
        } catch (apiErr) {
          console.error("クレイム状態の通知に失敗:", apiErr)
          // 非クリティカルなので続行
        }
      },
      onError(error) {
        setWriteError(error as Error)
      }
    }
  })

  // トランザクション結果の監視
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  })

  // トランザクション成功時の処理をuseEffectで行う
  useEffect(() => {
    if (isConfirmed && txHash) {
      setAssetClaimed(true)
    }
  }, [isConfirmed, txHash])

  // リンク情報をAPIから取得する
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchLinkData = async () => {
      try {
        // タイムアウト設定を追加
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            abortController.abort();
            setError("リクエストがタイムアウトしました。ネットワーク接続を確認してください。");
            setLoading(false);
          }
        }, 15000); // 15秒でタイムアウト
        
        // APIからリンク情報を取得（リトライロジックを追加）
        let response: Response | undefined;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            response = await fetch(`/api/links/${transactionId}`, {
              signal: abortController.signal
            });
            break; // 成功したらループを抜ける
          } catch (fetchErr) {
            retries++;
            if (retries >= maxRetries) throw fetchErr;
            // 指数バックオフで待機
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          }
        }
        
        clearTimeout(timeoutId);
        
        // レスポンスがない場合はエラー
        if (!response) {
          throw new Error('APIレスポンスが取得できませんでした');
        }
        
        // 404ステータスでも明示的に処理する
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'リンクが見つかりません');
        }
        
        if (!response.ok) {
          throw new Error('リンク情報の取得に失敗しました');
        }

        const data = await response.json();
        
        if (!isMounted) return;
        
        // isFallbackフラグがある場合は警告を表示
        if (data.isFallback) {
          console.warn('フォールバックデータが使用されています。一部の機能が制限される可能性があります。');
        }
        
        setLinkId(data.linkId as `0x${string}`);
        setTransaction({
          id: transactionId,
          linkId: data.linkId,
          token: data.token,
          tokenAddress: data.tokenAddress,
          amount: data.amount,
          sender: data.creator,
          senderName: "送金者", // 実際にはENSなどから取得するとよい
          status: data.status,
          expiration: data.expiration,
          isNft: false, // NFTはまだサポートしていないので固定
        });
        
        // リンクのステータスが既にClaimedの場合
        if (data.status === 1) { // 1 = Claimed
          setAssetClaimed(true);
        }
        
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error("リンク情報の取得に失敗しました:", err);
        
        // エラーメッセージを設定して必ずロード状態を終了
        setError(err.name === 'AbortError' 
          ? "データの読み込みがタイムアウトしました" 
          : (err.message || "リンク情報の取得に失敗しました"));
        setLoading(false);
      }
    };

    fetchLinkData();
    
    // クリーンアップ関数
    return () => {
      isMounted = false;
      abortController.abort(); // コンポーネントのアンマウント時にリクエストを中止
      // 他のクリーンアップ処理...
    };
  }, [transactionId]);

  // LinkCreatorコントラクトからリンクのクレイム可能状態を確認
  const { data: isClaimable, isLoading: isCheckingClaimable } = useReadContract({
    address: (chain?.id ? LINK_CREATOR_ADDRESS[chain.id as keyof typeof LINK_CREATOR_ADDRESS] : undefined) as `0x${string}` | undefined,
    abi: LINK_CREATOR_ABI,
    functionName: 'isLinkClaimable',
    args: linkId ? [linkId] : undefined,
    query: {
      enabled: !!linkId && !!chain?.id
    }
  })

  const connectWallet = async () => {
    try {
      await connect({ connector: cbWalletConnector })
      setWalletConnected(true)
    } catch (err) {
      console.error("ウォレット接続エラー:", err)
    }
  }

  // handleNetworkChange関数を修正
  const handleNetworkChange = () => {
    // 常にBase Sepoliaを使用
    try {
      // Sepoliaへの切り替え
      switchChain({ chainId: 84532 });
    } catch (err) {
      console.error('ネットワーク切り替えエラー:', err);
    }
  }

  const claimAsset = async () => {
    if (!address || !linkId || !chain?.id) return
    
    try {
      setIsClaiming(true)
      setIsPending(true)
      setWriteError(null)
      
      // コントラクトのアドレスを取得
      const contractAddress = LINK_CREATOR_ADDRESS[chain.id as keyof typeof LINK_CREATOR_ADDRESS]
      
      if (!contractAddress) {
        throw new Error("このチェーンではリンクの受け取りがサポートされていません")
      }
      
      // リンクがクレイム可能か最終確認
      const isClaimable = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: LINK_CREATOR_ABI,
        functionName: 'isLinkClaimable',
        args: [linkId]
      })
      
      if (!isClaimable) {
        throw new Error(t('crypto.notClaimable', language))
      }
      
      // Paymasterを使ってトランザクションを送信
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: LINK_CREATOR_ABI,
        functionName: 'claimLink',
        args: [linkId, address],
        ...(hasPaymasterSupport ? { options: { capabilities } } : {})
      })
      
      // トランザクションは送信された（エラーがなかった）
      console.log("トランザクション送信成功")
      
      // 注: txHashはコールバックで設定されるため、ここでは使用できない可能性がある
    } catch (err: any) {
      console.error("受け取りエラー:", err)
      setWriteError(err)
      setError(err.message || "受け取り処理中にエラーが発生しました")
    } finally {
      setIsClaiming(false)
      setIsPending(false)
    }
  }

  const { language } = useLanguage();

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
          <h2 className="text-xl font-medium text-red-500">{t('crypto.loadingError', language)}</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-medium">{t('crypto.notFound', language)}</h2>
          <p className="mt-2 text-gray-600">{t('crypto.notFoundDesc', language)}</p>
        </CardContent>
      </Card>
    )
  }

  // リンクが既に請求済みか期限切れの場合
  if (transaction.status !== 0 && !assetClaimed) { // 0 = Active
    let statusMessage = '';
    
    switch(transaction.status) {
      case 1: 
        statusMessage = t('crypto.alreadyClaimed', language); 
        break;
      case 2: 
        statusMessage = t('crypto.expired', language); 
        break;
      case 3: 
        statusMessage = t('crypto.canceled', language); 
        break;
      default: 
        statusMessage = t('crypto.invalidStatus', language);
    }
    
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-medium">{t('crypto.linkUnavailable', language)}</h2>
          <p className="mt-2 text-gray-600">
            {statusMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        {!isConnected ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-medium">{t('crypto.receivePrompt', language).replace('{sender}', transaction.senderName)}</h2>
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
              <p className="mt-4 text-gray-600">{t('crypto.connectPrompt', language)}</p>
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
              <h3 className="mb-2 text-sm font-medium text-gray-500">{t('crypto.receiveSummary', language)}</h3>
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
                {t('crypto.sender', language)
                  .replace('{name}', transaction.senderName)
                  .replace('{address}', 
                    `${transaction.sender.substring(0, 6)}...${transaction.sender.substring(transaction.sender.length-4)}`
                  )
                }
              </div>
              {chain?.id && (
                process.env.NODE_ENV === 'production' ? 
                  !isMainnetChain(Number(chain.id)) && (
                    <div className="mt-3">
                      <p className="text-sm text-amber-600">{t('crypto.networkChange', language)}</p>
                      <Button 
                        className="mt-1 w-full bg-amber-500 text-white hover:bg-amber-600" 
                        size="sm"
                        onClick={handleNetworkChange}
                      >
                        {t('crypto.switchToMainnet', language)}
                      </Button>
                    </div>
                  ) : !isSepoliaChain(Number(chain.id)) && (
                    <div className="mt-3">
                      <p className="text-sm text-amber-600">{t('crypto.networkChange', language)}</p>
                      <Button 
                        className="mt-1 w-full bg-amber-500 text-white hover:bg-amber-600" 
                        size="sm"
                        onClick={handleNetworkChange}
                      >
                        {t('crypto.switchToSepolia', language)}
                      </Button>
                    </div>
                  )
              )}
              
              {/* Paymasterサポート表示 */}
              {hasPaymasterSupport && (
                <div className="mt-3 text-sm text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  {t('crypto.gasSponsored', language)}
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-green-500 text-white hover:bg-green-600" 
              size="lg" 
              onClick={claimAsset}
              disabled={
                isPending || 
                isWritePending || 
                isClaiming || 
                isCheckingClaimable || 
                !chain?.id || 
                !isSepoliaChain(Number(chain.id)) ||
                isClaimable === false
              }
            >
              {isPending || isWritePending || isClaiming ? t('crypto.processing', language) : t('crypto.claim', language)}
            </Button>

            <div className="mt-2 text-center text-xs text-gray-500">
              {hasPaymasterSupport ? 
                t('crypto.feeNote', language) : 
                t('crypto.gasFeeNote', language)}
            </div>
            
            {/* クレイム可能かどうかのチェック結果 */}
            {isClaimable === false && !isCheckingClaimable && (
              <p className="mt-4 text-red-600">{t('crypto.notClaimable', language)}</p>
            )}
            
            {/* エラー表示 */}
            {(isWriteError || writeError) && (
              <p className="mt-4 text-red-600">
                {t('crypto.errorOccurred', language).replace('{message}', contractError?.message || writeError?.message || '')}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-medium">{t('crypto.claimComplete', language)}</h2>
              <p className="mt-2 text-center text-gray-600">
                {transaction.isNft ? transaction.token : `${transaction.amount} ${transaction.token}`}
                {t('crypto.addedToWallet', language)}
              </p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                {t('crypto.checkWallet', language)}
              </Button>

              {txHash && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')}
                >
                  {t('crypto.checkTransaction', language)}
                </Button>
              )}

              <Button 
                className="w-full bg-green-500 text-white hover:bg-green-600"
                onClick={() => window.location.href = '/'}
              >
                {t('crypto.finish', language)}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
