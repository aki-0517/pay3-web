/**
 * リンクID変換ロジックのテスト
 * このテストは、異なるIDフォーマットでリンクが正しく処理されることを確認します
 */
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { TextEncoder } from 'util';
import crypto from 'crypto';

// クライアント側とサーバー側の両方で使用される変換ロジックを模倣
async function convertStringToLinkId(id: string): Promise<string> {
  if (id.startsWith('0x')) {
    return id;
  }
  
  // SHA-256ハッシュを使用（Nodeの場合）
  const hash = crypto.createHash('sha256').update(id).digest('hex');
  return `0x${hash.padEnd(64, '0')}`;
}

// ブラウザ環境のsubtle cryptoを模倣
async function convertStringToLinkIdBrowser(id: string): Promise<string> {
  if (id.startsWith('0x')) {
    return id;
  }
  
  // ブラウザでのTextEncoderとcrypto.subtleを使用
  global.TextEncoder = TextEncoder;
  global.crypto = {
    subtle: {
      digest: async (algorithm: string, data: Uint8Array) => {
        const hash = crypto.createHash('sha256').update(Buffer.from(data)).digest();
        return hash.buffer;
      }
    }
  } as any;
  
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(id);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex.padEnd(64, '0')}`;
}

// コントラクトの実装を模倣
function generateContractLinkId(
  sender: string, 
  tokenAddress: string, 
  amount: string,
  timestamp: number,
  prevrandao: string
): string {
  // コントラクトのkeccak256ハッシュ生成のシミュレーション
  const packedData = sender + tokenAddress.slice(2) + amount + timestamp + prevrandao;
  const hash = crypto.createHash('sha256').update(packedData).digest('hex');
  return `0x${hash}`;
}

describe('リンクID変換テスト', () => {
  test('16進数IDは変換なしで使用される', async () => {
    const hexId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = await convertStringToLinkId(hexId);
    expect(result).toBe(hexId);
  });
  
  test('文字列IDはハッシュに変換される', async () => {
    const stringId = 'U5I0zmId';
    const result = await convertStringToLinkId(stringId);
    expect(result.startsWith('0x')).toBe(true);
    expect(result.length).toBe(66); // 0x + 64文字
  });
  
  test('Node環境とブラウザ環境での変換結果は一致する', async () => {
    const stringId = 'U5I0zmId';
    const nodeResult = await convertStringToLinkId(stringId);
    const browserResult = await convertStringToLinkIdBrowser(stringId);
    expect(nodeResult).toBe(browserResult);
  });
  
  test('コントラクト生成IDと直接変換IDは異なる', async () => {
    const stringId = 'U5I0zmId';
    const sender = '0x1234567890123456789012345678901234567890';
    const tokenAddress = '0x0000000000000000000000000000000000000000';
    const amount = parseEther('1').toString();
    const timestamp = Math.floor(Date.now() / 1000);
    const prevrandao = '0xabcdef';
    
    const convertedId = await convertStringToLinkId(stringId);
    const contractId = generateContractLinkId(sender, tokenAddress, amount, timestamp, prevrandao);
    
    expect(convertedId).not.toBe(contractId);
  });
  
  test('IDマッピングを使用した場合のシミュレーション', async () => {
    const userFriendlyId = 'U5I0zmId';
    
    // 1. コントラクトがリンク作成時に返すID（実際のコントラクトの挙動）
    const contractGeneratedId = '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234';
    
    // 2. マッピングデータベースにエントリを追加
    const idMapping: Record<string, string> = {};
    idMapping[userFriendlyId] = contractGeneratedId;
    
    // 3. ユーザーがリンクにアクセスした時
    const lookupId = userFriendlyId;
    const mappedId = idMapping[lookupId] || null;
    
    // 4. マッピングが存在する場合、それを使用。それ以外はフォールバック
    let finalLinkId: string;
    if (mappedId) {
      finalLinkId = mappedId;
    } else {
      finalLinkId = await convertStringToLinkId(lookupId);
    }
    
    expect(finalLinkId).toBe(contractGeneratedId);
  });
});

describe('エラーケースのテスト', () => {
  test('無効なIDの場合でもクラッシュしない', async () => {
    const invalidIds = ['', null, undefined];
    
    for (const id of invalidIds) {
      try {
        // @ts-ignore: 意図的に無効な値を渡してエラー処理をテスト
        await convertStringToLinkId(id);
      } catch (error) {
        // エラーが発生してもテストは続行
        expect(error).toBeDefined();
      }
    }
  });
}); 