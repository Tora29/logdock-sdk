/**
 * LogDock TypeScript SDK
 *
 * Next.jsおよびその他のTypeScript/JavaScriptアプリケーション用のシンプルでタイプセーフなロギング。
 * ソースコードの位置情報（ファイル、行番号、関数名）を自動的にキャプチャします。
 */

export { LogDockLogger, createLogger } from './logger'
export type { LogDockConfig, LogEntry, LogLevel, CallerInfo } from './types'
