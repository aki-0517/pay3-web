import { NextRequest, NextResponse } from 'next/server';

// Paymasterエンドポイントへの環境変数が必要です
const PAYMASTER_ENDPOINT = process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT;

/**
 * Paymasterサービスへのプロキシーエンドポイント
 * フロントエンドからPaymasterエンドポイントを隠蔽するため
 */
export async function POST(request: NextRequest) {
  try {
    if (!PAYMASTER_ENDPOINT) {
      return NextResponse.json(
        { error: 'Paymaster endpoint is not configured' },
        { status: 500 }
      );
    }

    // リクエストボディを取得
    const body = await request.json();

    // Paymasterサービスにリクエストを転送
    const response = await fetch(PAYMASTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Paymasterからのレスポンスを返す
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Paymaster proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process paymaster request' },
      { status: 500 }
    );
  }
} 