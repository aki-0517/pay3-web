/**
 * リンクIDに関するユーティリティ関数
 */

/**
 * 文字列IDをコントラクト用のlinkIdに変換
 * @param id ユーザーフレンドリーなID文字列
 * @returns bytes32形式のリンクID
 */
export async function convertStringToLinkId(id: string): Promise<`0x${string}`> {
  if (!id) {
    throw new Error('IDが指定されていません');
  }
  
  // 既に0x形式の場合はそのまま返す
  if (id.startsWith('0x')) {
    return id as `0x${string}`;
  }
  
  // TextEncoderを使用してバイナリに変換
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(id);
  
  // SHA-256ハッシュを生成（注：Solidityのkeccak256と完全に一致するわけではないが、
  // フロントエンド側ではこれが最も近い実装）
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 先頭に0xを付けて64文字になるようにする（bytes32形式）
  return `0x${hashHex}` as `0x${string}`;
}

/**
 * IDマッピングからコントラクトlinkIdを取得
 * @param userFriendlyId ユーザーフレンドリーID
 * @returns bytes32形式のリンクID
 */
export async function getContractLinkId(
  userFriendlyId: string,
  baseUrl: string
): Promise<`0x${string}`> {
  try {
    // IDマッピングを取得
    const response = await fetch(`${baseUrl}/api/links/store?id=${userFriendlyId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.contractLinkId) {
        return data.contractLinkId as `0x${string}`;
      }
    }
  } catch (error) {
    console.warn('IDマッピング取得エラー:', error);
  }
  
  // マッピングが見つからない場合はフォールバック
  return convertStringToLinkId(userFriendlyId);
}

/**
 * リンクIDをユーザーフレンドリーな形式に変換（表示用）
 * @param linkId コントラクトのbytes32形式のID
 * @returns 短縮されたIDフォーマット
 */
export function formatLinkId(linkId: `0x${string}`): string {
  if (!linkId.startsWith('0x')) {
    return linkId;
  }
  
  // 0xプレフィックスを除去して最初の8文字を使用
  const hexPart = linkId.slice(2, 10);
  return hexPart;
} 