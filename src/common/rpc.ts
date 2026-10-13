import WebSocket from 'ws'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DAEMON_FILE, RSF_HOME, ensureDir } from './paths.ts'
import { RsfError, sleep } from './util.ts'

interface DaemonInfo {
  port: number
  token: string
  pid: number
}

export function readDaemonInfo(): DaemonInfo | null {
  try {
    return JSON.parse(fs.readFileSync(DAEMON_FILE, 'utf8'))
  } catch {
    return null
  }
}

/** CLI / SDK 到 daemon 的 JSON-RPC 客户端 */
export class RpcClient {
  ws!: WebSocket
  private seq = 0
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>()

  static async connect(opts: { autostart?: boolean } = {}): Promise<RpcClient> {
    const c = new RpcClient()
    let info = readDaemonInfo()
    if (info && (await c.tryOpen(info))) return c
    if (opts.autostart === false) throw new RsfError('NO_DAEMON', 'daemon 没有运行', '执行 `rsf daemon start`')
    startDaemonDetached()
    for (let i = 0; i < 50; i++) {
      await sleep(200)
      info = readDaemonInfo()
      if (info && (await c.tryOpen(info))) return c
    }
    throw new RsfError('NO_DAEMON', 'daemon 启动失败', `查看日志 ${path.join(RSF_HOME, 'daemon.log')}`)
  }

  private tryOpen(info: DaemonInfo): Promise<boolean> {
    return new Promise(resolve => {
      const ws = new WebSocket(`ws://127.0.0.1:${info.port}/cli?token=${info.token}`)
      ws.once('open', () => {
        this.ws = ws
        ws.on('message', d => this.onMessage(String(d)))
        ws.on('close', () => {
          for (const p of this.pending.values()) p.reject(new RsfError('DISCONNECTED', 'daemon 连接断开'))
          this.pending.clear()
        })
        resolve(true)
      })
      ws.once('error', () => resolve(false))
    })
  }

  private onMessage(raw: string) {
    const msg = JSON.parse(raw)
    const p = this.pending.get(msg.id)
    if (!p) return
    this.pending.delete(msg.id)
    if (msg.error) p.reject(new RsfError(msg.error.code || 'ERROR', msg.error.message, msg.error.hint))
    else p.resolve(msg.result)
  }

  call<T = any>(method: string, params: any = {}): Promise<T> {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.ws?.close()
  }
}

export function startDaemonDetached() {
  ensureDir(RSF_HOME)
  const log = fs.openSync(path.join(RSF_HOME, 'daemon.log'), 'a')
  // 跟着当前文件走：源码运行时是 src/daemon/main.ts，发布包里是编译后的 dist/daemon/main.js
  const ext = path.extname(fileURLToPath(import.meta.url))
  const child = spawn(process.execPath, [fileURLToPath(new URL(`../daemon/main${ext}`, import.meta.url))], {
    detached: true,
    stdio: ['ignore', log, log],
    windowsHide: true,
    env: process.env,
  })
  child.unref()
}
