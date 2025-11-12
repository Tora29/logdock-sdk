#!/usr/bin/env node

/**
 * LogDock SDK Initialization Script
 *
 * 手動でLogDockの初期化を実行するためのスクリプト
 * Usage: npx @tora29/logdock-client init
 */

const { main } = require('./postinstall');

// Force regeneration when called directly
process.env.LOGDOCK_FORCE_INIT = 'true';
main();