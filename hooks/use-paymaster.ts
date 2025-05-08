import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCapabilities } from 'wagmi';

/**
 * Paymasterサポートを制御するカスタムフック
 * Coinbase Smart Walletの場合にPaymasterを有効化し、トランザクションのスポンサーシップを可能にする
 */
export function usePaymaster() {
  const { address, chainId } = useAccount();
  
  // ウォレットのサポートしている機能を取得
  const { data: availableCapabilities } = useCapabilities({
    account: address,
  });

  // PaymasterサービスのURL
  // APIルートを使ってプロキシする
  const PAYMASTER_URL = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/paymaster` 
    : '';

  // PaymasterのCapabilities
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !chainId) return {};
    
    // 特定のチェーンのPaymaster機能をチェック
    const capabilitiesForChain = availableCapabilities[chainId];
    
    // PaymasterServiceがサポートされているか確認
    if (
      capabilitiesForChain?.["paymasterService"] && 
      capabilitiesForChain["paymasterService"].supported
    ) {
      return {
        paymasterService: {
          url: PAYMASTER_URL
        },
      };
    }
    
    return {};
  }, [availableCapabilities, chainId, PAYMASTER_URL]);

  return { capabilities, hasPaymasterSupport: Object.keys(capabilities).length > 0 };
} 