import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

// PaymasterおよびBundlerのエンドポイント
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT;

export const cbWalletConnector = coinbaseWallet({
  appName: "Wagmi Smart Wallet",
  preference: "smartWalletOnly",
});

export const config = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [cbWalletConnector],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
} 