import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const body = await req.json();
    const { address, txHash } = body;
    
    if (!address || !txHash) {
      return NextResponse.json(
        { error: '無効なリクエスト' },
        { status: 400 }
      );
    }
    
    // 実際の実装では、ここでデータベースやイベントログにクレイム情報を記録
    console.log(`リンク ${id} がアドレス ${address} によってクレームされました。トランザクション: ${txHash}`);
    
    // 成功レスポンス
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('クレイム記録に失敗:', error);
    return NextResponse.json(
      { error: error.message || 'クレイム記録に失敗しました' },
      { status: 500 }
    );
  }
} 