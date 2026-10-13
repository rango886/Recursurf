import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/** 仓库根目录（内置函数库 lib/ 在这里） */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** 全局目录：~/.rsf，可用 RSF_HOME 覆盖 */
export const RSF_HOME = process.env.RSF_HOME || path.join(os.homedir(), '.rsf')

export const DAEMON_FILE = path.join(RSF_HOME, 'daemon.json')
export const CONFIG_FILE = path.join(RSF_HOME, 'config.json')
export const DEFAULT_PORT = Number(process.env.RSF_PORT || 9777)

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true })
  return p
}

/** 项目级目录：从 cwd 向上找 .rsf 目录 */
export function findProjectDir(start = process.cwd()): string | null {
  let dir = path.resolve(start)
  while (true) {
    const cand = path.join(dir, '.rsf')
    if (cand !== RSF_HOME && fs.existsSync(cand) && fs.statSync(cand).isDirectory()) return cand
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** 按优先级返回函数库目录：项目级 → 全局 → 内置 */
export function searchDirs(kind: 'lib', cwd = process.cwd()): { scope: string; dir: string }[] {
  const out: { scope: string; dir: string }[] = []
  const proj = findProjectDir(cwd)
  if (proj) out.push({ scope: 'project', dir: path.join(proj, kind) })
  out.push({ scope: 'global', dir: path.join(RSF_HOME, kind) })
  out.push({ scope: 'builtin', dir: path.join(REPO_ROOT, kind) })
  return out.filter(d => fs.existsSync(d.dir))
}

export interface RsfConfig {
  browsers?: { name: string; cdp?: string; launch?: LaunchOpts }[]
  port?: number
}
export interface LaunchOpts {
  executable?: string
  headless?: boolean
  port?: number
  profile?: string
  args?: string[]
}

export function readConfig(): RsfConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return {}
  }
}
