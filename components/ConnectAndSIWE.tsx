'use client';
import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, usePublicClient, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { cbWalletConnector } from "@/wagmi";
import { generateNonce } from "siwe";

export function ConnectAndSIWE() {
  const { connect } = useConnect({
    mutation: {
      onSuccess: async (data) => {
        const address = data.accounts[0];
        const chainId = data.chainId;
        
        const nonce = await generateNonce();
        
        const m = new SiweMessage({
          domain: window.location.host,
          address,
          chainId,
          uri: window.location.origin,
          version: "1",
          statement: "Smart Wallet SIWE Example",
          nonce: nonce,
          issuedAt: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
        });
        
        setMessage(m);
        signMessage({ message: m.prepareMessage() });
      },
    },
  });
  const account = useAccount();
  const client = usePublicClient();
  const [signature, setSignature] = useState<Hex | undefined>(undefined);
  const { signMessage } = useSignMessage({
    mutation: { onSuccess: (sig) => setSignature(sig) },
  });
  const [message, setMessage] = useState<SiweMessage | undefined>(undefined);
  const [valid, setValid] = useState<boolean | undefined>(undefined);
 
  const checkValid = useCallback(async () => {
    if (!signature || !account.address || !client || !message) return;

    try {
      const isValid = await client.verifyMessage({
        address: account.address,
        message: message.prepareMessage(),
        signature,
      });
      setValid(isValid);
      
      if (isValid) {
        console.log("SIWE検証成功");
      }
    } catch (error) {
      console.error("SIWE検証エラー:", error);
      setValid(false);
    }
  }, [signature, account, client, message]);
 
  useEffect(() => {
    checkValid();
  }, [signature, account]);
 
  return (
    <div>
      <button onClick={() => connect({ connector: cbWalletConnector })}>
        Connect + SIWE
      </button>
      {valid != undefined && <p> Is valid: {valid.toString()} </p>}
    </div>
  );
} 