import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { redis } from '@/lib/redis';

// テスト用の仮想データベース（本番では実際のデータベースを使用）
// userFriendlyId -> actual contract linkId のマッピング
const linkIdMapping: Record<string, string> = {};

// LinkCreator ABIの定義（イベント取得用）
const LINK_CREATOR_ABI = [
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
  }
] as const;

// コントラクトアドレスの設定
const LINK_CREATOR_ADDRESS = {
  [base.id]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_MAINNET || "0x1234567890123456789012345678901234567890",
  [baseSepolia.id]: process.env.NEXT_PUBLIC_LINK_CREATOR_ADDRESS_SEPOLIA || "0x893AeF7d7FC2E06Eac6C138DD7b6E7e9aEE3022A"
};

/**
 * リンク情報の保存と取得を処理するAPI
 */
export async function POST(req: Request) {
  try {
    const { linkId, amount, txHash } = await req.json()

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkIdが必要です' },
        { status: 400 }
      )
    }

    // リンク情報をRedisに保存
    await redis.hset(`link:${linkId}`, {
      linkId,
      amount: amount || '0',
      txHash: txHash || '',
      createdAt: new Date().toISOString(),
    })

    console.log(`リンク保存完了: ${linkId}`)

    return NextResponse.json({ success: true, linkId })
  } catch (error) {
    console.error('リンク保存エラー:', error)
    return NextResponse.json(
      { error: 'リンク情報の保存に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'IDパラメータが必要です' },
        { status: 400 }
      )
    }

    // Redisからリンク情報を取得
    const linkData = await redis.hgetall(`link:${id}`)

    if (!linkData || Object.keys(linkData).length === 0) {
      console.log(`リンクが見つかりません: ${id}`)
      return NextResponse.json(
        { error: 'リンクが存在しません' },
        { status: 404 }
      )
    }

    console.log(`リンク取得成功: ${id}`, linkData)
    return NextResponse.json(linkData)
  } catch (error) {
    console.error('リンク取得エラー:', error)
    return NextResponse.json(
      { error: 'リンク情報の取得に失敗しました' },
      { status: 500 }
    )
  }
} 