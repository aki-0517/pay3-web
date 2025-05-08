# Coinbase Smart Wallet with Paymaster サポート

このプロジェクトはCoinbase Smart Walletを使用して暗号資産を受け取るための実装に、Paymasterサポートを追加したものです。ユーザーはガス代を支払うことなく、暗号資産を受け取ることができます。

## 機能

- Coinbase Smart Walletでの接続
- Base Sepoliaネットワークでの暗号資産の受け取り
- Paymasterによるガス代のスポンサー化
- ガスレストランザクション

## 設定方法

1. 環境変数の設定

以下の環境変数を`.env.local`ファイルに設定してください：

```
# Coinbase Developer PlatformのPaymasterエンドポイント
NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT="https://api.developer.coinbase.com/rpc/v1/base-sepolia/your_endpoint_here"

# Coinbase Developer PlatformのAPIキー（オプション）
NEXT_PUBLIC_CDP_API_KEY="your_cdp_api_key_here"

# WalletConnectのプロジェクトID（必須）
NEXT_PUBLIC_WC_PROJECT_ID="your_walletconnect_project_id_here"
```

2. コントラクトのホワイトリスト登録

Coinbase Developer Platform (CDP)にアクセスし、以下の設定を行ってください：

- Onchain Tools > Paymasterセクションに移動
- Base Sepoliaネットワークを選択
- コントラクトアドレスをホワイトリストに追加：
  - `0x67c97D1FB8184F038592b2109F854dfb09C77C75` (LinkCreator)
- 許可する関数を指定：`claimLink`

3. 依存関係のインストール

```bash
npm install
# または
yarn install
```

4. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

## PaymasterとCoinbase Smart Walletの連携

このアプリケーションは以下の方法でPaymasterとCoinbase Smart Walletを連携しています：

1. `usePaymaster` フック - Smart Walletの機能を検出し、Paymaster機能を有効化
2. Paymasterプロキシエンドポイント - CDPのPaymasterエンドポイントへの安全なプロキシ
3. `useWriteContracts` - Paymasterの機能を使ったトランザクション実行

## 技術スタック

- Next.js
- Wagmi
- Viem
- Coinbase Wallet SDK
- TypeScript
- Tailwind CSS
- shadcn/ui

## 注意事項

- このアプリケーションはBase Sepoliaテストネットで動作します
- 本番環境ではBase Mainnetに切り替えてください
- 実際のプロダクション用途ではPaymasterエンドポイントをプロキシサーバーで保護することをお勧めします 