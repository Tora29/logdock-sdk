/**
 * LogDock TypeScript SDK
 *
 * スタックトレースからソースコードの位置情報（ファイル、行番号、関数名）を
 * 自動的にキャプチャし、LogDock APIにログを送信します。
 */

import type { LogDockConfig, LogEntry, CallerInfo, LogLevel } from './types'

export class LogDockLogger {
  private config: LogDockConfig

  constructor(config: LogDockConfig) {
    // Set default userId to 'system' if not provided
    this.config = {
      ...config,
      defaultUserId: config.defaultUserId ?? 'system'
    }
  }

  /**
   * DEBUGメッセージをログに記録
   */
  debug(message: string, userId?: string, metadata?: Record<string, any>) {
    this.log('DEBUG', message, userId, metadata)
  }

  /**
   * INFOメッセージをログに記録
   */
  info(message: string, userId?: string, metadata?: Record<string, any>) {
    this.log('INFO', message, userId, metadata)
  }

  /**
   * WARNメッセージをログに記録
   */
  warn(message: string, userId?: string, metadata?: Record<string, any>) {
    this.log('WARN', message, userId, metadata)
  }

  /**
   * ERRORメッセージをログに記録
   */
  error(message: string, userId?: string, metadata?: Record<string, any>) {
    this.log('ERROR', message, userId, metadata)
  }

  /**
   * 呼び出し元情報を自動抽出するコアロギング関数
   */
  private async log(
    level: LogLevel,
    message: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const callerInfo = this.getCallerInfo()

    // Resolve user ID with priority:
    // 1. Explicitly provided userId
    // 2. getUserId callback
    // 3. defaultUserId
    let resolvedUserId = userId
    if (!resolvedUserId && this.config.getUserId) {
      try {
        resolvedUserId = await this.config.getUserId()
      } catch (error) {
        if (this.config.debug) {
          console.error('[LogDock] getUserId callback failed:', error)
        }
      }
    }
    if (!resolvedUserId) {
      resolvedUserId = this.config.defaultUserId
    }

    const entry: LogEntry = {
      app: this.config.app,
      level,
      message,
      user_id: resolvedUserId,
      ...callerInfo,
      metadata,
      ts: Date.now()
    }

    // Fire and forget - don't await to avoid blocking
    void this.send(entry)
  }

  /**
   * スタックトレースから呼び出し元情報を抽出
   *
   * スタックトレースの例:
   *   Error
   *     at LogDockLogger.getCallerInfo (logger.ts:70:15)
   *     at LogDockLogger.log (logger.ts:55:28)
   *     at LogDockLogger.error (logger.ts:40:10)
   *     at processPayment (payment.ts:123:12)  ← これを取得したい！
   */
  private getCallerInfo(): CallerInfo {
    try {
      const stack = new Error().stack
      if (!stack) return {}

      const stackLines = stack.split('\n')

      // Find the first line that's NOT from this logger file
      // Typically: stackLines[0] = "Error"
      //            stackLines[1] = "at LogDockLogger.getCallerInfo"
      //            stackLines[2] = "at LogDockLogger.log"
      //            stackLines[3] = "at LogDockLogger.error/warn/info/debug"
      //            stackLines[4] = "at <actual caller>" ← This is what we want!

      const callerLine = stackLines[4] || stackLines[3] || ''

      // Parse different stack trace formats:
      // Node.js:  "at functionName (file.js:123:45)"
      // Browser:  "at functionName (http://localhost:3000/file.js:123:45)"

      // Try pattern 1: "at functionName (filepath:line:col)"
      let match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/)

      if (!match) {
        // Try pattern 2: "at filepath:line:col" (arrow functions, anonymous)
        match = callerLine.match(/at\s+(.+?):(\d+):\d+/)
        if (match) {
          return {
            file: this.cleanFilePath(match[1]),
            line_number: parseInt(match[2])
          }
        }
      }

      if (match) {
        return {
          method: this.cleanMethodName(match[1]),
          file: this.cleanFilePath(match[2]),
          line_number: parseInt(match[3])
        }
      }

      return {}
    } catch (error) {
      if (this.config.debug) {
        console.error('[LogDock] Failed to extract caller info:', error)
      }
      return {}
    }
  }

  /**
   * メソッド名をクリーンにする（パッケージプレフィックスを削除）
   * "Object.processPayment" -> "processPayment"
   */
  private cleanMethodName(method: string): string {
    const parts = method.split('.')
    return parts[parts.length - 1]
  }

  /**
   * ファイルパスをクリーンにする
   * "/Users/foo/project/src/payment.ts" -> "src/payment.ts"
   * "http://localhost:3000/src/payment.ts" -> "src/payment.ts"
   * "webpack-internal:///./src/payment.ts" -> "src/payment.ts"
   */
  private cleanFilePath(filePath: string): string {
    // Remove URL protocol
    filePath = filePath.replace(/^https?:\/\/[^/]+\//, '')

    // Remove webpack-internal prefix
    filePath = filePath.replace(/^webpack-internal:\/\/\/\.\//, '')

    // Get relative path from common project roots
    const srcIndex = filePath.indexOf('/src/')
    if (srcIndex >= 0) {
      return filePath.substring(srcIndex + 1)
    }

    const appIndex = filePath.indexOf('/app/')
    if (appIndex >= 0) {
      return filePath.substring(appIndex + 1)
    }

    // Return filename only if no src/app found
    const parts = filePath.split('/')
    return parts[parts.length - 1]
  }

  /**
   * ログエントリをLogDock APIに送信
   */
  private async send(entry: LogEntry) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.apiKey
      }

      // Add Cloudflare Access headers if provided
      if (this.config.cfAccessClientId) {
        headers['CF-Access-Client-Id'] = this.config.cfAccessClientId
      }
      if (this.config.cfAccessClientSecret) {
        headers['CF-Access-Client-Secret'] = this.config.cfAccessClientSecret
      }

      const response = await fetch(`${this.config.apiUrl}/v1/logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry)
      })

      if (!response.ok && this.config.debug) {
        console.error('[LogDock] Failed to send log:', await response.text())
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[LogDock] Network error:', error)
      }
    }
  }
}

/**
 * 新しいLogDockロガーインスタンスを作成
 */
export function createLogger(config: LogDockConfig): LogDockLogger {
  return new LogDockLogger(config)
}
