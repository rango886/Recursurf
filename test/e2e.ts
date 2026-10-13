// 端到端测试：本地测试站点 + 无头 Chrome + 真实 CLI
// 运行：npm test
import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const ROOT = path.resolve(import.meta.dirname, '..')
const HOME = path.join(ROOT, '.rsf-test', 'e2e')
const env = { ...process.env, RSF_HOME: HOME, RSF_PORT: '9799', RSF_FORMAT: '' }
delete (env as any).RSF_TAB

function rsf(...args: string[]): string {
  return execFileSync(process.execPath, [path.join(ROOT, 'bin/recursurf.js'), ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
/** 在某个目录里执行（项目级函数库生效），可以从 stdin 喂数据 */
function rsfIn(cwd: string, args: string[], input?: string): string {
  return execFileSync(process.execPath, [path.join(ROOT, 'bin/recursurf.js'), ...args], { env, cwd, encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}
function rsfErr(...args: string[]): string {
  try {
    rsf(...args)
  } catch (e: any) {
    return String(e.stderr)
  }
  throw new Error(`应该失败：rsf ${args.join(' ')}`)
}
const json = (...args: string[]) => JSON.parse(rsf(...args, '-o', 'json'))

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  const t = Date.now()
  try {
    await fn()
    passed++
    console.log(`✓ ${name} (${Date.now() - t}ms)`)
  } catch (e: any) {
    console.log(`✗ ${name}\n  ${e.message.split('\n').join('\n  ')}`)
    process.exitCode = 1
  }
}

// 测试站点放在子进程里：execFileSync 会阻塞本进程的事件循环
const child = spawn(process.execPath, [path.join(ROOT, 'test/server.ts'), '0'], { stdio: ['ignore', 'pipe', 'inherit'] })
const U: string = await new Promise(r => child.stdout!.once('data', d => r(String(d).trim())))
const srv = { close: () => child.kill() }
fs.mkdirSync(HOME, { recursive: true })

try {
  await test('启动浏览器', () => {
    const r = json('browser', 'launch', 'e2e', '--headless')
    assert.equal(r.name, 'e2e')
  })

  await test('打开标签并设为当前', () => {
    const r = json('tab', 'open', `${U}/form`)
    assert.equal(r.title, '表单测试')
    const tabs = json('tab', 'list')
    assert.ok(tabs.some((t: any) => t.id === r.id && t.cur === '*'))
  })

  await test('snapshot 给元素编号', () => {
    const s = rsf('snapshot', '-i')
    assert.match(s, /textbox "用户名" \[ref=e1\]/)
    assert.match(s, /combobox "城市" \[ref=e3\].*北京 \| 上海/)
    assert.match(s, /button "iframe 按钮" \[ref=e\d+\]/)
  })

  await test('填表 + 下拉 + 勾选 + 日期 + 上传 + 提交', () => {
    assert.equal(json('fill', 'e1', '小明').value, '小明')
    rsf('select', 'e3', '上海')
    assert.equal(json('check', 'e4').checked, true)
    assert.equal(json('fill', 'e5', '2000-01-02').value, '2000-01-02')
    rsf('upload', 'e6', path.join(ROOT, 'package.json'))
    rsf('click', 'e7')
    const out = JSON.parse(json('eval', `document.getElementById('out').textContent`))
    assert.deepEqual([out.user, out.city, out.agree, out.birthday], ['小明', 'sh', 'on', '2000-01-02'])
  })

  await test('弹窗自动处理并报告', () => {
    const r = json('click', 'e9')
    assert.match(r.changes.dialogs[0], /confirm: 确定吗/)
    assert.equal(json('eval', `document.getElementById('c').textContent`), 'yes')
  })

  await test('iframe 里的按钮可以点', () => {
    const ref = rsf('snapshot', '-i').match(/button "iframe 按钮" \[ref=(e\d+)\]/)![1]
    rsf('click', ref)
    assert.match(rsf('snapshot'), /iframe 已点/)
  })

  await test('被遮罩挡住时报错并说明是谁', () => {
    const snap = rsf('snapshot', '-i')
    const mask = snap.match(/button "显示遮罩" \[ref=(e\d+)\]/)![1]
    const link = snap.match(/link "去文章页" \[ref=(e\d+)\]/)![1]
    rsf('click', mask)
    assert.match(rsfErr('click', link), /被别的元素挡住了：div#mask/)
    rsf('eval', `document.getElementById('mask').click()`)
  })

  await test('点击打开新标签时报告', () => {
    const ref = rsf('snapshot', '-i').match(/link "新标签打开列表" \[ref=(e\d+)\]/)![1]
    const r = json('click', ref)
    assert.equal(r.changes.newTabs[0].url, `${U}/list`)
  })

  await test('定位：CSS / getByLabel / getByRole / getByText，多个匹配时报错列候选', () => {
    assert.equal(json('fill', "getByLabel('用户名')", '小红').value, '小红')
    assert.equal(json('fill', 'textarea[name=bio]', '简介').value, '简介')
    const err = rsfErr('click', 'button')
    assert.match(err, /\[AMBIGUOUS\] button 匹配到/)
    assert.match(err, /候选：/)
    assert.match(rsfErr('click', "getByText('不存在的字')"), /没有找到/)
    rsf('click', "getByRole('button', { name: '提交' })")
    assert.equal(JSON.parse(json('eval', `document.getElementById('out').textContent`)).user, '小红')
  })

  await test('一次填多个字段 + find + 在元素上 eval', () => {
    const r = json('fill', 'input[name=user]=甲', "getByLabel('城市')=北京", 'input[name=agree]=false')
    assert.deepEqual(
      r.fields.map((f: any) => f.value ?? f.selected?.[0] ?? f.checked),
      ['甲', '北京', false],
    )
    assert.match(rsf('find', '同意协议'), /checkbox "同意协议" \[ref=e\d+/)
    assert.equal(json('eval', 'el => el.name', 'textarea'), 'bio')
  })

  await test('编号对应的元素被重绘后，按角色 + 名字自动重新定位', () => {
    const ref = rsf('snapshot', '-i').match(/button "重绘目标" \[ref=(e\d+)\]/)![1]
    rsf('click', "getByText('重绘一下')")
    const r = json('click', ref)
    assert.match(r.changes.note, /重新定位/)
    assert.equal(json('eval', `document.querySelector('#rr button').textContent`), '目标已点')
  })

  await test('按坐标点击 + 按住 Shift + --modifiers', () => {
    rsf('scroll', '#cv')
    const [x, y] = json('eval', `(() => { const r = document.getElementById('cv').getBoundingClientRect(); return [r.x, r.y] })()`)
    rsf('mouse', 'click', String(Math.round(x + 11)), String(Math.round(y + 21)))
    const [hx, hy] = json('eval', `document.getElementById('cv').dataset.hit`).split(',').map(Number)
    assert.ok(Math.abs(hx - 10) <= 1 && Math.abs(hy - 20) <= 1, `点到了 ${hx},${hy}`)
    rsf('key', 'down', 'Shift')
    rsf('click', '#sk')
    rsf('key', 'up', 'Shift')
    assert.equal(json('eval', `document.getElementById('sk').dataset.shift`), 'true')
    rsf('click', '#sk')
    assert.equal(json('eval', `document.getElementById('sk').dataset.shift`), 'false')
    rsf('click', '#sk', '--modifiers', 'Shift')
    assert.equal(json('eval', `document.getElementById('sk').dataset.shift`), 'true')
  })

  await test('上传：目标是“选择文件”按钮也行', () => {
    const r = json('upload', "getByRole('button', { name: '选择文件' })", path.join(ROOT, 'package.json'))
    assert.equal(r.via, 'file-chooser')
    assert.equal(json('eval', `document.getElementById('hfn').textContent`), 'package.json')
  })

  await test('点击下载，返回文件路径', () => {
    const dir = path.join(HOME, 'dl')
    fs.rmSync(dir, { recursive: true, force: true })
    const r = json('click', "getByText('下载报告')", '--download', '--save', dir)
    assert.equal(path.basename(r.download.file), 'report.txt')
    assert.equal(fs.readFileSync(r.download.file, 'utf8'), '报告内容 42')
  })

  await test('--snap：操作完顺带返回 snapshot', () => {
    const r = json('click', '#sk', '--snap')
    assert.match(r.snapshot, /button "shift 测试" \[ref=e\d+\]/)
  })

  await test('跳转后旧编号失效，并提示重新 snapshot', () => {
    const ref = rsf('snapshot', '-i').match(/link "去文章页" \[ref=(e\d+)\]/)![1]
    const r = json('click', ref)
    assert.equal(r.changes.navigated, true)
    assert.match(rsfErr('click', 'e1'), /rsf snapshot/)
  })

  await test('read：文章 + 元信息 + 评论分段', () => {
    const r = json('read')
    assert.equal(r.type, 'article')
    assert.equal(r.meta.author, '张三')
    assert.match(r.content, /第 8 段/)
    assert.ok(r.sections.some((s: any) => s.id === 'comments'))
    assert.ok(r.hints.some((h: string) => h.includes('__INITIAL_STATE__')))
    assert.match(rsf('read', '-s', 'comments'), /第 4 条评论/)
  })

  await test('read --grep：只返回命中的段落 + 位置，配合 --offset / --section', () => {
    const r = json('read', '--grep', '第 [36] 段', '-C', '0')
    assert.equal(r.grep.hits, 2)
    assert.equal(r.matches.length, 2)
    assert.match(r.matches[0].text, /^第 3 段/)
    assert.doesNotMatch(r.content, /第 4 段/)
    // 位置可以拿去 --offset 接着读
    const at = json('read', '--offset', String(r.matches[1].offset), '--budget', '20')
    assert.match(at.content, /^第 6 段/)
    // 前后各带一段上下文（默认），相邻的合并成一块
    const c = json('read', '--grep', '第 [56] 段')
    assert.equal(c.matches.length, 1)
    assert.match(c.matches[0].text, /第 4 段[\s\S]*第 7 段/)
    // 只搜评论区；没命中时说清楚
    assert.match(rsf('read', '-s', 'comments', '--grep', '用户2'), /第 2 条评论/)
    assert.match(rsf('read', '--grep', '不存在的词xyz'), /没有匹配/)
  })

  await test('wait --url：子串 / 通配 / 正则', () => {
    assert.equal(json('wait', '--url', '/article').ok, true)
    assert.equal(json('wait', '--url', '*127.0.0.1*/art*').ok, true)
    assert.equal(json('wait', '--url', '/\\/ar?ticle$/').ok, true)
    assert.match(rsfErr('wait', '--url', '/\\/article\\d+/', '--timeout', '500'), /TIMEOUT/)
    assert.match(rsfErr('wait', '--url', '/a(b/', '--timeout', '500'), /BAD_ARGS|正则/)
  })

  await test('read：列表页识别 + 分页', () => {
    rsf('goto', `${U}/list`)
    const r = json('read', '--limit', '5')
    assert.equal(r.type, 'list')
    assert.equal(r.items.length, 5)
    assert.equal(r.items[0].url, `${U}/video/0`)
    assert.deepEqual(r.more, { next: 5, total: 12 })
  })

  await test('eval：await / 隔离环境', () => {
    rsf('goto', `${U}/form`)
    assert.equal(json('eval', `const r = await fetch('/api/user?id=7'); (await r.json()).id`), 7)
    rsf('eval', 'window.secret = 1')
    assert.deepEqual(json('eval', '--isolated', '[document.title, typeof window.secret]'), ['表单测试', 'undefined'])
  })

  await test('网络记录 + 响应体', () => {
    rsf('net', 'log')
    rsf('reload')
    const rows = json('net', 'log', '--api')
    const req = rows.find((r: any) => r.url.includes('/api/user'))
    assert.ok(req)
    const d = json('net', 'show', String(req.id))
    assert.equal(d.json.name, '小明')
  })

  await test('拦截：返回假数据 / 屏蔽', () => {
    rsf('console')
    rsf('net', 'route', 'add', '*/api/user*', '--fulfill', '{"name":"假数据"}')
    rsf('reload')
    const logs = json('console')
    assert.ok(logs.some((l: any) => l.text === 'user 假数据'))
    rsf('net', 'route', 'rm')
    rsf('net', 'route', 'add', '/api/', '--abort')
    rsf('net', 'clear')
    rsf('reload')
    assert.ok(json('net', 'log', '--failed').some((r: any) => String(r.status).includes('blocked')))
    rsf('net', 'route', 'rm')
  })

  await test('打开页面前注入', () => {
    rsf('inject', 'add', 'window.__early = document.body === null')
    rsf('reload')
    // 注入脚本在页面自己的脚本之前运行，那时 body 还不存在
    assert.equal(json('eval', 'window.__early'), true)
    assert.equal(json('inject', 'list').length, 1)
    rsf('inject', 'rm')
  })

  await test('截图（含编号标注）', () => {
    rsf('snapshot')
    const r = json('shot', '--marks', '--save', path.join(HOME, 'shot.png'))
    assert.ok(fs.statSync(r.file).size > 1000)
  })

  await test('未知命令给出提示', () => {
    assert.match(rsfErr('nope'), /rsf help/)
  })

  const PROJ = path.join(HOME, 'proj')
  const LIB = `/* 测试站点笔记：列表页在 /list */
import path from 'node:path'

/** 原样返回参数（看类型转换）
 *  @example echo('abc', { limit: 3 }) */
export async function echo(word, { limit = 5, full = false, tag = 'x' } = {}) {
  return { word, limit, full, tag, types: [typeof word, typeof limit, typeof full] }
}

/** 列表页的标题 */
export async function titles(url, { limit = 3 } = {}) {
  const tab = await rsf.open(url)
  try {
    return await tab.eval(n => [...document.querySelectorAll('li h3')].slice(0, n).map(h => ({ title: h.innerText })), limit)
  } finally {
    await tab.close()
  }
}

export async function read(tab) {
  if (!(await tab.url()).includes('/list')) return null
  return { title: 'custom', content: (await tab.eval(() => document.querySelectorAll('li').length)) + ' items' }
}
`

  await test('函数库：lib list / call（类型看默认值）/ 管道', () => {
    fs.mkdirSync(path.join(PROJ, '.rsf', 'lib'), { recursive: true })
    fs.writeFileSync(path.join(PROJ, '.rsf', 'lib', '127.0.0.1.js'), LIB)
    const list = rsfIn(PROJ, ['lib', 'list', '127.0.0.1'])
    assert.match(list, /测试站点笔记/)
    assert.match(list, /echo\(word, \{ limit = 5, full = false, tag = 'x' \} = \{\}\)/)
    assert.match(list, /rsf call 127\.0\.0\.1 echo <word> \[--limit 5\] \[--full\] \[--tag x\]/)
    assert.match(list, /例：echo\('abc', \{ limit: 3 \}\)/)
    const r = JSON.parse(rsfIn(PROJ, ['call', '127.0.0.1', 'echo', '42', '--limit', '3', '--full', '-o', 'json']))
    assert.deepEqual(r, { word: '42', limit: 3, full: true, tag: 'x', types: ['string', 'number', 'boolean'] })
    assert.match(rsfIn(PROJ, ['lib', 'list']), /127\.0\.0\.1\s+echo titles read\s+（project）/)
    const out = rsfIn(PROJ, ['call', '127.0.0.1', 'titles', '-', '--limit', '2'], JSON.stringify({ url: `${U}/list` }) + '\n')
    assert.deepEqual(
      out.split('\n').map(l => JSON.parse(l).title),
      ['电影 0 号：一个很长的标题', '电影 1 号：一个很长的标题'],
    )
  })

  await test('rsf lib test：跑 @example，@test file / @test skip，按错误码分类', () => {
    fs.writeFileSync(
      path.join(PROJ, '.rsf', 'lib', 'libtest.local.js'),
      `import fs from 'node:fs'
/** 读测试前写好的文件
 *  @example note('note.txt')
 *  @test file note.txt 第一行\\n第二行 */
export async function note(f) { return fs.readFileSync(f, 'utf8').split('\\n') }
/** @example gone('x') */
export async function gone(id) { throw new RsfError('NOT_FOUND', '没有 ' + id) }
/** @example nothing() */
export async function nothing() { return [] }
/** @example danger()
 *  @test skip 会删东西 */
export async function danger() { throw new Error('不该跑') }
`,
    )
    let out = ''
    try {
      rsfIn(PROJ, ['lib', 'test', 'libtest.local', '--delay', '0', '-o', 'json'])
      assert.fail('有真失败时退出码应该不是 0')
    } catch (e: any) {
      out = String(e.stdout)
    }
    const r = JSON.parse(out)
    const by = Object.fromEntries(r.results.map((x: any) => [x.fn, x]))
    assert.equal(by.note.status, 'ok')
    assert.match(by.note.note, /2 项/)
    assert.equal(by.gone.status, 'stale')
    assert.equal(by.nothing.status, 'fail')
    assert.equal(by.nothing.code, 'EMPTY')
    assert.equal(by.danger.status, 'skip')
    assert.equal(fs.readFileSync(path.join(r.dir, 'libtest.local', 'note.txt'), 'utf8'), '第一行\n第二行')
    assert.equal(JSON.parse(rsfIn(PROJ, ['lib', 'test', 'libtest.local', 'note', '-o', 'json'])).results.length, 1)
    assert.match(rsfIn(PROJ, ['lib', 'list', 'libtest.local']), /rsf lib test 不跑这个函数的例子：会删东西/)
  })

  await test('rsf read <网址>：用函数库的 read，末尾列出函数，读完关掉标签', () => {
    const before = json('tab', 'list').length
    const r = JSON.parse(rsfIn(PROJ, ['read', `${U}/list`, '-o', 'json']))
    assert.equal(r.via, 'lib:127.0.0.1')
    assert.equal(r.content, '12 items')
    assert.ok(r.lib.functions.some((f: any) => f.name === 'echo'))
    assert.equal(json('tab', 'list').length, before)
    const txt = rsfIn(PROJ, ['read', `${U}/article`])
    assert.match(txt, /via: readability/)
    assert.match(txt, /这个网站有函数库 127\.0\.0\.1/)
    assert.match(txt, /echo\(word/)
  })

  await test('rsf run：顶层 await / import / rsf.lib / 下一次拿回标签 / 大结果写文件 / 报错位置', () => {
    const id = JSON.parse(rsfIn(PROJ, ['run', `const t = await rsf.open('${U}/list'); return t.id`, '-o', 'json']))
    assert.match(id, /^t\d+$/)
    assert.equal(JSON.parse(rsfIn(PROJ, ['run', `await (await rsf.tab('${id}')).title()`, '-o', 'json'])), '搜索结果')
    rsf('tab', 'close', id)
    assert.equal(JSON.parse(rsfIn(PROJ, ['run', `import path from 'node:path'; const r = await rsf.lib('127.0.0.1').echo('a'); return path.basename('/x/' + r.word)`, '-o', 'json'])), 'a')
    const big = rsfIn(PROJ, ['run', 'return Array.from({ length: 5000 }, (_, i) => ({ i, s: "abc" }))'])
    const file = big.match(/写到了：(.+)/)![1].trim()
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).length, 5000)
    assert.match(big, /数组，共 5000 项/)
    const errFile = path.join(HOME, 'err.js')
    fs.writeFileSync(errFile, 'const a = 1\nnull.x\n')
    assert.match(rsfErr('run', '-f', errFile), /位置：.*err\.js:2  null\.x/)
  })

  await test('tab.collect：让网站自己发请求，接住每一页的返回', () => {
    const f = path.join(HOME, 'collect.js')
    fs.writeFileSync(
      f,
      `const tab = await rsf.open('${U}/search')
let calls = 0
const pages = []
const more = async () => {
  calls++
  if (calls === 1) return tab.fill('#q', '猫', { submit: true })
  if (calls <= 3) return tab.click("getByRole('button', { name: '下一页' })")
  return false
}
for await (const res of tab.collect('/api/search', { more, timeout: 2000 })) pages.push(res.data.page)
await tab.close()
return pages
`,
    )
    assert.deepEqual(JSON.parse(rsfIn(PROJ, ['run', '-f', f, '-o', 'json'])), [1, 2, 3])
  })

  await test('snapshot：带点击事件的普通元素也有编号', () => {
    rsf('goto', `${U}/search`)
    assert.match(rsf('snapshot', '-i'), /clickable "热门推荐" \[ref=e\d+\]/)
  })

  await test('trace：录制 → 报告（数据溯源 / 签名 / 翻页 / 参数来源）', () => {
    try {
      rsf('trace', 'rm', 'e2e')
    } catch {}
    rsf('trace', 'start', 'e2e', '--goal', '搜索视频')
    const q = rsf('snapshot', '-i').match(/textbox "关键词" \[ref=(e\d+)\]/)![1]
    rsf('fill', q, '猫咪', '--submit')
    rsf('read')
    rsf('trace', 'mark', '翻页')
    const snap = rsf('snapshot', '-i')
    rsf('click', snap.match(/button "下一页" \[ref=(e\d+)\]/)![1])
    rsf('click', rsf('snapshot', '-i').match(/link "[^"]+" \[ref=(e\d+)\]/)![1])
    const r = json('trace', 'stop')
    assert.ok(r.bodies >= 3)
    const rep = rsf('trace', 'digest', 'e2e')
    assert.match(rep, /\*\*数据来源：`GET 127\.0\.0\.1:\d+\/api\/search`\*\*/)
    assert.match(rep, /参数里有签名：sign/)
    assert.match(rep, /\| q \| `猫咪`.*来自输入 "猫咪"/)
    assert.match(rep, /\| page \|.*翻页参数/)
    assert.match(rep, /\| ts \|.*时间戳/)
    assert.match(rep, /data\.items\[\]\.title/)
    assert.match(rep, /参数 `id` 来自 GET .*\/api\/search 的 data\.items\[\]\.id/)
    assert.match(rep, /fill e\d+ input \(#q\) = "猫咪" \+ 回车 → `.*\/api\/search`/)
    assert.doesNotMatch(rep, /api\/track/) // 埋点被去掉
  })

  await test('trace show / find', () => {
    const hits = json('trace', 'find', 'e2e', '猫咪 相关视频第 3 个')
    assert.ok(hits.some((h: any) => h.path === 'data.items[2].title'))
    const d = json('trace', 'show', 'e2e', String(hits[0].id), '--path', 'data.items[0]')
    assert.equal(d.json.author.name, '作者1')
  })

} finally {
  try {
    rsf('browser', 'disconnect', 'e2e', '--kill')
  } catch {}
  try {
    rsf('daemon', 'stop')
  } catch {}
  srv.close()
}
console.log(`\n${passed} passed${process.exitCode ? '，有失败' : ''}`)
