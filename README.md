# LogDock TypeScript SDK

LogDock用のTypeScript/JavaScript SDKです。ファイル名・行番号・関数名を自動取得します。

## インストール

```bash
npm install @tora29/logdock-client
```

## 使い方

### 1. ロガーを作成

```typescript
// lib/logger.ts
import { createLogger } from '@tora29/logdock-client'

export const logger = createLogger({
  apiUrl: process.env.LOGDOCK_API_URL!,
  apiKey: process.env.LOGDOCK_API_KEY!,
  app: 'my-app',
})
```

### 2. 環境変数を設定

```bash
# .env.local
LOGDOCK_API_URL=https://logdock.net
LOGDOCK_API_KEY=your-api-key
```

### 3. ログを送信

```typescript
import { logger } from '@/lib/logger'

// メッセージだけ
logger.info('User logged in')

// ユーザーIDを指定
logger.info('User logged in', 'user_123')

// メタデータも追加
logger.error('Payment failed', 'user_456', {
  amount: 1000,
  reason: 'insufficient_funds'
})
```

ファイル名・行番号・関数名は自動的にキャプチャされます。

## API

### `createLogger(config)`

```typescript
{
  apiUrl: string                    // LogDock API URL
  apiKey: string                    // APIキー
  app: string                       // アプリケーション名
  defaultUserId?: string            // デフォルトユーザーID（デフォルト: 'system'）
  getUserId?: () => Promise<string> // 動的にユーザーIDを取得
  debug?: boolean                   // デバッグモード
}
```

### ロガーメソッド

```typescript
logger.debug(message, userId?, metadata?)
logger.info(message, userId?, metadata?)
logger.warn(message, userId?, metadata?)
logger.error(message, userId?, metadata?)
```

すべてのパラメータは `message` 以外オプションです。

## オプション設定

### デバッグモード

```typescript
export const logger = createLogger({
  // ...
  debug: process.env.LOGDOCK_DEBUG === 'true',
})
```

デバッグモードを有効にすると、初期化時に設定状態とエラー詳細が表示されます。

### 動的なユーザーID取得

```typescript
export const logger = createLogger({
  // ...
  getUserId: async () => {
    const session = await getSession()
    return session?.user?.id ?? 'anonymous'
  }
})
```

## ライセンス

MIT
