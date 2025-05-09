"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Wallet, Plus, LogOut } from "lucide-react"
import LinkCreatedView from "@/components/link-created-view"
import { useConnect, useAccount, usePublicClient, useSignMessage, useDisconnect, useBalance, useSwitchChain, useWriteContract, useReadContract, useWaitForTransactionReceipt, useWatchPendingTransactions } from "wagmi"
import { SiweMessage, generateNonce } from "siwe"
import { cbWalletConnector } from "@/wagmi"
import type { Hex } from "viem"
import { formatEther, formatUnits, parseEther, parseUnits, decodeEventLog } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'
import { QRCodeSVG } from 'qrcode.react'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { convertStringToLinkId } from '@/lib/link-utils'
import { useLanguage, t } from "@/lib/i18n"

// トークンのコントラクトアドレスを環境変数から定義
const TOKEN_ADDRESSES = {
  [base.id]: {
    eth: undefined,
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS_MAINNET as `0x${string}` | undefined,
    usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS_MAINNET as `0x${string}` | undefined,
  },
  [baseSepolia.id]: {
    eth: undefined,
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS_SEPOLIA as `0x${string}` | undefined,
    usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS_SEPOLIA as `0x${string}` | undefined,
  },
} as const satisfies Record<string, Record<string, `0x${string}` | undefined>>

// Default tokens for when chain is not available
const DEFAULT_TOKENS = {
  eth: undefined,
  usdc: undefined,
  usdt: undefined,
}

// デシマルの定義
const TOKEN_DECIMALS = {
  eth: 18,
  usdc: 6,
  usdt: 6,
} as const

type TokenType = keyof typeof TOKEN_ADDRESSES[typeof base.id]

const CHAIN_IDS = {
  BASE_MAINNET: 8453, // Base Mainnet ID
  BASE_SEPOLIA: 84532, // Base Sepolia ID - this must match what wagmi expects
} as const

type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS]

// チェーン名の表示用マッピング
const CHAIN_NAMES = {
  [CHAIN_IDS.BASE_MAINNET]: 'Base Mainnet',
  [CHAIN_IDS.BASE_SEPOLIA]: 'Base Sepolia',
} as const

// LinkCreatorコントラクトのアドレス（環境変数から読み込み）
const LINK_CREATOR_ADDRESS = {
  [CHAIN_IDS.BASE_MAINNET]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET || "0x...", 
  [CHAIN_IDS.BASE_SEPOLIA]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA || "0x..."
} as const

// Constants.solからのトークンアドレスを追加
const CONSTANTS_TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  USDC: {
    MAINNET: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`,
    // BaseではなくEthereumのアドレス。実際のBase用アドレスに置き換える必要あり
  },
  USDT: {
    MAINNET: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`,
    // BaseではなくEthereumのアドレス。実際のBase用アドレスに置き換える必要あり
  }
}

// LinkCreator ABIの定義
const LINK_CREATOR_ABI = [
  {
    "inputs": [
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
        "name": "expirationDuration",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "claimData",
        "type": "bytes"
      }
    ],
    "name": "createLink",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "linkId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiration",
        "type": "uint256"
      }
    ],
    "name": "LinkCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "name": "supportedTokens",
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
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "supported",
        "type": "bool"
      }
    ],
    "name": "setTokenSupported",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// ERC20承認用の標準ABI
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export default function SenderUI() {
  const { language } = useLanguage();
  const [selectedToken, setSelectedToken] = useState("")
  const [amount, setAmount] = useState("")
  const [linkCreated, setLinkCreated] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [signature, setSignature] = useState<Hex | undefined>(undefined)
  const [message, setMessage] = useState<SiweMessage | undefined>(undefined)
  const [valid, setValid] = useState<boolean | undefined>(undefined)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [linkId, setLinkId] = useState<string | undefined>(undefined)
  const [expirationDuration, setExpirationDuration] = useState("86400") // デフォルト24時間 (秒)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const router = useRouter()
  const client = usePublicClient()

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

  // コントラクトの書き込み用フック
  const { writeContractAsync, isPending, isError, error: writeContractError } = useWriteContract()
  
  // トランザクション待機フック
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const createLink = async () => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 文字列IDをランダムに生成
      const randomStrId = nanoid(10);
      console.log(`Generated random ID: ${randomStrId}`);
      
      // 文字列IDをコントラクト用のlinkIdに変換
      const linkId = await convertStringToLinkId(randomStrId);
      console.log(`Converted to linkId: ${linkId}`);

      // コントラクトのアドレスを取得
      const contractAddress = LINK_CREATOR_ADDRESS[CHAIN_IDS.BASE_SEPOLIA] as `0x${string}`;
      
      // 選択されたトークンに基づいて、トークンアドレスとデシマルを設定
      let tokenAddress: `0x${string}`;
      let valueToSend: bigint = BigInt(0);
      let amountInWei: bigint;
      
      if (selectedToken === 'eth') {
        // ETHの場合
        tokenAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;
        amountInWei = parseUnits(amount, TOKEN_DECIMALS.eth);
        valueToSend = amountInWei; // ETHを送金する場合はvalueにセット
      } else if (selectedToken === 'usdc' || selectedToken === 'usdt') {
        // ERC20トークンの場合
        tokenAddress = selectedToken === 'usdc' 
          ? getAvailableTokens().usdc as `0x${string}`
          : getAvailableTokens().usdt as `0x${string}`;
        
        const decimals = selectedToken === 'usdc' ? TOKEN_DECIMALS.usdc : TOKEN_DECIMALS.usdt;
        amountInWei = parseUnits(amount, decimals);
        
        // トークンがサポートされているか確認
        try {
          const isSupported = await client.readContract({
            address: contractAddress,
            abi: LINK_CREATOR_ABI,
            functionName: 'supportedTokens',
            args: [tokenAddress]
          });
          
          if (!isSupported) {
            console.log(`トークン ${selectedToken.toUpperCase()} はサポートされていません。サポートリストに追加します。`);
            
            // トークンをサポートリストに追加
            try {
              const setTokenSupportedHash = await writeContractAsync({
                address: contractAddress,
                abi: LINK_CREATOR_ABI,
                functionName: 'setTokenSupported',
                args: [tokenAddress, true],
                chainId: CHAIN_IDS.BASE_SEPOLIA
              });
              
              console.log(`setTokenSupported transaction hash: ${setTokenSupportedHash}`);
              
              // トークンサポート設定トランザクションの完了を待機
              const setTokenSupportedReceipt = await client.waitForTransactionReceipt({ hash: setTokenSupportedHash });
              console.log('setTokenSupported transaction receipt:', setTokenSupportedReceipt);
            } catch (error: unknown) {
              console.error('Error setting token supported:', error);
              let errorMessage = 'トークンサポート設定中に不明なエラーが発生しました';
              
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as { message: unknown }).message);
              }
              
              throw new Error(`トークンをサポートリストに追加できませんでした: ${errorMessage}`);
            }
          }
          
          console.log(`トークン ${selectedToken.toUpperCase()} はサポートされています`);
        } catch (error: unknown) {
          console.error('トークンサポート確認エラー:', error);
          // エラーメッセージを安全に取得するための型チェック
          let errorMessage = 'トークンサポート確認中に不明なエラーが発生しました';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as { message: unknown }).message);
          }
          
          throw new Error(`トークンがサポートされているか確認できませんでした: ${errorMessage}`);
        }
        
        // ERC20トークンを使用する場合は、先に承認（approve）が必要
        try {
          console.log(`Approving ${amount} ${selectedToken.toUpperCase()} to contract ${contractAddress}`);
          
          const approveHash = await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress, amountInWei],
            chainId: CHAIN_IDS.BASE_SEPOLIA
          });
          
          console.log(`Approval transaction hash: ${approveHash}`);
          
          // 承認トランザクションの完了を待機
          const approveReceipt = await client.waitForTransactionReceipt({ hash: approveHash });
          console.log('Approval transaction receipt:', approveReceipt);
        } catch (error: unknown) {
          console.error('Error approving tokens:', error);
          let errorMessage = 'トークン承認中に不明なエラーが発生しました';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as { message: unknown }).message);
          }
          
          throw new Error(`トークン承認に失敗しました: ${errorMessage}`);
        }
      } else {
        throw new Error('不明なトークンタイプです');
      }
      
      // 有効期限（秒）
      const expiration = BigInt(expirationDuration);
      
      // カスタムデータ（空）
      const claimData = '0x' as `0x${string}`;

      // リンク作成トランザクションを送信
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: LINK_CREATOR_ABI,
        functionName: 'createLink',
        args: [tokenAddress, amountInWei, expiration, claimData],
        chainId: CHAIN_IDS.BASE_SEPOLIA,
        value: valueToSend // ETHの場合のみ値をセット、それ以外は0
      });
      console.log(`Transaction hash: ${hash}`);

      // トランザクションの完了を待機
      const receipt = await client.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      // 受信したイベントからリンクIDを取得
      let actualLinkId = linkId; // デフォルトは生成したID
      
      try {
        // receipt.logsからLinkCreatedイベントを探す
        for (const log of receipt.logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: LINK_CREATOR_ABI,
              data: log.data,
              topics: log.topics
            });
            
            if (decodedLog.eventName === 'LinkCreated' && decodedLog.args.linkId) {
              actualLinkId = decodedLog.args.linkId;
              console.log(`Extracted linkId from event: ${actualLinkId}`);
              break;
            }
          } catch (err) {
            // このログは関連するイベントでない可能性があるため、エラーを無視
            continue;
          }
        }
      } catch (eventError) {
        console.error('Failed to decode event, falling back to generated linkId:', eventError);
      }

      // リンク情報をAPIに保存
      const response = await fetch('/api/links/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId: actualLinkId,
          amount,
          txHash: hash,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to store link data');
      }

      // 作成完了後のリダイレクト
      router.push(`/created?id=${encodeURIComponent(actualLinkId)}`);
    } catch (error: unknown) {
      console.error('Error creating link:', error);
      let errorMessage = 'リンク作成中に不明なエラーが発生しました';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

  // チェーン切り替えハンドラー
  const handleNetworkChange = (chainId: string) => {
    const numChainId = Number(chainId)

    // Use type assertion to tell TypeScript these are valid chain IDs
    if (numChainId === CHAIN_IDS.BASE_MAINNET) {
      switchChain({ chainId: CHAIN_IDS.BASE_MAINNET as 84532 })
    } else if (numChainId === CHAIN_IDS.BASE_SEPOLIA) {
      switchChain({ chainId: CHAIN_IDS.BASE_SEPOLIA })
    }
  }

  // Get the available tokens based on current chain
  const getAvailableTokens = () => {
    if (!chain?.id) return DEFAULT_TOKENS;

    // Check if the chain ID exists in our TOKEN_ADDRESSES
    return Object.prototype.hasOwnProperty.call(TOKEN_ADDRESSES, chain.id.toString())
      ? TOKEN_ADDRESSES[chain.id as keyof typeof TOKEN_ADDRESSES]
      : DEFAULT_TOKENS;
  }

  // 各トークンのbalanceを個別にフックで取得
  const ethBalance = useBalance({
    address,
    chainId: chain?.id,
  })

  const usdcBalance = useBalance({
    address,
    token: getAvailableTokens().usdc,
    chainId: chain?.id,
  })

  const usdtBalance = useBalance({
    address,
    token: getAvailableTokens().usdt,
    chainId: chain?.id,
  })

  // トークンごとのバランスを取得する関数
  const getTokenBalance = (tokenKey: TokenType) => {
    switch (tokenKey) {
      case 'eth':
        return ethBalance.data ? formatEther(ethBalance.data.value) : '0'
      case 'usdc':
        return usdcBalance.data ? formatUnits(usdcBalance.data.value, TOKEN_DECIMALS.usdc) : '0'
      case 'usdt':
        return usdtBalance.data ? formatUnits(usdtBalance.data.value, TOKEN_DECIMALS.usdt) : '0'
      default:
        return '0'
    }
  }

  // 有効期限選択ドロップダウンの追加
  const renderExpirationSelect = () => {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium">{t('sender.expiration', language)}</label>
        <Select value={expirationDuration} onValueChange={setExpirationDuration}>
          <SelectTrigger>
            <SelectValue placeholder={t('sender.expirationPlaceholder', language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3600">{t('sender.1hour', language)}</SelectItem>
            <SelectItem value="86400">{t('sender.24hours', language)}</SelectItem>
            <SelectItem value="604800">{t('sender.1week', language)}</SelectItem>
            <SelectItem value="2592000">{t('sender.30days', language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (linkCreated) {
    return <LinkCreatedView onBack={resetForm} />
  }

  const availableTokens = getAvailableTokens();

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium"></h2>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Select
                value={chain?.id?.toString()}
                onValueChange={handleNetworkChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CHAIN_IDS.BASE_MAINNET.toString()}>
                    Base Mainnet
                  </SelectItem>
                  <SelectItem value={CHAIN_IDS.BASE_SEPOLIA.toString()}>
                    Base Sepolia
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                  <Wallet className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{address}</span>
                </div>
                <Button onClick={handleDisconnect} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={connectWallet} variant="outline" size="sm">
                {t('common.connect', language)}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('sender.selectToken', language)}</label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder={t('sender.selectToken', language)} />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(availableTokens).map((token) => {
                  const tokenKey = token as TokenType
                  const balance = getTokenBalance(tokenKey)

                  return (
                    <SelectItem key={token} value={token}>
                      <div className="flex justify-between w-full">
                        <span className="uppercase">{token}</span>
                        <span className="text-gray-500">{Number(balance).toFixed(4)}</span>
                      </div>
                    </SelectItem>
                  )
                })}
                <SelectItem value="nft">NFT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedToken === "nft" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">{t('sender.selectNFT', language)}</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-green-500">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-1 block text-xs text-gray-500">{t('sender.selectNFT', language)}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium">{t('sender.amount', language)}</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
                <p className="mt-1 text-xs text-gray-500">{t('sender.feeNote', language)}</p>
              </div>
              
              {/* 有効期限選択の追加 */}
              {renderExpirationSelect()}
            </>
          )}

          <Button
            className="mt-6 w-full bg-green-500 text-white hover:bg-green-600"
            size="lg"
            onClick={createLink}
            disabled={
              !isConnected || 
              !selectedToken || 
              (selectedToken !== "nft" && !amount) || 
              isCreatingLink || 
              isConfirming ||
              isLoading
            }
          >
            {isCreatingLink || isConfirming || isLoading ? t('sender.processing', language) : t('sender.createLink', language)}
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {verifying ? (
          <p className="mt-4 text-yellow-600">{t('sender.verifying', language)}</p>
        ) : (
          valid !== undefined && (
            <p className={`mt-4 ${valid ? "text-green-600" : "text-red-600"}`}>
              {t('sender.verificationResult', language)} {valid ? t('sender.success', language) : t('sender.failure', language)}
            </p>
          )
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            <p>{t('sender.connectionStatus', language)} {isConnected ? t('sender.connected', language) : t('sender.notConnected', language)}</p>
            <p>{t('sender.address', language)} {address || t('sender.none', language)}</p>
            <p>Chain: {chain?.name || "none"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
