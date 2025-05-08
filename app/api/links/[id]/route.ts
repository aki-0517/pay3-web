import { NextRequest, NextResponse } from 'next/server';
import { formatUnits } from 'ethers';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { convertStringToLinkId } from '@/lib/link-utils';

// BigIntをJSON文字列化するためのヘルパー関数
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// この例ではサーバー側でのAPIルートを実装し、実際のLinkCreatorコントラクトと
// 連携するためのエンドポイントを定義します。

// コントラクトアドレスの設定
const LINK_CREATOR_ADDRESS = {
  [base.id]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET || "0x1234567890123456789012345678901234567890",
  [baseSepolia.id]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA || "0x893AeF7d7FC2E06Eac6C138DD7b6E7e9aEE3022A"
};

// LinkCreatorの戻り値の型定義
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

// ABIの定義
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
  }
] as const;

// トークン名のマッピング
const TOKEN_SYMBOLS: Record<string, { symbol: string; decimals: number }> = {
  "0x0000000000000000000000000000000000000000": {
    symbol: "ETH",
    decimals: 18
  },
  // 他のトークンを追加
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // paramsをawaitしてから分割代入を使用
  const { id } = await params;
  console.log(`API呼び出し開始: ID=${id}`);
  
  try {
    // 診断用ログを追加
    const startTime = Date.now();
    
    // 環境変数からチェーン情報を取得、または自動検出
    // 明示的な環境変数がある場合はそれを使用
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    const chain = isProduction ? base : baseSepolia;
    console.log(`使用チェーン: ${chain.name} (ID: ${chain.id}), 環境: ${isProduction ? '本番' : '開発'}`);
    
    const contractAddress = LINK_CREATOR_ADDRESS[chain.id];
    console.log(`コントラクトアドレス: ${contractAddress}`);
    
    if (!contractAddress || contractAddress === "0x...") {
      console.error("エラー: コントラクトアドレスが設定されていません");
      throw new Error("コントラクトアドレスが設定されていません");
    }
    
    // RPCクライアントの作成 - 環境変数を優先的に使用
    const rpcUrl = isProduction
      ? (process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL_MAINNET || "https://base-mainnet.g.alchemy.com/v2/1FLCJZcmqo8JIllallfvmc3Vmh3eYfsO")
      : (process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL_SEPOLIA || "https://base-sepolia.g.alchemy.com/v2/1FLCJZcmqo8JIllallfvmc3Vmh3eYfsO");
    
    console.log(`使用RPC URL: ${rpcUrl}`);
    
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
    
    // IDマッピングの取得を試みる
    let mappedContractId: string | null = null;
    
    try {
      // 内部APIを使用してIDマッピングを取得
      const mapResponse = await fetch(`${req.nextUrl.origin}/api/links/store?id=${id}`);
      if (mapResponse.ok) {
        const mapData = await mapResponse.json();
        mappedContractId = mapData.contractLinkId;
        console.log(`IDマッピング検出: ${id} -> ${mappedContractId}`);
      }
    } catch (mapError) {
      console.log(`IDマッピング取得エラー: ${mapError}, 代替変換方法を使用します`);
    }
    
    // bytes32形式のlinkIdを生成
    let linkId: `0x${string}`;
    
    try {
      if (mappedContractId) {
        // マッピングからIDが見つかった場合はそれを使用
        linkId = mappedContractId as `0x${string}`;
        console.log(`マッピングされたlinkId使用: ${linkId}`);
      } else if (id.startsWith("0x")) {
        // 既に0xで始まる場合は直接使用
        linkId = id as `0x${string}`;
        console.log(`直接16進数linkId使用: ${linkId}`);
      } else {
        // それ以外の場合は変換
        console.log(`非16進数IDを変換: ${id}`);
        linkId = await convertStringToLinkId(id);
        console.log(`ハッシュベースのlinkId: ${linkId}`);
      }
      
      console.log(`最終linkId: ${linkId}`);
    } catch (conversionError: any) {
      console.error(`ID変換エラー:`, conversionError);
      throw new Error(`ID変換エラー: ${conversionError?.message || '不明なエラー'}`);
    }
    
    try {
      // コントラクトからリンク情報を取得
      console.log(`コントラクト呼び出し開始: getLink(${linkId})`);
      const linkData = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: LINK_CREATOR_ABI,
        functionName: 'getLink',
        args: [linkId]
      }) as LinkData;
      
      console.log(`コントラクト呼び出し成功:`, safeStringify(linkData));
      
      // リンクが存在しない場合
      if (linkData.linkId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log(`リンクが見つかりません: ${id}`);
        return NextResponse.json(
          { error: 'リンクが見つかりません', message: 'このリンクは存在しないか、すでに利用されています' },
          { status: 404 }
        );
      }
      
      // トークン情報の取得
      const tokenAddress = linkData.tokenAddress.toLowerCase() as string;
      console.log(`トークンアドレス: ${tokenAddress}`);
      
      const tokenInfo = TOKEN_SYMBOLS[tokenAddress] || {
        symbol: "不明なトークン",
        decimals: 18
      };
      console.log(`トークン情報: ${tokenInfo.symbol} (${tokenInfo.decimals}桁)`);
      
      // レスポンスデータの作成
      const linkDataFormatted = {
        id,
        linkId: linkData.linkId,
        creator: linkData.creator,
        tokenAddress: linkData.tokenAddress,
        amount: formatUnits(linkData.amount, tokenInfo.decimals),
        token: tokenInfo.symbol,
        expiration: Number(linkData.expiration),
        claimer: linkData.claimer,
        status: linkData.status,
        claimData: linkData.claimData,
        createdAt: Number(linkData.createdAt),
        claimedAt: Number(linkData.claimedAt),
        isNft: false // NFTの判定ロジックが必要な場合は追加
      };
      
      console.log(`API呼び出し成功: レスポンス準備完了`);
      console.log(`API処理完了時間: ${Date.now() - startTime}ms`);
      return NextResponse.json(linkDataFormatted);
    } catch (contractError: any) {
      console.error(`コントラクト呼び出しエラー:`, contractError);
      
      // 緊急フォールバック：Redisからデータを試みて取得
      try {
        console.log(`Redisからデータ取得を試みます: ${id}`);
        const redisResponse = await fetch(`${req.nextUrl.origin}/api/links/store?id=${id}`);
        if (redisResponse.ok) {
          const redisData = await redisResponse.json();
          if (redisData && Object.keys(redisData).length > 0) {
            console.log(`Redis経由でデータ取得成功`);
            
            // 最小限のレスポンスデータを作成
            const fallbackData = {
              id,
              linkId: redisData.linkId || id,
              creator: redisData.creator || "0x0000000000000000000000000000000000000000",
              tokenAddress: "0x0000000000000000000000000000000000000000",
              amount: redisData.amount || "0",
              token: "ETH",
              expiration: 0,
              claimer: "0x0000000000000000000000000000000000000000",
              status: 0,
              claimData: "0x",
              createdAt: 0,
              claimedAt: 0,
              isNft: false,
              isFallback: true // フォールバックであることを示すフラグ
            };
            
            return NextResponse.json(fallbackData);
          }
        }
      } catch (redisError) {
        console.error(`Redisフォールバック取得エラー:`, redisError);
      }
      
      // リンクが存在しない場合は404エラーを返す
      if (contractError.message && (
        contractError.message.includes("Link does not exist") || 
        contractError.message.includes("not found") ||
        contractError.message.includes("Invalid")
      )) {
        return NextResponse.json(
          { error: 'リンクが見つかりません', message: 'このリンクは存在しないか、既に利用されています' },
          { status: 404 }
        );
      }
      
      // その他のエラーは500エラーを返す
      console.error(`エラーメッセージ: ${contractError.message}`);
      throw new Error(`コントラクト呼び出しエラー: ${contractError.message}`);
    }
  } catch (error: any) {
    console.error('リンク情報の取得に失敗しました:', error);
    console.error(`エラータイプ: ${error.name}`);
    console.error(`エラーメッセージ: ${error.message}`);
    
    return NextResponse.json(
      { error: error.message || 'リンク情報の取得に失敗しました', message: '処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 