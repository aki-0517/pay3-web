import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// サポートされる言語
export type Language = 'en' | 'ja';

// ローカルストレージのキー
const LANGUAGE_KEY = 'app_language';

// 言語設定のコンテキスト
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

// 言語プロバイダーのprops
type LanguageProviderProps = {
  children: ReactNode;
};

// 言語プロバイダーコンポーネント
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  // ブラウザの場合はローカルストレージから言語設定を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as Language | null;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ja')) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  // 言語を変更し、ローカルストレージに保存する
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 言語設定を使用するためのフック
export function useLanguage() {
  return useContext(LanguageContext);
}

// 翻訳用のヘルパー関数
export function t(key: string, language: Language): string {
  return translations[language][key] || translations['en'][key] || key;
}

// 翻訳データ
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // ヘッダー
    'app.title': 'Smart Wallet App',
    'app.languageSelector': 'Language',
    
    // 共通
    'common.send': 'Send',
    'common.receive': 'Receive',
    'common.history': 'History',
    'common.amount': 'Amount',
    'common.address': 'Address',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.loading': 'Loading',
    'common.connect': 'Connect Wallet',
    'common.back': 'Back',
    'common.copied': 'Copied',
    
    // 履歴ページ
    'history.link': 'Link',
    'history.expiration': 'Expiration',
    'history.claimer': 'Claimer',
    'history.claimedAt': 'Claimed at',
    'history.viewDetails': 'View Details',
    'history.token': 'Token',
    'history.createdAt': 'Created at',
    'history.qrCode': 'QR Code',
    'history.details': 'Transaction Details',
    'history.unknown': 'Unknown Token',
    'history.filter.all': 'All',
    'history.filter.active': 'Unclaimed',
    'history.filter.claimed': 'Claimed',
    'history.filter.expired': 'Expired/Canceled',
    'history.noTransactions': 'No transactions to display',
    
    // 送信ページ
    'sender.selectToken': 'Select Token',
    'sender.amount': 'Amount',
    'sender.feeNote': '※ A 0.5% fee will be deducted at the time of sending',
    'sender.expiration': 'Expiration',
    'sender.expirationPlaceholder': 'Select expiration',
    'sender.1hour': '1 hour',
    'sender.24hours': '24 hours',
    'sender.1week': '1 week',
    'sender.30days': '30 days',
    'sender.createLink': 'Create Link',
    'sender.processing': 'Processing...',
    'sender.selectNFT': 'Select NFT',
    'sender.verifying': 'Verifying...',
    'sender.verificationResult': 'Verification result:',
    'sender.success': 'Success',
    'sender.failure': 'Failure',
    'sender.connectionStatus': 'Connection status:',
    'sender.connected': 'Connected',
    'sender.notConnected': 'Not connected',
    'sender.address': 'Address:',
    'sender.none': 'None',
    
    // リンク作成完了画面
    'link.created': 'Link Created!',
    'link.shareDescription': 'Share this link to send funds (ID: {id})',
    'link.createAnother': 'Create Another Link',
    'link.loading': 'Loading link information...',
    'link.loadingId': 'Loading...',
    
    // 受け取りページ
    'receiver.title': "You've received crypto!",
    'receiver.connectPrompt': 'Connect your wallet to claim it',
    'receiver.aboutTitle': 'About Smart Wallet',
    'receiver.aboutDescription': 'Coinbase Smart Wallet is a self-custodial wallet that lets you securely store and manage your crypto assets. It uses passkeys or biometric authentication for a seamless experience without seed phrases.',
    'receiver.feature1Title': 'Easy to Use',
    'receiver.feature1Desc': "No seed phrases to remember, just use your device's biometrics",
    'receiver.feature2Title': 'Secure',
    'receiver.feature2Desc': 'Your keys are stored securely on your device',
    'receiver.feature3Title': 'No Gas Fees',
    'receiver.feature3Desc': 'We cover gas fees for your transactions',
    'receiver.connectButton': 'Connect with Coinbase Smart Wallet',
    'receiver.newUserPrompt': 'New to crypto? No problem! You can create a wallet in seconds.',
    'receiver.walletConnected': 'Wallet Connected',
    'receiver.connected': 'Connected',
    'receiver.youReceived': "You've Received",
    'receiver.from': 'From',
    'receiver.claimAsset': 'Claim Asset',
    'receiver.noGasFees': "No gas fees required. We'll cover that for you.",
    'receiver.claimSuccess': 'Asset Claimed Successfully!',
    'receiver.addedToWallet': 'has been added to your wallet',
    'receiver.viewWallet': 'View in Wallet',
    'receiver.done': 'Done',
    
    // crypto-receiveコンポーネント
    'crypto.notFound': 'Link not found',
    'crypto.notFoundDesc': 'This link is expired or invalid.',
    'crypto.linkUnavailable': 'This link is unavailable',
    'crypto.alreadyClaimed': 'This has already been claimed.',
    'crypto.expired': 'This has expired.',
    'crypto.canceled': 'This has been canceled by the sender.',
    'crypto.invalidStatus': 'This link has an invalid status.',
    'crypto.receivePrompt': 'You have received crypto from {sender}',
    'crypto.connectPrompt': 'Connect your wallet to claim it',
    'crypto.receiveSummary': 'Receive Details',
    'crypto.sender': 'Sender: {name} ({address})',
    'crypto.networkChange': 'Please change the network',
    'crypto.switchToMainnet': 'Switch to Base Mainnet',
    'crypto.switchToSepolia': 'Switch to Base Sepolia',
    'crypto.gasSponsored': 'Gas fee sponsored',
    'crypto.processing': 'Processing...',
    'crypto.claim': 'Claim',
    'crypto.feeNote': 'No gas fee required. A 0.5% fee will be deducted.',
    'crypto.gasFeeNote': 'Gas fee required. Make sure you have enough ETH in your wallet.',
    'crypto.notClaimable': 'This link cannot be claimed now. It may have been already claimed or expired.',
    'crypto.errorOccurred': 'An error occurred: {message}',
    'crypto.claimComplete': 'Claim Complete!',
    'crypto.addedToWallet': 'has been added to your wallet',
    'crypto.checkWallet': 'Check in Wallet',
    'crypto.checkTransaction': 'Check Transaction',
    'crypto.finish': 'Finish',
    'crypto.loadingError': 'Error',
    'crypto.loadFailed': 'Failed to load link information'
  },
  ja: {
    // ヘッダー
    'app.title': 'スマートウォレットアプリ',
    'app.languageSelector': '言語',
    
    // 共通
    'common.send': '送信',
    'common.receive': '受信',
    'common.history': '履歴',
    'common.amount': '金額',
    'common.address': 'アドレス',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.success': '成功',
    'common.error': 'エラー',
    'common.loading': '読み込み中',
    'common.connect': 'ウォレット接続',
    'common.back': '戻る',
    'common.copied': 'コピー済み',
    
    // 履歴ページ
    'history.link': 'リンク',
    'history.expiration': '期限',
    'history.claimer': '請求者',
    'history.claimedAt': '請求日時',
    'history.viewDetails': '詳細を見る',
    'history.token': 'トークン',
    'history.createdAt': '作成日時',
    'history.qrCode': 'QRコード',
    'history.details': '取引詳細',
    'history.unknown': '不明なトークン',
    'history.filter.all': 'すべて',
    'history.filter.active': '未請求',
    'history.filter.claimed': '請求済み',
    'history.filter.expired': '期限切れ/キャンセル',
    'history.noTransactions': '表示するトランザクションがありません',
    
    // 送信ページ
    'sender.selectToken': 'トークン選択',
    'sender.amount': '数量',
    'sender.feeNote': '※送信時に0.5%の手数料が差し引かれます',
    'sender.expiration': '有効期限',
    'sender.expirationPlaceholder': '有効期限を選択',
    'sender.1hour': '1時間',
    'sender.24hours': '24時間',
    'sender.1week': '1週間',
    'sender.30days': '30日',
    'sender.createLink': 'リンクを作成',
    'sender.processing': '処理中...',
    'sender.selectNFT': 'NFTを選択',
    'sender.verifying': '検証中...',
    'sender.verificationResult': '検証結果:',
    'sender.success': '成功',
    'sender.failure': '失敗',
    'sender.connectionStatus': '接続状態:',
    'sender.connected': '接続済み',
    'sender.notConnected': '未接続',
    'sender.address': 'アドレス:',
    'sender.none': 'なし',
    
    // リンク作成完了画面
    'link.created': 'リンク作成完了！',
    'link.shareDescription': 'このリンクを共有して、資金を送ります（ID: {id}）',
    'link.createAnother': '別のリンクを作成',
    'link.loading': 'リンク情報を読み込み中...',
    'link.loadingId': '読み込み中...',
    
    // 受け取りページ
    'receiver.title': '暗号資産を受け取りました！',
    'receiver.connectPrompt': 'ウォレットを接続して請求してください',
    'receiver.aboutTitle': 'スマートウォレットについて',
    'receiver.aboutDescription': 'Coinbaseスマートウォレットは、暗号資産を安全に保管・管理できる自己管理型ウォレットです。シードフレーズなしで、パスキーや生体認証を使用してスムーズな体験を提供します。',
    'receiver.feature1Title': '使いやすさ',
    'receiver.feature1Desc': 'シードフレーズを覚える必要なし、デバイスの生体認証だけで操作可能',
    'receiver.feature2Title': 'セキュリティ',
    'receiver.feature2Desc': '鍵はデバイスに安全に保存されます',
    'receiver.feature3Title': 'ガス代無料',
    'receiver.feature3Desc': 'トランザクションのガス代は当社が負担します',
    'receiver.connectButton': 'Coinbaseスマートウォレットで接続',
    'receiver.newUserPrompt': '暗号資産が初めてでも大丈夫！数秒でウォレットを作成できます。',
    'receiver.walletConnected': 'ウォレット接続完了',
    'receiver.connected': '接続済み',
    'receiver.youReceived': '受け取った資産',
    'receiver.from': '送信元',
    'receiver.claimAsset': '資産を請求',
    'receiver.noGasFees': 'ガス代は必要ありません。当社が負担します。',
    'receiver.claimSuccess': '資産の請求が完了しました！',
    'receiver.addedToWallet': 'がウォレットに追加されました',
    'receiver.viewWallet': 'ウォレットで表示',
    'receiver.done': '完了',
    
    // crypto-receiveコンポーネント
    'crypto.notFound': 'リンクが見つかりません',
    'crypto.notFoundDesc': 'このリンクは有効期限切れか無効です。',
    'crypto.linkUnavailable': 'このリンクは利用できません',
    'crypto.alreadyClaimed': '既に受け取り済みです。',
    'crypto.expired': '有効期限が切れています。',
    'crypto.canceled': '送金者によりキャンセルされました。',
    'crypto.invalidStatus': 'ステータスが無効です。',
    'crypto.receivePrompt': '{sender}さんから暗号資産が届いています',
    'crypto.connectPrompt': 'ウォレットを接続して受け取ってください',
    'crypto.receiveSummary': '受け取り内容',
    'crypto.sender': '送金者: {name} ({address})',
    'crypto.networkChange': 'ネットワークを変更してください',
    'crypto.switchToMainnet': 'Base Mainnetに切り替え',
    'crypto.switchToSepolia': 'Base Sepoliaに切り替え',
    'crypto.gasSponsored': 'ガス代無料（スポンサー済み）',
    'crypto.processing': '処理中...',
    'crypto.claim': '受け取る',
    'crypto.feeNote': 'ガス代は不要です。0.5%の手数料が差し引かれます',
    'crypto.gasFeeNote': 'ガス代が必要です。ウォレットに十分なETHがあることを確認してください。',
    'crypto.notClaimable': 'このリンクは現在請求できません。既に受け取られたか、期限切れの可能性があります。',
    'crypto.errorOccurred': 'エラーが発生しました: {message}',
    'crypto.claimComplete': '受け取り完了!',
    'crypto.addedToWallet': 'がウォレットに追加されました',
    'crypto.checkWallet': 'ウォレットで確認',
    'crypto.checkTransaction': 'トランザクションを確認',
    'crypto.finish': '完了',
    'crypto.loadingError': 'エラー',
    'crypto.loadFailed': 'リンク情報の取得に失敗しました'
  }
}; 