/**
 * LogDock TypeScript SDK - 型定義
 */

/**
 * ログレベル
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

/**
 * LogDockに送信するログエントリ
 */
export interface LogEntry {
  /** アプリケーション名 */
  app: string
  /** ログレベル */
  level: LogLevel
  /** ログメッセージ */
  message: string
  /** ユーザーID（オプション） */
  user_id?: string
  /** メソッド/関数名（自動キャプチャ） */
  method?: string
  /** ソースファイルパス（自動キャプチャ） */
  file?: string
  /** 行番号（自動キャプチャ） */
  line_number?: number
  /** 追加のメタデータ */
  metadata?: Record<string, any>
  /** ミリ秒単位のタイムスタンプ（未提供の場合は自動設定） */
  ts?: number
}

/**
 * LogDockクライアント設定
 */
export interface LogDockConfig {
  /** LogDock API URL（例: "http://localhost:8088/api"） */
  apiUrl: string
  /** 認証用APIキー */
  apiKey: string
  /** アプリケーション名 */
  app: string
  /** デフォルトユーザーID（デフォルト: 'system'、ログごとにオーバーライド可能） */
  defaultUserId?: string
  /**
   * ユーザーID取得関数（オプション）
   * 各ログエントリに対して自動的に呼び出され、現在のユーザーIDを取得
   * defaultUserIdより優先されるが、明示的なuserIdパラメータでオーバーライド可能
   */
  getUserId?: () => Promise<string> | string
  /** デバッグ用のコンソール出力を有効化（デフォルト: false） */
  debug?: boolean
  /** Cloudflare Access クライアントID（オプション、保護されたエンドポイント用） */
  cfAccessClientId?: string
  /** Cloudflare Access クライアントシークレット（オプション、保護されたエンドポイント用） */
  cfAccessClientSecret?: string
}

/**
 * スタックトレースから抽出された呼び出し元情報
 */
export interface CallerInfo {
  method?: string
  file?: string
  line_number?: number
}
