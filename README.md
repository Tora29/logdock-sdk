# LogDock TypeScript SDK

LogDock 用 TypeScript/JavaScript SDK

## 特徴

- ✅ **自動呼び出し元検出**: ファイルパス、行番号、関数名を自動取得
- ✅ **型安全**: TypeScript サポート
- ✅ **メタデータ対応**: 任意のJSONデータを添付可能
- ✅ **ノンブロッキング**: 非同期でログ送信（アプリの処理を妨げない）
- ✅ **Cloudflare Access対応**: サービストークン認証サポート
- ✅ **自動セットアップ**: npm install時に`lib/logger.ts`を自動生成

## クイックスタート

### 1. SDKをインストール

```bash
npm install @tora29/logdock-client
# または
yarn add @tora29/logdock-client
```

インストール時に自動的に：
- 📁 `lib/logger.ts`が生成されます（既存ファイルは上書きしません）
- 📝 `.env.example`にLogDock設定が追加されます

手動で初期化する場合：
```bash
npx logdock-init
```

### 2. 環境変数を設定

`.env.local`に以下を追加：
```env
LOGDOCK_API_URL=http://localhost:8080
LOGDOCK_API_KEY=your-api-key-here
LOGDOCK_APP_NAME=my-app
```

### 3. 使う

```typescript
// app/api/route.ts
import { logger } from '@/lib/logger'

export async function GET() {
  logger.info('API called')
  return Response.json({ ok: true })
}
```

完了！ログが `https://logdock.net` に送信されます。

## 使い方

### 1. 自動生成されたロガーを使用

npm install時に`lib/logger.ts`が自動生成されます。環境変数で設定を調整：

```env
# .env.local
LOGDOCK_API_URL=http://localhost:8080
LOGDOCK_API_KEY=your-api-key
LOGDOCK_APP_NAME=my-app

# Cloudflare Access（本番環境）
CF_ACCESS_CLIENT_ID=your-client-id
CF_ACCESS_CLIENT_SECRET=your-client-secret
```

### 2. カスタマイズする場合

自動生成された`lib/logger.ts`を編集してカスタマイズできます：

```typescript
// lib/logger.ts (自動生成されたファイルを編集)
import { createLogger } from '@tora29/logdock-client'

export const logger = createLogger({
  apiUrl: process.env.LOGDOCK_API_URL!,
  apiKey: process.env.LOGDOCK_API_KEY!,
  app: 'my-nextjs-app',
  debug: process.env.NODE_ENV === 'development',

  // 動的にユーザーIDを取得
  getUserId: async () => {
    const session = await getSession()
    return session?.user?.id
  }
})
```

### 3. Next.jsアプリケーションで使用

#### API Routes（サーバーサイド）

```typescript
// app/api/payment/route.ts
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json()

    // 決済処理...

    // ✅ 自動的に file="app/api/payment/route.ts", line=12, method="POST" が取得される
    logger.info('Payment processed', userId, { amount })

    return NextResponse.json({ success: true })
  } catch (error) {
    // ✅ エラー発生箇所が自動的に記録される
    logger.error('Payment failed', userId, {
      error: error.message,
      amount
    })

    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
```

#### Server Actions

```typescript
// app/actions/user.ts
'use server'

import { logger } from '@/lib/logger'

export async function updateUserProfile(userId: string, data: any) {
  try {
    // データベース更新...

    logger.info('User profile updated', userId, { fields: Object.keys(data) })

    return { success: true }
  } catch (error) {
    logger.error('Failed to update profile', userId, { error: error.message })
    throw error
  }
}
```

#### Middleware

```typescript
// middleware.ts
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value

  // すべてのリクエストをログ記録
  logger.info(`${request.method} ${request.nextUrl.pathname}`, userId)

  return NextResponse.next()
}
```

## API

### `createLogger(config: LogDockConfig): LogDockLogger`

新しいロガーインスタンスを作成します。

**設定オプション:**
```typescript
{
  apiUrl: string          // LogDock API URL
  apiKey: string          // 認証用APIキー
  app: string             // アプリケーション名
  defaultUserId?: string  // デフォルトユーザーID（オプション）
  debug?: boolean         // デバッグ用コンソール出力を有効化
}
```

### ロガーメソッド

#### `logger.debug(message, userId?, metadata?)`
DEBUGレベルのログを記録

#### `logger.info(message, userId?, metadata?)`
INFOレベルのログを記録

#### `logger.warn(message, userId?, metadata?)`
WARNレベルのログを記録

#### `logger.error(message, userId?, metadata?)`
ERRORレベルのログを記録

**パラメータ:**
- `message` (string): ログメッセージ
- `userId` (string, オプション): ユーザーID
- `metadata` (object, オプション): 追加データ

## 仕組み

SDKはJavaScriptのスタックトレースを使って、呼び出し元情報を自動取得します：

```typescript
function processPayment() {
  logger.error('Payment failed', 'user_123')

  // ↓ 自動的に以下が送信される:
  // {
  //   "app": "my-nextjs-app",
  //   "level": "ERROR",
  //   "message": "Payment failed",
  //   "user_id": "user_123",
  //   "method": "processPayment",           ← 自動取得！
  //   "file": "src/services/payment.ts",    ← 自動取得！
  //   "line_number": 45,                    ← 自動取得！
  //   "ts": 1234567890123
  // }
}
```

## 環境変数

### ローカル開発環境

`.env.local` に追加：

```bash
LOGDOCK_API_URL=http://localhost:8088/api
LOGDOCK_API_KEY=changeme
```

## User IDの扱い

SDKは`defaultUserId`を自動的に'system'に設定します。これにより、すべてのログにUser IDが含まれ、システムログとユーザーログを簡単に区別できます。

```typescript
// User IDを指定しない場合 → 'system'が自動設定
logger.info('Server started')          // user_id: 'system'
logger.error('Database error')         // user_id: 'system'

// 明示的に指定した場合 → 指定した値を使用
logger.info('User logged in', 'user_123')  // user_id: 'user_123'

// カスタムデフォルトを設定することも可能
const logger = createLogger({
  // ...
  defaultUserId: 'anonymous'  // 'system'以外にしたい場合
})
```

### フィルタリングの例
Web UIやクエリで以下のように使い分けできます：
- `user_id = 'system'` - システムログのみ表示
- `user_id != 'system'` - ユーザー操作のみ表示
- `user_id = 'user_123'` - 特定ユーザーのログ

## 使用例

### 基本的なログ記録
```typescript
logger.info('User logged in', 'user_123')
```

### メタデータ付き
```typescript
logger.error('Database query failed', 'user_456', {
  query: 'SELECT * FROM users',
  duration_ms: 5000
})
```

### システムログ（User ID自動設定）
```typescript
logger.warn('High memory usage', undefined, {
  memory_mb: 512
})  // user_id: 'system'が自動設定される
```

## TypeScript サポート

完全な型チェックと自動補完：

```typescript
import type { LogLevel, LogEntry } from '@logdock/client'

const level: LogLevel = 'ERROR'  // ✅ 型安全
const level: LogLevel = 'FATAL'  // ❌ 型エラー！
```

## ライセンス

MIT
