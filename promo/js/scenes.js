// ===================================================================
//  场景脚本：一条时间轴（以旁白时长为骨架），一个无限画布，一个镜头
//  原则：旁白先说、画面跟上；镜头少动、动就动得慢；靠高亮和压暗引导视线
// ===================================================================
const U = s => '«c:you ›» ' + s
const A = s => '«m:◆» ' + s
const TOOL = s => '«a:⏵ bash» «w:' + s + '»'
// 某句旁白说到 frac（0~1）处的时间点：画面和关键词对齐用
const sayAt = (id, frac = 0) => M[id] + VO[id].dur * frac

function lanePanelTerm(o) { return new Term(Object.assign({ prompt: '', cursor: false }, o)) }
function shake(t, list, amp = 8) {   // 震动：list = [[t0, dur]]
  let v = 0; for (const [a, d] of list) if (t >= a && t < a + d) v = Math.max(v, 1 - (t - a) / d)
  return [(hash(Math.floor(t * 60)) - .5) * amp * v * 2, (hash(Math.floor(t * 60) + 5) - .5) * amp * v * 2]
}
function counter(t, t0, t1, a, b) { return Math.round(lerp(a, b, E.out(prog(t, t0, t1)))).toLocaleString('en-US') }
const LOGO = () => asciiArt('logo', 'Recursurf', { cols: 92, font: '900 220px "Arial Black","Segoe UI Black",sans-serif' })
const logoGrad = k => `hsl(${lerp(150, 190, k)},100%,${lerp(72, 58, k)}%)`
function logoCells() {
  if (logoCells.c) return logoCells.c
  const art = LOGO(), out = []
  art.rows.forEach((row, r) => { for (let q = 0; q < row.length; q++) if (row[q] !== ' ') out.push({ r, q, ch: row[q] }) })
  return (logoCells.c = out)
}
// 字符汇聚成 Logo：src(i) 给出每个字符的起点
function converge(ctx, t, t0, dur, cx, cy, size, src) {
  const art = LOGO(), cells = logoCells(), cw = size * .6, lh = size
  const x0 = cx - art.cols * cw / 2, y0 = cy - art.h * lh / 2
  ctx.save(); ctx.font = `bold ${size}px ${FONT}`; ctx.textBaseline = 'top'
  cells.forEach((c, i) => {
    const d = hash(i * 3.1) * .45 * dur, k = E.io(clamp((t - t0 - d) / (dur * .55)))
    if (k <= 0) return
    const [sx, sy] = src(i)
    const tx = x0 + c.q * cw, ty = y0 + c.r * lh
    const bend = Math.sin(Math.PI * k) * (hash(i) - .5) * 400
    const x = lerp(sx, tx, k) + bend, y = lerp(sy, ty, k) - bend * .3
    ctx.globalAlpha = Math.min(1, k * 3)
    ctx.fillStyle = k >= 1 ? logoGrad(c.r / art.h) : COL.G
    ctx.fillText(k >= 1 ? c.ch : glyph(i + Math.floor(t * 20)), x, y)
  })
  ctx.restore()
}
// 一个淡入的整体：alpha 乘上去、画完恢复
function fade(ctx, k, fn) { if (k <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, k); fn(); ctx.restore() }
// 缩放弹出
function popIn(ctx, k, cx, cy, fn) { if (k <= 0) return; const s = E.back(clamp(k)); ctx.save(); ctx.globalAlpha *= clamp(k * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore() }
// 多行带标记文字（预先折行）
function wrapMk(s, cols, def = 'w') { return wrapCells(parseMk(s, def), cols) }
function drawRows(ctx, rows, x, y, size, lh = 1.4, n = 1e9) {
  setFont(ctx, size); let left = n
  rows.forEach((r, j) => { if (left > 0) drawCells(ctx, r, x, y + j * size * lh, size, left); left -= r.length })
}

// 浏览器窗口：标签栏 + 地址栏。tabs = [{ t, label, url, c, tag }]，返回当前（最新）标签
function browserWin(ctx, t, x, y, w, h, o = {}) {
  frame(ctx, x, y, w, h, { title: o.title || '你的浏览器 · 已登录', color: o.color || 'y', lw: 3, tsize: o.tsize || 22 })
  const tabs = (o.tabs || []).filter(b => t >= b.t)
  const TW = o.tabW || 160, maxN = Math.max(1, Math.floor((w - 40) / TW))
  const vis = tabs.slice(-maxN), cur = tabs[tabs.length - 1]
  vis.forEach((b, i) => {
    const k = E.out(clamp((t - b.t) / .25))
    const tx = x + 20 + i * TW, ty = y + 28 - (1 - k) * 18
    ctx.save(); ctx.globalAlpha *= k
    const act = b === cur
    ctx.fillStyle = act ? 'rgba(255,224,102,.16)' : 'rgba(255,255,255,.04)'; ctx.fillRect(tx, ty, TW - 8, 38)
    ctx.strokeStyle = COL[b.c] || COL.d; ctx.lineWidth = act ? 2 : 1; ctx.strokeRect(tx + .5, ty + .5, TW - 9, 37)
    ctx.fillStyle = COL[b.c] || COL.g; ctx.fillRect(tx + 10, ty + 13, 12, 12)
    setFont(ctx, 17); ctx.fillStyle = act ? COL.w : COL.g
    ctx.fillText(cutW(b.label, Math.floor((TW - 40) / 8.5)), tx + 30, ty + 10)
    if (b.tag && act) txt(ctx, b.tag, tx + TW - 12, ty + 44, 15, 'a', { align: 'right' })
    ctx.restore()
  })
  ctx.strokeStyle = COL.d; ctx.lineWidth = 1; ctx.strokeRect(x + 20, y + 80, w - 40, 36)
  if (cur) mtxt(ctx, `«G:🔒» «w:${cutW(cur.url || cur.label, Math.floor((w - 90) / 9))}»`, x + 32, y + 88, 18)
  return cur
}
// 飞行的小方块：数据从 A 流到 B
function flyDots(ctx, t, t0, t1, n, from, to, colors, dur = .8) {
  if (t < t0 || t > t1 + dur) return
  ctx.save(); const base = ctx.globalAlpha
  for (let i = 0; i < n; i++) {
    const s = t0 + (t1 - t0) * hash(i * 7.7 + 1), k = prog(t, s, s + dur)
    if (k <= 0 || k >= 1) continue
    const [fx, fy] = from(i), [tx, ty] = to(i), e = E.io(k)
    const x = lerp(fx, tx, e), y = lerp(fy, ty, e) - Math.sin(Math.PI * e) * 90
    ctx.globalAlpha = base * Math.sin(Math.PI * k); ctx.fillStyle = COL[colors[i % colors.length]]
    ctx.fillRect(x - 6, y - 6, 12, 12)
  }
  ctx.restore()
}
// 连线（虚线流动）+ 标签
function wire(ctx, x1, y1, x2, y2, k, color, label, lo = {}) {
  if (k <= 0) return
  ctx.save(); ctx.strokeStyle = COL[color]; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -(R.t || 0) * 25
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, k), lerp(y1, y2, k)); ctx.stroke()
  ctx.setLineDash([])
  if (label && k >= 1) txt(ctx, label, (x1 + x2) / 2 + (lo.dx || 0), (y1 + y2) / 2 + (lo.dy ?? -34), lo.size || 19, color, { align: 'center' })
  ctx.restore()
}
// 沿折线移动的数据包
function packet(ctx, t, t0, dur, pts, label, color) {
  const k = prog(t, t0, t0 + dur); if (k <= 0 || k >= 1) return
  let L = 0; const seg = []
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d }
  let s = E.io(k) * L, i = 0
  while (i < seg.length - 1 && s > seg[i]) s -= seg[i++]
  const f = seg[i] ? s / seg[i] : 0, x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f)
  const w = strW(label) * 11 + 24
  ctx.save(); ctx.globalAlpha *= Math.min(1, Math.sin(Math.PI * k) * 3)
  ctx.fillStyle = 'rgba(4,14,8,.95)'; ctx.fillRect(x - w / 2, y - 18, w, 36)
  ctx.strokeStyle = COL[color]; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, y - 18, w, 36)
  txt(ctx, label, x, y - 11, 22, color, { align: 'center', glow: 10 })
  ctx.restore()
}

// ===================================================================
// 00 开机
// ===================================================================
MUSIC = [{ t: 0, lv: 0 }]
chapter('boot', '00 · BOOT')
sfx(.15, 'power')
const P_pain = panel({ x: 0, y: 0, pad: 3000, t0: -1, fi: 0 })
const bootT = lanePanelTerm({ cols: 90, rows: 12, size: 24 })
bootT.put(.9, ['«d:RSF-BIOS v2.0   (c) Recursurf project»', ''])
bootT.out(1.3, [
  '检测浏览器 ..........  «G:vivaldi [extension] ✓»',
  '连接 daemon .........  «G:ok»',
  '标签注册表 ..........  «G:191 tabs»',
  '加载函数库 ..........  «G:50 个网站 ✓»',
  '',
  '«a:AGENT LINK ........  READY»',
], { lps: 5.5, sv: .7 })
wait(4.0)

// ===================================================================
// 01 痛点：AI 一上网就碰壁
// ===================================================================
chapter('pain', '01 · 痛点')
const pn = mark('pain')
MUSIC.push({ t: pn, lv: 1, vol: .9 })
bootT.clear(pn)
camTo(0, .01, P_pain, 960, 430, 1920)
const painT = new Term({ cols: 64, rows: 10, size: 26, prompt: '' })
painT.put(pn + .1, ['«d:agent · ~/work»', ''])
wait(.5)
const p1 = say('p1', .3)
painT.type(p1 + .3, D.zPrompt, { prompt: U(''), cps: 16, color: 'w' })
const p2 = say('p2', .3)
const wallT = [sayAt('p2', .02), sayAt('p2', .36), sayAt('p2', .7)]
const WALLS = [
  { t: wallT[0], x: 30, y: 40, w: 440, h: 300, c: 'y', title: 'x.com', body: ['', '«y:登录 X，查看更多帖子»', '', '«w:[  登录  ]   [ 注册 ]»'] },
  { t: wallT[1], x: 1450, y: 50, w: 440, h: 300, c: 'a', title: 'zhihu.com · 安全验证', body: ['', '«a:请拖动滑块完成拼图»', '', '«w:[■■■■□□□□□□□□]  ▶▶»'] },
  { t: wallT[2], x: 30, y: 520, w: 440, h: 300, c: 'r', title: 'reddit.com', body: ['', '«r:403 Forbidden»', '«d:blocked by network security»', '«d:cookie: (none)»'] },
]
const WALL_LINES = ['«a:⏵ fetch» x.com/search?q=xxx模型        «y:✗ 需要登录»', '«a:⏵ fetch» zhihu.com/search?q=xxx模型    «a:✗ 安全验证»', '«a:⏵ fetch» reddit.com/r/LocalLLaMA        «r:✗ 403»']
WALLS.forEach((w, i) => { sfx(w.t, 'error'); sfx(w.t, 'hit'); painT.out(w.t - .15, [WALL_LINES[i]], { lps: 20 }) })
const p3 = say('p3', .3)
const soupT = sayAt('p3', .15)
painT.out(soupT - .2, ['«a:⏵ fetch» news-site.com/xxx-model-review  «G:200»'], { lps: 20 })
sfx(soupT, 'stream', { dur: 1.5, v: 1 }); glitchAt(soupT + .1, .3, .6)
const p4 = say('p4', .5)
const tSorry = sayAt('p4', .3)
painT.type(tSorry, '抱歉，我无法访问这些网站。', { prompt: A(''), cps: 12, color: 'r', enter: false })
glitchAt(tSorry + .4, .6, 1); sfx(tSorry + .2, 'off')
const p5 = say('p5', .3)
sfx(p5 + .3, 'whoosh', { dur: .8 }); MUSIC.push({ t: p5, lv: 2 })
const PTABS = ['x.com', 'zhihu.com', 'reddit.com', 'bilibili.com', 'xiaohongshu.com'].map((s, i) => ({ t: p5 + .4 + i * .12, label: s, url: s, c: ['c', 'b', 'r', 'm', 'r'][i] }))
PTABS.forEach(b => sfx(b.t, 'pop', { f: 700 + Math.random() * 300 }))
const oLogo = at() + .3
sfx(oLogo, 'riser', { dur: 2 })
sfx(oLogo + 2.2, 'boom'); flashAt(oLogo + 2.2, .6)
MUSIC.push({ t: oLogo + 2.2, lv: 3 })
wait(2.4)
mark('logo')
say('logo1', 1.2)
P_pain.t1 = at() + .2; P_pain.fo = .6
const SOUP = wrapCells(parseMk(D.htmlSoup.repeat(6), 'd'), 120)
P_pain.draw = (ctx, t) => {
  // 开机：CRT 亮线
  if (t < 1.2) {
    const k = prog(t, .15, .7)
    ctx.fillStyle = COL.G
    const h = lerp(2, VH, E.expo(prog(t, .45, 1.0)))
    ctx.globalAlpha = k * (1 - prog(t, .9, 1.2))
    ctx.fillRect(lerp(960, 0, E.out(k)), 430 - h / 2, lerp(0, VW, E.out(k)), h)
    ctx.globalAlpha = 1
  }
  if (t < pn + .3) { bootT.draw(ctx, t, 200, 200); return }
  const painA = 1 - prog(t, p5 + .1, p5 + .6)
  if (painA > 0) fade(ctx, painA, () => {
    grid(ctx, 0, 0, VW, VH)
    const sk = prog(t, soupT, soupT + 1.4)
    if (sk > 0) {
      const scroll = (t - soupT) * 26, rows = Math.floor(lerp(0, 34, E.out(sk)))
      setFont(ctx, 18)
      for (let i = 0; i < rows; i++) { ctx.globalAlpha *= .55; drawCells(ctx, SOUP[(i + Math.floor(scroll)) % SOUP.length], 20, VH - (rows - i) * 25.5, 18); ctx.globalAlpha /= .55 }
    }
    const [sx, sy] = shake(t, WALLS.map(w => [w.t, .35]).concat([[soupT, 1.2], [tSorry + .4, .6]]), 10)
    frame(ctx, 500 + sx, 190 + sy, 920, 440, { title: 'agent', color: tSorry < t ? 'r' : 'g' })
    painT.draw(ctx, t, 530 + sx, 240 + sy)
    for (const w of WALLS) {
      if (t < w.t) continue
      const k = E.back(clamp((t - w.t) / .3))
      const [wx, wy] = shake(t, [[w.t, .4], [soupT, .8]], 12)
      ctx.save(); ctx.translate(w.x + w.w / 2 + wx, w.y + w.h / 2 + wy); ctx.scale(k, k); ctx.translate(-w.w / 2, -w.h / 2)
      frame(ctx, 0, 0, w.w, w.h, { title: w.title, color: w.c, lw: 3, dots: false })
      w.body.forEach((l, i) => mtxt(ctx, l, 30, 50 + i * 46, 26, 'w'))
      ctx.restore()
    }
    if (t > soupT) {
      const k = E.out(prog(t, soupT, soupT + 3.2))
      const x = 1450, y = 560, w = 440
      frame(ctx, x, y, w, 150, { title: '上下文', color: k > .95 ? 'r' : 'a', dots: false })
      const cells = 19, filled = Math.floor(cells * k)
      setFont(ctx, 30)
      ctx.fillStyle = k > .8 ? COL.r : COL.a; ctx.fillText('█'.repeat(filled) + '░'.repeat(cells - filled), x + 30, y + 40)
      txt(ctx, `${counter(t, soupT, soupT + 3.2, 0, 286410)} 字符`, x + w - 30, y + 96, 22, 'w', { align: 'right' })
      if (k > .95 && Math.floor(t * 4) % 2) txt(ctx, 'CONTEXT OVERFLOW', x + 30, y + 96, 22, 'r', { weight: 'bold' })
    }
  })
  // 你的浏览器：这些网站全都登录着
  const bk = prog(t, p5 + .3, p5 + .8) * (1 - prog(t, oLogo - .1, oLogo + .3))
  if (bk > 0) fade(ctx, bk, () => {
    const s = .92 + .08 * E.out(prog(t, p5 + .3, p5 + .8))
    ctx.save(); ctx.translate(960, 430); ctx.scale(s, s); ctx.translate(-960, -430)
    browserWin(ctx, t, 410, 90, 1100, 680, { tabs: PTABS, tabW: 205, title: '你的浏览器' })
    PTABS.forEach((b, i) => fade(ctx, prog(t, p5 + .8 + i * .2, p5 + 1.0 + i * .2), () =>
      mtxt(ctx, `«w:▸ ${b.label.padEnd(18)}» «G:👤 已登录»`, 480, 250 + i * 88, 40)))
    ctx.restore()
  })
  // 字符汇聚成 Logo
  if (t > oLogo - .1) {
    const size = 26
    if (t < oLogo + 2.3) converge(ctx, t, oLogo, 2.2, 960, 360, size, i => [480 + hash(i * 1.7) * 900, 250 + (i % 5) * 88 + hash(i * 2.3) * 40])
    else {
      const pulse = 1 + .15 * Math.sin(t * 3)
      drawArt(ctx, LOGO(), 960, 360, size, 'G', { grad: logoGrad, glow: 18 * pulse })
      fade(ctx, prog(t, oLogo + 2.6, oLogo + 3.4), () => {
        txt(ctx, '给 AI agent 用的浏览器', 960, 600, 54, 'w', { align: 'center', weight: 'bold' })
        txt(ctx, 'rsf · 借你已登录的浏览器上网 · 读网页 · 取数据 · 操作页面 · 跨站调研', 960, 680, 28, 'g', { align: 'center' })
      })
    }
  }
}

// ===================================================================
// 02 同一句话，再问一次（只给结果）
// ===================================================================
chapter('open', '02 · 再问一次')
const ho = mark('open')
MUSIC.push({ t: ho, lv: 2 })
const P_open = panel({ x: 0, y: 2600, t0: ho - .5, fi: .5 })
camTo(ho, 1.3, P_open, 960, 430, 1920, { arc: .5 })
sfx(ho, 'whoosh', { dur: 1.2 })
wait(1.2)
const HA = { x: 40, y: 40, w: 900, h: 780 }, HB = { x: 980, y: 40, w: 900, h: 780 }
const HT = new Term({ cols: 64, rows: 20, size: 26, prompt: '' })
HT.put(ho + .6, ['«d:agent · ~/work»', ''])
const h1 = say('h1', .3)
HT.type(h1 + .1, D.zPrompt, { prompt: U(''), cps: 24, color: 'w' })
const s1 = sayAt('h1', .5)
HT.out(s1, ['', A('用你的浏览器，6 个网站同时查。'), TOOL('rsf run -f step1.js')], { lps: 10 })
sfx(s1 + .3, 'riser', { dur: 1.2 })
const ZK = D.zKeys
const ZURL = { x: 'x.com/search?q=xxx模型', reddit: 'reddit.com/search?q=xxx+model', hn: 'hn.algolia.com/?q=xxx+model', zhihu: 'zhihu.com/search?q=xxx模型', bilibili: 'search.bilibili.com/all?keyword=xxx模型 评测', v2ex: 'v2ex.com/?q=xxx模型' }
const HTABS = ZK.map((k, i) => ({ t: s1 + .7 + i * .22, label: D.zl[k].name, url: ZURL[k], c: D.zl[k].color, k }))
HTABS.forEach(b => sfx(b.t, 'pop', { f: 700 + Math.random() * 300 }))
const s1done = s1 + 2.9
HT.out(s1done, ['«G:✓» ' + D.zStatus], { lps: 8 })
sfx(s1done, 'ding'); MUSIC.push({ t: s1 + .9, lv: 3 })
const h2 = say('h2', .4)
HT.out(h2 - .2, [TOOL('rsf run -f step2.js "1,6,13"'), ...D.zStep2, TOOL('rsf run -f step3.js'), ...D.zStep3], { lps: 14 })
const hk = sayAt('h2', .22)
sfx(hk, 'boom'); flashAt(hk, .4, .5); MUSIC.push({ t: hk, lv: 3 })
const m1 = say('m1', .4)
const mc = [m1 - .2, m1 + .5, m1 + 1.2]
mc.forEach(t => sfx(t, 'whoosh', { dur: .5 }))
wait(2.2)
P_open.t1 = at() + 1.2
const HPAGE = Object.fromEntries(ZK.map(k => [k, [`«w:${D.zl[k].name}»`, '', ...D.zl[k].items.map(s => cutW(plain(s), 78)).map(s => '«g:' + s + '»')]]))
const MCARD = i => ({ x: 50 + i * 620, y: 150, w: 580, h: 560 })
function drawMontage(ctx, i) {
  const m = D.montage[i], b = MCARD(i)
  frame(ctx, b.x, b.y, b.w, b.h, { title: m.tag, color: m.c, lw: 3, tsize: 26, dots: false })
  txt(ctx, m.q, b.x + 30, b.y + 50, 28, 'w', { weight: 'bold' })
  txt(ctx, m.sites, b.x + 30, b.y + 110, 20, 'd')
  ctx.strokeStyle = COL.d; ctx.globalAlpha *= .5; ctx.beginPath(); ctx.moveTo(b.x + 30, b.y + 150); ctx.lineTo(b.x + b.w - 30, b.y + 150); ctx.stroke(); ctx.globalAlpha /= .5
  m.lines.forEach((l, j) => mtxt(ctx, l, b.x + 30, b.y + 185 + j * 62, 26, 'w'))
}
P_open.draw = (ctx, t) => {
  const mainA = 1 - .75 * prog(t, hk, hk + .4) - .25 * prog(t, m1 - .4, m1)
  if (mainA > 0) fade(ctx, mainA, () => {
    frame(ctx, HA.x, HA.y, HA.w, HA.h, { title: 'agent', color: 'g', double: true, tsize: 26 })
    HT.draw(ctx, t, HA.x + 40, HA.y + 50)
    const bk = E.out(prog(t, s1 + .2, s1 + .8))
    if (bk > 0) fade(ctx, bk, () => {
      const cur = browserWin(ctx, t, HB.x + (1 - bk) * 120, HB.y, HB.w, HB.h, { tabs: HTABS, tabW: 140 })
      if (cur && cur.k) {
        const lines = HPAGE[cur.k], n = Math.floor((t - cur.t) * 30)
        lines.forEach((l, j) => { if (j < n) mtxt(ctx, l, HB.x + 40, HB.y + 150 + j * 34, 20) })
      }
      flyDots(ctx, t, s1 + .8, s1done, 40, i => [HB.x + 80 + hash(i) * 700, HB.y + 180 + hash(i + 3) * 500], () => [HA.x + 700, HA.y + 330], ZK.map(k => D.zl[k].color))
    })
  })
  // 报告卡
  const kin = prog(t, hk, hk + .5), kout = prog(t, m1 - .4, m1 + .1)
  if (kin > 0 && kout < 1) fade(ctx, 1 - kout, () => popIn(ctx, kin, 960, 430, () => {
    const b = { x: 200, y: 90, w: 1520, h: 680 }
    frame(ctx, b.x, b.y, b.w, b.h, { title: '报告 · 每一条都带出处', color: 'G', double: true, tsize: 28 })
    txt(ctx, 'xxx模型：跑分没造假，但有前提', 960, b.y + 60, 56, 'G', { align: 'center', weight: 'bold', glow: 20 })
    D.zConc.forEach((l, j) => fade(ctx, prog(t, hk + .4 + j * .35, hk + .7 + j * .35), () => mtxt(ctx, l, b.x + 110, b.y + 190 + j * 76, 30, 'w')))
    fade(ctx, prog(t, hk + 2, hk + 2.5), () => txt(ctx, '6 个网站 · 28 条结果 · 3 个一手来源 · 全程用你的浏览器', 960, b.y + b.h - 80, 26, 'a', { align: 'center' }))
  }))
  // 蒙太奇：别的题目，同一套做法
  for (const i of [0, 1, 2]) {
    const k = E.out(prog(t, mc[i], mc[i] + .5))
    if (k > 0) fade(ctx, k, () => { ctx.save(); ctx.translate((1 - k) * 500, 0); drawMontage(ctx, i); ctx.restore() })
  }
  if (t > m1 + 1.8) fade(ctx, prog(t, m1 + 1.8, m1 + 2.3), () =>
    txt(ctx, '同一套做法：搜 → 挑 → 深挖 → 一手资料 → 带出处的结论', 960, 760, 30, 'a', { align: 'center' }))
}

// ===================================================================
// 03 原理：跟着一条命令走一遍
// ===================================================================
chapter('arch', '03 · 原理')
const ar = mark('arch')
MUSIC.push({ t: ar, lv: 2 })
const P_arch = panel({ x: 3200, y: 2600, t0: ar - .4, fi: .4 })
camTo(ar, 1.3, P_arch, 960, 430, 1920, { arc: .3 })
sfx(ar, 'whoosh', { dur: 1.2 })
wait(1.1)
const a1 = say('a1', .2), a2 = say('a2', .1), a3 = say('a3', .2), a4 = say('a4', .2), a5 = say('a5', .6)
const aX = sayAt('a1', .5)                     // “借你平时用的那个”
sfx(a1 + .3, 'pop', { f: 400 }); sfx(a1 + .7, 'pop', { f: 600 }); sfx(aX, 'error')
const AB = { x: 30, y: 230, w: 620, h: 400 }         // agent
const DB = { x: 790, y: 330, w: 390, h: 200 }        // daemon
const EB = { x: 1300, y: 40, w: 580, h: 90 }         // 插件
const BB0 = { x: 1040, y: 170, w: 740, h: 480 }, BB1 = { x: 1300, y: 170, w: 580, h: 640 }   // 你的浏览器：前 → 后
const AT = new Term({ cols: 52, rows: 11, size: 22, prompt: '«G:❯» ' })
AT.type(a2 + .9, D.archCmd, { cps: 30 })
const tDae = sayAt('a3', .12), tExt = sayAt('a3', .42), tTab = sayAt('a3', .8)
sfx(tDae, 'pop', { f: 500 }); sfx(tExt, 'pop', { f: 650 }); sfx(tTab, 'blip', { f: 1200 })
const tBack = a4 + .6
AT.out(a4 + 2.3, D.archOut, { lps: 12 })
sfx(tBack, 'whoosh', { dur: 1.2, up: false })
const ATABS = [
  { t: a1, label: 'x.com', url: 'x.com', c: 'c' }, { t: a1, label: 'bilibili.com', url: 'bilibili.com', c: 'm' },
  { t: a1, label: 'zhihu.com', url: 'zhihu.com', c: 'b' },
  { t: tTab, label: '如何评价 xxx模型？', url: 'zhihu.com/question/7203316845', c: 'b', tag: '后台标签' },
]
const APAGE = D.archPage.map(s => s)
P_arch.draw = (ctx, t) => {
  grid(ctx, 0, 0, VW, VH)
  // a1：AI 自己开的浏览器（被拦） vs 你的浏览器
  const leftA = prog(t, a1, a1 + .4) * (1 - prog(t, a2 - .4, a2 + .2))
  if (leftA > 0) fade(ctx, leftA, () => {
    frame(ctx, 140, 170, 740, 480, { title: 'AI 自己开的浏览器（无头、没登录）', color: 'r', lw: 3, tsize: 22 })
    ;['«w:zhihu.com/signin»', '', '«r:登录知乎，查看完整回答»', '«d:cookie: (none)»', '', '«r:✗ 请先登录 · 安全验证 · 403»'].forEach((l, i) => mtxt(ctx, l, 180, 230 + i * 50, 28, 'w'))
    const xk = prog(t, aX, aX + .3)
    if (xk > 0) { ctx.save(); ctx.strokeStyle = COL.r; ctx.lineWidth = 10; ctx.globalAlpha *= xk; ctx.beginPath(); ctx.moveTo(200, 220); ctx.lineTo(820, 610); ctx.moveTo(820, 220); ctx.lineTo(200, 610); ctx.stroke(); ctx.restore() }
  })
  // 你的浏览器
  const mv = E.io(prog(t, a2 - .3, a2 + .6)), bA = prog(t, a1 + .3, a1 + .7)
  const B = { x: lerp(BB0.x, BB1.x, mv), y: lerp(BB0.y, BB1.y, mv), w: lerp(BB0.w, BB1.w, mv), h: lerp(BB0.h, BB1.h, mv) }
  fade(ctx, bA, () => {
    const cur = browserWin(ctx, t, B.x, B.y, B.w, B.h, { tabs: ATABS, tabW: 175 })
    if (cur && cur.tag) {
      const comp = prog(t, a4 + .1, a4 + .8)      // 页面被压缩
      ctx.save(); ctx.translate(B.x + 30, B.y + 150); ctx.scale(1, 1 - comp * .85); ctx.globalAlpha *= 1 - comp * .7
      APAGE.forEach((l, j) => { if ((t - tTab) * 30 > j) mtxt(ctx, cutW(plain(l), 54), 0, j * 34, 19, j < 2 ? 'w' : 'g') })
      ctx.restore()
      fade(ctx, prog(t, a4, a4 + .3) * (1 - prog(t, a5, a5 + .5)), () => {
        txt(ctx, t < a4 + .6 ? counter(t, a4, a4 + .4, 0, 312355) : counter(t, a4 + .6, a4 + 1.2, 312355, 2126), B.x + B.w / 2, B.y + B.h - 150, 64, t < a4 + .6 ? 'r' : 'G', { align: 'center', weight: 'bold', glow: 16 })
        txt(ctx, t < a4 + .6 ? '页面字符' : '读出来的字符', B.x + B.w / 2, B.y + B.h - 72, 22, 'd', { align: 'center' })
      })
    } else if (t < (tTab || 1e9)) {
      ;[['x.com', '已登录'], ['zhihu.com', '已登录'], ['reddit.com', '已登录'], ['bilibili.com', '已登录'], ['xiaohongshu.com', '已登录']].forEach(([s, l], i) =>
        fade(ctx, prog(t, a1 + .5 + i * .15, a1 + .7 + i * .15), () => mtxt(ctx, `«w:▸ ${s.padEnd(14)}» «G:👤 ${l}»`, B.x + 40, B.y + 150 + i * 56, 26)))
    }
    // a5：登录状态是你的
    const lk = prog(t, a5, a5 + .4)
    if (lk > 0) popIn(ctx, lk, B.x + B.w / 2, B.y + 380, () => {
      const bw = 460, bx0 = B.x + (B.w - bw) / 2
      ctx.fillStyle = 'rgba(4,14,8,.95)'; ctx.fillRect(bx0, B.y + 300, bw, 160); ctx.strokeStyle = COL.G; ctx.lineWidth = 3; ctx.strokeRect(bx0, B.y + 300, bw, 160)
      txt(ctx, '👤 你 · 已登录', B.x + B.w / 2, B.y + 325, 40, 'G', { align: 'center', weight: 'bold', glow: 10 * (1 + Math.sin(t * 6)) })
      txt(ctx, 'cookie · 登录状态 · 浏览器指纹', B.x + B.w / 2, B.y + 395, 24, 'w', { align: 'center' })
    })
  })
  // agent
  const ag = prog(t, a2, a2 + .5)
  fade(ctx, ag, () => {
    frame(ctx, AB.x, AB.y, AB.w, AB.h, { title: 'AI agent', color: 'm', double: true, tsize: 24 })
    fade(ctx, 1 - prog(t, rd - .3, rd + .3), () => AT.draw(ctx, t, AB.x + 26, AB.y + 46))
  })
  // daemon / 插件 / 连线
  popIn(ctx, prog(t, tDae, tDae + .4), DB.x + DB.w / 2, DB.y + DB.h / 2, () => {
    frame(ctx, DB.x, DB.y, DB.w, DB.h, { title: 'daemon（后台常驻）', color: 'c', lw: 3, dots: false })
    ;['«c:记住：»标签 · 登录', '      网络记录 · 编号'].forEach((l, i) => mtxt(ctx, l, DB.x + 30, DB.y + 60 + i * 46, 26, 'w'))
  })
  popIn(ctx, prog(t, tExt, tExt + .4), EB.x + EB.w / 2, EB.y + EB.h / 2, () => {
    frame(ctx, EB.x, EB.y, EB.w, EB.h, { title: '浏览器插件', color: 'a', lw: 3, dots: false })
    mtxt(ctx, '«a:把标签的控制权交给 daemon»', EB.x + 30, EB.y + 34, 24)
  })
  wire(ctx, AB.x + AB.w, 430, DB.x, 430, prog(t, tDae - .1, tDae + .3), 'm', 'rsf（跑完就退出）', { dy: 18 })
  wire(ctx, DB.x + DB.w, 380, EB.x, 85, prog(t, tExt, tExt + .4), 'c', 'WebSocket', { dx: -40 })
  wire(ctx, EB.x + 290, EB.y + EB.h, EB.x + 290, BB1.y, prog(t, tExt + .2, tExt + .5), 'a')
  // 命令包：去 → 回
  packet(ctx, t, tDae + .1, tTab - tDae, [[AB.x + AB.w, 430], [DB.x + DB.w / 2, 430], [DB.x + DB.w, 380], [EB.x, 85], [EB.x + 290, 85], [EB.x + 290, BB1.y + 60]], 'rsf read …/question/7203316845', 'm')
  packet(ctx, t, tBack, 1.6, [[EB.x + 290, BB1.y + 60], [EB.x + 290, 85], [EB.x, 85], [DB.x + DB.w, 380], [DB.x + DB.w / 2, 430], [AB.x + AB.w, 430]], '~2,000 字', 'G')
  // 结语
  fade(ctx, prog(t, sayAt('a5', .4), sayAt('a5', .4) + .6), () => txt(ctx, '对网站来说：来的就是你本人', 640, 720, 40, 'y', { align: 'center', weight: 'bold', glow: 16 }))
}

// ===================================================================
// 04 rsf read（镜头钻进 agent 的终端）
// ===================================================================
chapter('read', '04 · rsf read')
const rd = mark('read')
MUSIC.push({ t: rd, lv: 2 })
const P_read = panel({ parent: P_arch, x: AB.x + 20, y: AB.y + 44, s: (AB.w - 40) / VW, w: 3840, t0: rd - .1, fi: .5 })
P_arch.t1 = rd + 1.7; P_arch.fo = .4
camTo(rd, 1.8, P_read, 960, 430, 1920, { ease: E.expo })
sfx(rd, 'whoosh', { dur: 1.6 })
wait(1.9)
const T1 = new Term({ cols: 168, rows: 27, size: 20 })
const T1x = 80, T1y = 96
const r1 = say('r1', .2)
T1.type(r1 + .5, D.biliCmd, { cps: 20 })
const r2 = say('r2', .2)
const cmp = wait(0)
sfx(cmp, 'whoosh', { dur: 1, up: false }); glitchAt(cmp + .6, .25, .5)
T1.out(cmp + 1.0, D.biliOut, { lps: 55 })
wait(1.7)
const r3 = say('r3', .2)
const r4 = say('r4', .4)
T1.mark(r4 + .1, r4 + 1.6, '# 【官方 MV】')
T1.mark(r4 + 1.6, r4 + 3.1, 'stat: 播放')
T1.mark(r4 + 3.1, r4 + 5.4, '分段（rsf read')
T1.mark(r4 + 3.5, r4 + 5.4, 'comments: 评论', 'c')
const pan1 = wait(0)
camTo(pan1, 1.0, P_read, 2880, 430, 1920)
sfx(pan1, 'whoosh', { dur: .9 })
const T2 = new Term({ cols: 168, rows: 27, size: 20 })
const T2x = 1920 + 80
T2.type(pan1 + .6, D.grepCmd, { cps: 55 })
T2.out(pan1 + 2.0, D.grepOut, { lps: 50 })
wait(2.5)
const r5 = say('r5', .2)
T2.mark(r5 + .2, r5 + 2.4, 'grep: 思考模式|测试集')
T2.mark(r5 + 2.4, r5 + 4.6, '〔@6831〕')
const r6 = say('r6', .3)
T2.mark(r6 + .1, r6 + 5.2, '〔@14102〕')
T2.type(r6 + 2.6, 'rsf read https://36kr.com/p/2961530218 «a:--offset 14102»', { cps: 40, enter: false, color: 'd' })
const pan2 = wait(0)
camTo(pan2, 1.0, P_read, 960, 470, 1920)
sfx(pan2, 'whoosh', { dur: .9 })
wait(1.0)
const r7 = say('r7', .2)
T1.mark(r7 + .1, r7 + 2.6, '这个网站有函数库 bilibili.com')
T1.mark(r7 + 2.6, r7 + 9, 'comments(id', 'c')
const SOUP2 = wrapCells(parseMk(D.htmlSoup.repeat(4), 'd'), 168)
P_read.draw = (ctx, t, p, ps) => {
  frame(ctx, 40, 40, 1840, 780, { title: '~/work · rsf read', color: 'g', double: true })
  if (t > r2 && t < cmp + 1.4) {
    const k = prog(t, cmp, cmp + 1.0)
    ctx.save()
    ctx.translate(1600, 200); ctx.scale(1 - E.in(k), 1 - E.in(k)); ctx.translate(-1600, -200)
    setFont(ctx, 20)
    const rows = Math.floor(lerp(0, 26, E.out(prog(t, r2, r2 + 1.2))))
    for (let i = 0; i < rows; i++) { ctx.globalAlpha = .5; drawCells(ctx, SOUP2[(i + Math.floor((t - r2) * 10)) % SOUP2.length], T1x, T1y + 30 + i * 26, 20) }
    ctx.restore()
  }
  T1.draw(ctx, t, T1x, T1y)
  if (t > r2) {
    const k = prog(t, r2, r2 + .4)
    ctx.save(); ctx.globalAlpha *= k * (1 - prog(t, r4 + .2, r4 + .8))
    frame(ctx, 1290, 90, 540, 230, { title: '字符数', color: 'a', dots: false })
    const big = t < cmp + .3 ? counter(t, r2, r2 + 3.5, 0, 229754) : counter(t, cmp + .3, cmp + 1.2, 229754, 2043)
    txt(ctx, big, 1560, 130, 84, t < cmp + .3 ? 'r' : 'G', { align: 'center', weight: 'bold', glow: 14 })
    if (t > cmp + 1.2) {
      txt(ctx, '原始 HTML 229,754  →  read 2,043', 1560, 240, 22, 'w', { align: 'center' })
      txt(ctx, '÷ 112', 1560, 272, 26, 'a', { align: 'center', weight: 'bold' })
    } else txt(ctx, '原始 HTML', 1560, 250, 26, 'd', { align: 'center' })
    ctx.restore()
  }
  if (t > pan1 - .2) {
    frame(ctx, 1960, 40, 1840, 780, { title: '~/work · read --grep', color: 'g', double: true })
    T2.draw(ctx, t, T2x, T1y)
  }
}

// ===================================================================
// 05 函数库
// ===================================================================
chapter('lib', '05 · 函数库')
const lb = mark('lib')
const libRow = () => T1.rowRect(lb, 'comments(id', T1x, T1y)
const P_lib = panel({
  parent: P_read, x: () => libRow().x + 2, y: () => libRow().y + 2, s: () => (libRow().h - 4) / VH, t0: lb - .2, fi: .5,
})
P_read.t1 = lb + 1.6; P_read.fo = .4
camTo(lb, 1.8, P_lib, 960, 430, 1920, { ease: E.expo })
sfx(lb, 'whoosh', { dur: 1.6 })
wait(1.8)
const CODE = new Term({ cols: 112, rows: 23, size: 19, prompt: '', cursor: false })
CODE.out(lb + 1.0, D.libCode, { lps: 28, sound: false })
const l1 = say('l1', .2)
const l2 = say('l2', .2)
CODE.mark(l2 + .1, l2 + 2.6, 'limit = 50')
CODE.mark(l2 + 2.6, l2 + 5.6, '@example')
const ANN = new Term({ cols: 68, rows: 6, size: 19, prompt: '', cursor: false })
ANN.put(l2 + .5, ['«d:参数类型看默认值：limit = 50 → 数字»', '«d:帮助信息从签名和注释生成，不用另外声明»', '', '«G:$» rsf call bilibili.com comments BV1GJ411x7h7 «a:--limit 20»'])
const TEST = new Term({ cols: 68, rows: 6, size: 19, prompt: '', cursor: false })
TEST.out(l2 + 2.8, D.libTest, { lps: 8 })
sfx(l2 + 3.4, 'ding')
const l3 = say('l3', .2)
const NOTES = new Term({ cols: 70, rows: 16, size: 19, prompt: '', cursor: false })
NOTES.out(l3 + .2, D.siteNotes, { lps: 16, sound: false })
NOTES.mark(l3 + 1.6, l3 + 6, '评论接口的 oid 要用 aid')
const zo = wait(0)
P_lib.t1 = zo + 1.4; P_lib.fo = .6
P_lib.draw = (ctx, t) => {
  frame(ctx, 40, 40, 1100, 780, { title: 'lib/bilibili.com.js', color: 'g', double: true })
  CODE.draw(ctx, t, 70, 90)
  const kA = win(t, l2 + .4, l3 - .1, .3, .3)
  if (kA > 0) {
    ctx.save(); ctx.globalAlpha *= kA
    frame(ctx, 1180, 70, 700, 230, { title: '签名 = 说明书', color: 'a', dots: false })
    ANN.draw(ctx, t, 1205, 115)
    if (t > l2 + 2.6) {
      frame(ctx, 1180, 360, 700, 210, { title: 'rsf lib test', color: 'G', dots: false })
      TEST.draw(ctx, t, 1205, 405)
    }
    ctx.restore()
  }
  if (t > l3) {
    const k = E.out(prog(t, l3, l3 + .5))
    ctx.save(); ctx.translate((1 - k) * 600, 0); ctx.globalAlpha *= k
    frame(ctx, 1160, 70, 720, 700, { title: '站点笔记 · rsf lib list bilibili.com', color: 'y', dots: false })
    NOTES.draw(ctx, t, 1185, 120)
    ctx.restore()
  }
}

// --- 星图：内置 50 个网站 ---
const STARS = []
{
  const cats = Object.keys(D.sites), ring = cats.filter(c => c !== '视频')
  const centers = { '视频': [960, 430] }
  ring.forEach((c, i) => { const a = -Math.PI / 2 + i / ring.length * Math.PI * 2; centers[c] = [960 + Math.cos(a) * 690, 430 + Math.sin(a) * 300] })
  cats.forEach((c, ci) => {
    const [cx, cy] = centers[c]
    D.sites[c].forEach((s, i) => {
      let x = cx, y = cy
      if (!(c === '视频' && i === 0)) {
        const k = c === '视频' ? i + 1.5 : i + .6, a = k * 2.399 + ci, r = 30 + 26 * Math.sqrt(k)
        x = cx + Math.cos(a) * r * 1.7; y = cy + Math.sin(a) * r * .9
      }
      STARS.push({ s, c, x, y, ci, i, d: ci * .35 + i * .07 })
    })
  })
  STARS.cats = centers
}
const starOf = s => STARS.find(x => x.s === s)
const HOT = new Set(['bilibili.com', 'zhihu.com', 'x.com', 'reddit.com'])
const SS = 9
const P_stars = panel({
  parent: P_lib, x: () => 960 - starOf('bilibili.com').x * SS, y: () => 430 - starOf('bilibili.com').y * SS, s: SS,
  pad: 400, vis: [], fi: .8, fo: .6,
})
camTo(zo, 2.4, P_stars, 960, 430, 1920, { ease: E.io })
sfx(zo, 'whoosh', { dur: 2.2, up: false })
wait(1.6)
const l4 = say('l4', .6)
STARS.forEach(s => sfx(l4 + .2 + s.d * .9, 'blip', { f: 900 + s.ci * 140, v: .25 }))

// ===================================================================
// 06 亲手操作：照着文件夹里的资料，填三家应用市场的表单
// ===================================================================
chapter('form', '06 · 亲手操作')
const fm = mark('form')
MUSIC.push({ t: fm, lv: 3, vol: .85 })
P_stars.vis.push([zo + .4, fm + 1.1])
const FS = 1 / 60, CW = 2100
const P_form = panel({ parent: P_stars, x: 960 - 1000 * FS, y: 700 - 430 * FS, s: FS, w: 6 * CW, t0: fm - .5, fi: .6 })
camTo(fm, 1.9, P_form, 1000, 430, 1920, { ease: E.expo })
sfx(fm, 'whoosh', { dur: 1.7 })
wait(1.9)
// 卡片 0：任务 + 资料 + 标签
const F0 = new Term({ cols: 62, rows: 19, size: 24, prompt: '' })
F0.put(fm + 1.2, ['«d:agent · ~/work/shiguang»', ''])
const f0 = say('f0', .3)
F0.type(f0 + .4, D.fPrompt, { prompt: U(''), cps: 22, color: 'w' })
const f1 = say('f1', .3)
const tFile = D.fFiles.map((_, i) => sayAt('f1', .12 + i * .16))
tFile.forEach(t => sfx(t, 'pop', { f: 600 }))
const f2 = say('f2', .4)
F0.out(f2 + .1, ['', A('先把资料读一遍。'), ...D.fRead], { lps: 10 })
const tTabs = sayAt('f2', .5)
F0.type(tTabs, D.fTabCmd, { prompt: '«G:❯» ', cps: 30 })
F0.out(tTabs + .7, D.fTabOut, { lps: 12 })
const FTABS = D.fStores.map((s, i) => ({ t: tTabs + .8 + i * .15, label: s.label, url: s.url, c: s.c }))
FTABS.forEach(b => sfx(b.t, 'blip', { f: 1000 }))
// 卡片 1：snapshot → fill → upload
const pc1 = wait(0)
camTo(pc1, .9, P_form, CW + 1000, 430, 1920)
sfx(pc1, 'whoosh', { dur: .8 })
const F1 = new Term({ cols: 86, rows: 24, size: 22 })
F1.type(pc1 + .3, D.fSnapCmd, { cps: 45 })
const tSnap = pc1 + 1.0
F1.out(tSnap, D.fSnapOut, { lps: 30 })
wait(.4)
const f3 = say('f3', .3)
F1.mark(sayAt('f3', .25), sayAt('f3', .65), '[ref=e2]')
F1.mark(sayAt('f3', .4), sayAt('f3', .8), '[ref=e4]')
F1.mark(sayAt('f3', .55), f3 + VO.f3.dur + .3, '[ref=e8]')
const f4 = say('f4', .5)
const tFillEnd = F1.type(f4 + .1, D.fFillCmd, { cps: 80 })
F1.out(tFillEnd + .2, D.fFillOut, { lps: 10 }); sfx(tFillEnd + .2, 'ding')
const tUpEnd = F1.type(tFillEnd + .6, D.fUpCmd, { cps: 80 })
F1.out(tUpEnd + .2, D.fUpOut, { lps: 10 }); sfx(tUpEnd + .2, 'ding')
// 卡片 2：同名 → 候选；编号 → changes
const pc2 = wait(0)
camTo(pc2, .9, P_form, 2 * CW + 1000, 430, 1920)
sfx(pc2, 'whoosh', { dur: .8 })
const C2 = new Term({ cols: 120, rows: 18, size: 28 })
C2.type(pc2 + .3, D.fAmbCmd, { cps: 70 })
C2.out(pc2 + 1.2, D.fAmbOut, { lps: 30 }); sfx(pc2 + 1.2, 'error')
wait(.4)
const f5 = say('f5', .3)
C2.mark(sayAt('f5', .35), sayAt('f5', .6), '[AMBIGUOUS]', 'r')
C2.mark(sayAt('f5', .6), f5 + VO.f5.dur + .3, '候选')
const f6 = say('f6', .5)
C2.type(f6 + .1, D.fClickCmd, { cps: 40 })
C2.out(f6 + .7, D.fClickOut, { lps: 20 }); sfx(f6 + .7, 'ding')
C2.mark(sayAt('f6', .5), f6 + VO.f6.dur + .4, 'confirm:', 'c')
C2.mark(sayAt('f6', .75), f6 + VO.f6.dur + .4, 'navigated: soft', 'c')
// 卡片 3：三步向导 → 旧编号作废；错误码
const pc3 = wait(0)
camTo(pc3, .9, P_form, 3 * CW + 1000, 430, 1920)
sfx(pc3, 'whoosh', { dur: .8 })
wait(.3)
const f7 = say('f7', .3)
const C3 = new Term({ cols: 120, rows: 18, size: 28 })
C3.type(pc3 + .3, D.fNextCmd, { cps: 45 })
C3.out(pc3 + 1.1, D.fNextOut, { lps: 20 })
C3.mark(sayAt('f7', .3), sayAt('f7', .6), 'navigated: soft')
const tSt = sayAt('f7', .5)
C3.type(tSt, D.fStaleCmd, { cps: 40 })
C3.out(tSt + .7, D.fStaleOut, { lps: 20 }); sfx(tSt + .7, 'error')
C3.mark(tSt + .8, f7 + VO.f7.dur + .3, 'STALE_REF', 'r')
const f8 = say('f8', .6)
D.errCodes.forEach((c, i) => sfx(f8 + .4 + i * .15, 'blip', { f: 700 + i * 60, v: .4 }))
const pc4 = sayAt('f8', .55)
camTo(pc4, 1.0, P_form, 4 * CW + 1000, 430, 1920)
sfx(pc4, 'whoosh', { dur: .9 })
// 卡片 5：trace 录下来 → 写成脚本 → 下次一条命令
const pc5 = wait(.2)
camTo(pc5, 1.0, P_form, 5 * CW + 1000, 430, 1920)
sfx(pc5, 'whoosh', { dur: .9 })
wait(.8)
const f9 = say('f9', .3)
const LT = new Term({ cols: 74, rows: 24, size: 22 })
let tt = pc5 + .8
for (const [cmd, outp] of D.fTrace) {
  if (cmd.startsWith('«d:')) { LT.put(tt, [cmd]); tt += .5; continue }
  tt = LT.type(tt, cmd, { cps: 60 }); if (outp.length) LT.out(tt + .15, outp, { lps: 14 }); tt += .6
}
const REP = new Term({ cols: 82, rows: 12, size: 19, prompt: '', cursor: false })
const tRep = sayAt('f9', .3)
REP.out(tRep, D.fReport, { lps: 9, sound: false })
REP.mark(sayAt('f9', .45), sayAt('f9', .7), 'fill')
REP.mark(sayAt('f9', .7), f9 + VO.f9.dur + .5, '/versions', 'c')
const f10 = say('f10', 2.6)
const FN = new Term({ cols: 82, rows: 9, size: 19, prompt: '', cursor: false })
FN.out(f10 + .1, D.fScript, { lps: 14, sound: false })
LT.clear(sayAt('f10', .3))
const tRun = LT.type(sayAt('f10', .3) + .1, D.fRunCmd, { cps: 40 })
LT.out(tRun + .5, D.fRunOut, { lps: 6 })
D.fRunOut.slice(0, 3).forEach((_, i) => sfx(tRun + .5 + i * .2, 'ding'))
const F1ART = () => asciiArt('f1', '每一行输出\n都是写给 AI 看的', { cols: 230, font: 'bold 200px "Microsoft YaHei",sans-serif', ramp: ' .:*#@', lh: 1.12 })
P_form.draw = (ctx, t) => {
  // 卡片 0
  frame(ctx, 40, 40, 1840, 780, { title: 'agent · 新版本上架', color: 'g', double: true })
  F0.draw(ctx, t, 80, 100)
  const fk = E.out(prog(t, tFile[0] - .3, tFile[0]))
  if (fk > 0) fade(ctx, fk, () => {
    frame(ctx, 1080, 80, 760, 330, { title: 'release/v2.4/', color: 'y', dots: false })
    D.fFiles.forEach(([n, d], i) => fade(ctx, prog(t, tFile[i], tFile[i] + .25), () => {
      txt(ctx, (n.endsWith('/') ? '▸ ' : '▤ ') + n, 1110, 120 + i * 56, 24, n.endsWith('/') ? 'y' : 'w', { weight: 'bold' })
      txt(ctx, d, 1110, 148 + i * 56, 17, 'd')
    }))
  })
  const bk = E.out(prog(t, FTABS[0].t - .2, FTABS[0].t + .3))
  if (bk > 0) fade(ctx, bk, () => {
    const cur = browserWin(ctx, t, 1080, 450, 760, 340, { tabs: FTABS, tabW: 240, tsize: 20 })
    if (cur) mtxt(ctx, '«d:杭州拾光科技有限公司 · »«G:已登录»', 1110, 600, 22)
  })
  // 卡片 1：终端 + 页面
  frame(ctx, CW + 40, 40, 1840, 780, { title: 'rsf snapshot → fill → upload', color: 'g', double: true })
  F1.draw(ctx, t, CW + 70, 100)
  {
    const x = CW + 1060, y = 70, w = 800
    frame(ctx, x, y, w, 720, { title: '星河应用市场 · 发布新版本', color: 'c', dots: false })
    D.fForm.forEach(([label, ref, val], i) => {
      const yy = y + 60 + i * 80
      txt(ctx, label, x + 30, yy + 8, 22, 'w')
      ctx.strokeStyle = COL.d; ctx.lineWidth = 1; ctx.strokeRect(x + 230, yy, 540, 44)
      const filled = ref === 'e8' ? tUpEnd + .2 : tFillEnd + .2 + i * .06
      if (t > filled) txt(ctx, val, x + 246, yy + 10, 22, 'G')
      const rk = prog(t, tSnap + .2 + i * .08, tSnap + .4 + i * .08)
      if (rk > 0) fade(ctx, rk, () => {
        ctx.fillStyle = 'rgba(255,176,46,.18)'; ctx.fillRect(x + 690, yy + 6, 70, 32)
        txt(ctx, ref, x + 725, yy + 11, 20, 'a', { align: 'center', weight: 'bold' })
      })
    })
  }
  // 卡片 2、3
  const cards = [[C2, '按名字点 / 按编号点', 2 * CW], [C3, '三步向导 · 编号作废 / 报错', 3 * CW]]
  for (const [T, title, x] of cards) {
    frame(ctx, x + 40, 40, 1840, 780, { title, color: 'g', double: true })
    T.draw(ctx, t, x + 80, 100)
  }
  const notes = [[2 * CW, '不瞎猜 → 列候选；点完 → 告诉你哪里变了', f5], [3 * CW, '页面换了，旧编号作废 · 错误码 + 下一步', f7]]
  for (const [x, s, t0] of notes) fade(ctx, prog(t, t0 + 1.4, t0 + 2), () => txt(ctx, s, x + 960, 750, 30, 'a', { align: 'center' }))
  if (t > f8 + .2) D.errCodes.forEach((c, i) => {
    const kk = clamp((t - f8 - .4 - i * .15) / .3); if (kk <= 0) return
    popIn(ctx, kk, 3 * CW + 140 + i * 190 + 87, 600 + 28, () => {
      frame(ctx, 3 * CW + 140 + i * 190, 600, 175, 56, { color: i < 2 ? 'r' : 'a', dots: false, lw: 2 })
      txt(ctx, c, 3 * CW + 140 + i * 190 + 87, 616, 19, i < 2 ? 'r' : 'a', { align: 'center' })
    })
  })
  // 卡片 4：主题句
  if (t > pc4 - .3) {
    frame(ctx, 4 * CW + 40, 40, 1840, 780, { title: 'rsf · 输出设计', color: 'g', double: true })
    drawArt(ctx, F1ART(), 4 * CW + 960, 370, 10.5, 'G', { reveal: E.out(prog(t, pc4 + .3, pc4 + 1.8)), t, seed: 3 })
    fade(ctx, prog(t, pc4 + 1.2, pc4 + 1.8), () => txt(ctx, '短 · 准 · 带编号 · 带下一步', 4 * CW + 960, 700, 34, 'a', { align: 'center' }))
  }
  // 卡片 5：trace → 脚本
  if (t > pc5 - .3) {
    const X = 5 * CW
    frame(ctx, X + 40, 40, 1000, 780, { title: 'rsf trace · rsf run', color: 'g', double: true })
    LT.draw(ctx, t, X + 70, 100)
    if (t > tRep - .3) fade(ctx, E.out(prog(t, tRep - .3, tRep + .2)), () => {
      frame(ctx, X + 1080, 40, 800, 400, { title: 'report.md · 每一步都记下了', color: 'c', dots: false })
      REP.draw(ctx, t, X + 1100, 85)
    })
    if (t > f10) fade(ctx, E.out(prog(t, f10, f10 + .5)), () => {
      frame(ctx, X + 1080, 480, 800, 340, { title: '+ publish.js', color: 'G', dots: false })
      FN.draw(ctx, t, X + 1100, 525)
    })
    if (t > tRun + .5) fade(ctx, prog(t, tRun + 1.4, tRun + 1.9), () => txt(ctx, '下次发版：一条命令，三家一起填完', X + 540, 700, 32, 'a', { align: 'center', weight: 'bold' }))
  }
}

// ===================================================================
// 07 组合：管道 + rsf run
// ===================================================================
chapter('pipe', '07 · 可组合')
const pp = mark('pipe')
const P_pipe = panel({ parent: P_form, x: 6 * CW + 300, y: 0, w: 3840, t0: pp - .6, fi: .6 })
P_form.t1 = pp + 1.2
camTo(pp, 1.2, P_pipe, 960, 430, 1920, { arc: .25 })
sfx(pp, 'whoosh', { dur: 1.1 })
wait(1.2)
const c1 = say('c1', .2)
sfx(c1 + 1.3, 'clack')
const c2 = say('c2', .2)
const PT = new Term({ cols: 146, rows: 10, size: 24 })
PT.type(c2 - 1.2, D.pipeCmd, { cps: 70 })
PT.out(c2 + 1.6, D.pipeOut, { lps: 10 })
const pc = wait(.4)
camTo(pc, .9, P_pipe, 2880, 430, 1920)
sfx(pc, 'whoosh', { dur: .8 })
wait(.5)
const c3 = say('c3', .5)
const SC = new Term({ cols: 135, rows: 14, size: 26, prompt: '', cursor: false })
SC.put(pc + .5, D.step1Code)
const BRICK = D.zKeys, BRC = D.zKeys.map(k => D.zl[k].color)
BRICK.forEach((b, i) => { SC.mark(c3 + .6 + i * .45, c3 + VO.c3.dur + .3, b + ':', BRC[i]); sfx(c3 + .8 + i * .45, 'clack') })
SC.mark(c3 + 3.6, c3 + VO.c3.dur + .3, 'allSettled', 'c')
P_pipe.draw = (ctx, t) => {
  grid(ctx, 0, 0, 3840, VH)
  const k = E.back(prog(t, c1 + .2, c1 + 1.3))
  const bx1 = lerp(-500, 250, k), bx2 = lerp(2000, 1110, k)
  const blk = (x, name, sub, c) => {
    frame(ctx, x, 90, 560, 170, { color: c, dots: false, lw: 4 })
    txt(ctx, name, x + 280, 120, 46, c, { align: 'center', weight: 'bold' })
    txt(ctx, sub, x + 280, 190, 18, 'd', { align: 'center' })
  }
  blk(bx1, 'search', 'rsf call bilibili.com search "xxx模型 实测"', 'a')
  blk(bx2, 'comments', 'rsf call bilibili.com comments -', 'c')
  if (k >= .99) {
    txt(ctx, '│', 960, 140, 60, 'G', { align: 'center', weight: 'bold', glow: 20 })
    setFont(ctx, 22); ctx.fillStyle = COL.d
    ctx.fillText('═'.repeat(50) + '▶', 640, 300)
    if (t > c2) {      // 一行一条：视频从 search 流进 comments
      const per = 1.4, s = ((t - c2) % per) / per, i = Math.floor((t - c2) / per) % 2
      const x = lerp(560, 1360, E.io(s))
      ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * s)
      frame(ctx, x - 250, 270, 500, 42, { color: 'G', dots: false, lw: 2 })
      txt(ctx, '▶ ' + D.pipeChips[i], x, 280, 20, 'G', { align: 'center' })
      ctx.restore()
    }
  }
  frame(ctx, 40, 360, 1840, 460, { title: 'pipe · 一行一条 JSON', color: 'g', double: true })
  PT.draw(ctx, t, 80, 410)
  frame(ctx, 1960, 40, 1840, 780, { title: 'step1.js · rsf run -f step1.js', color: 'g', double: true })
  SC.draw(ctx, t, 2000, 100)
  BRICK.forEach((b, i) => {
    const kk = E.back(clamp((t - c3 - .6 - i * .45) / .5)); if (kk <= 0) return
    const x = 3330 + (1 - kk) * 500, y = 100 + (2 + i) * 26 * 1.32 - 4
    frame(ctx, x, y, 220, 34, { color: BRC[i], dots: false, lw: 2 })
    txt(ctx, `◀ ${b}`, x + 110, y + 6, 22, BRC[i], { align: 'center', weight: 'bold' })
  })
}

// ===================================================================
// 08 跨站调研（高潮）：把开头那件事慢放一遍
// ===================================================================
chapter('research', '08 · 跨站调研')
const rs = mark('research')
MUSIC.push({ t: rs, lv: 2 })
const RW = 3200, RH = 1500
const P_res = panel({ parent: P_pipe, x: 4400, y: -320, w: RW, h: RH, t0: rs - .6, fi: .6 })
P_pipe.t1 = rs + 1.5
const AG = { x: 1000, y: 330, w: 1200, h: 840 }
const FULL = [1600, 760, 3300]
camTo(rs, 1.5, P_res, 1600, 700, 1700, { arc: .4 })
sfx(rs, 'whoosh', { dur: 1.4 })
wait(1.3)
const RT = new Term({ cols: 76, rows: 19, size: 30, prompt: '' })
RT.put(rs + .9, ['«d:agent · ~/work»', ''])
const x1 = say('x1', .2)
RT.type(x1 + .3, D.zPrompt, { prompt: U(''), cps: 22, color: 'w' })
const x2 = say('x2', .3)
RT.out(x2 + .1, ['', A('第 1 步：6 个站并行搜。'), TOOL('rsf run -f step1.js')], { lps: 12 })
camTo(x2 + .3, 1.8, P_res, ...FULL)
sfx(x2 + .3, 'whoosh', { dur: 1.5 })
const go = x2 + 1.0
sfx(go, 'boom'); flashAt(go, .4, .5); MUSIC.push({ t: go, lv: 4 })
const RLP = { x: [50, 60], reddit: [50, 530], hn: [50, 1000], zhihu: [2250, 60], bilibili: [2250, 530], v2ex: [2250, 1000] }
const RL = ZK.map((k, i) => {
  const L = D.zl[k], [x, y] = RLP[k]
  const T = lanePanelTerm({ cols: 66, rows: 11, size: 26, lh: 1.25 })
  T.put(go - .1, [`«${L.color}:⏵ rsf.lib('${L.name}')»`, ''])
  const done = T.out(go + i * .15, L.items.map(s => cutW(plain(s), 64)).concat(['', `«G:✓ ${L.n} 条 → { site, title, url, heat }»`]), { lps: 7, sound: i === 0, sv: .5 })
  return { k, x, y, T, L, done }
})
const allDone = Math.max(...RL.map(l => l.done))
RT.out(allDone, ['«G:✓» ' + D.zStatus], { lps: 8 }); sfx(allDone, 'ding')
const x3 = say('x3', .3)
MUSIC.push({ t: x3, lv: 3 })
const tSkip = sayAt('x3', .35)
RT.out(sayAt('x3', .45), D.zPick, { lps: 10 })
const x4 = say('x4', .3)
RT.out(x4 + .1, ['', A('第 2 步：深挖。'), TOOL('rsf run -f step2.js "1,6,13"'), ...D.zStep2], { lps: 12 })
const dig = x4 + .6
sfx(dig, 'stream', { dur: 1.2, v: .7 })
const tGreen = sayAt('x4', .45), tRed = sayAt('x4', .72), tDeep = tGreen - .4
sfx(tGreen, 'ding'); sfx(tRed, 'hit')
const x5 = say('x5', .3)
RT.out(x5 + .1, ['', A('第 3 步：一手资料。'), TOOL('rsf run -f step3.js'), ...D.zStep3], { lps: 10 })
const tSrc = [sayAt('x5', .3), sayAt('x5', .55), sayAt('x5', .8)]
tSrc.forEach(t => sfx(t, 'pop', { f: 700 }))
const x6 = say('x6', .5)
camTo(x6, 1.8, P_res, 1600, 880, 2700)
sfx(x6, 'whoosh', { dur: 1.4 })
RT.clear(x6 + .6)
RT.put(x6 + .6, ['«d:agent · ~/work»', ''])
RT.out(x6 + .7, D.zReport, { lps: 7, sv: .4 })
const x7 = say('x7', 1.0)
camTo(x7 + .1, 1.6, P_res, 1600, 900, 2800)
sfx(x7 + .1, 'whoosh', { dur: 1.2 })
// 预排文字：深挖出来的两派说法
const QQ = (c, [who, s]) => [c, who, wrapMk('“' + s + '”', 60, 'w')]
const DEEP = {
  reddit: [QQ('r', D.zRed[0]), QQ('r', D.zRed[2])],
  zhihu: [QQ('G', D.zGreen[0]), QQ('G', D.zGreen[2])],
  x: [QQ('G', D.zGreen[1]), QQ('r', D.zRed[1])],
}
const DEEPC = { reddit: 'r', zhihu: 'G', x: 'a' }
const SRC_BOX = i => ({ x: 1000 + i * 410, y: 1210, w: 380, h: 250 })
P_res.draw = (ctx, t) => {
  grid(ctx, 0, 0, RW, RH, 80)
  frame(ctx, AG.x, AG.y, AG.w, AG.h, { title: 'agent', color: 'g', double: true, tsize: 26 })
  RT.draw(ctx, t, AG.x + 30, AG.y + 50)
  fade(ctx, prog(t, go - .2, go + .2) * (1 - prog(t, x6 - .3, x6 + .3)), () => {
    txt(ctx, counter(t, go, allDone, 0, 28), 1600, 50, 180, 'G', { align: 'center', weight: 'bold', glow: 24 })
    txt(ctx, '条结果 · 6 个网站同时进行 · 一个站失败不影响别的站', 1600, 245, 34, 'g', { align: 'center' })
  })
  if (t > go - .4) {
    const a = prog(t, go - .4, go)
    RL.forEach(ln => {
      const deep = DEEP[ln.k] && t > tDeep
      const off = !DEEP[ln.k] && t > tDeep
      const skip = ln.L.skip && t > tSkip
      const dim = off ? 1 - .6 * prog(t, tDeep, tDeep + .5) : 1
      const [sx, sy] = shake(t, [[go, .4]], 10)
      fade(ctx, a * dim, () => {
        const ok = t > ln.done
        const col = deep ? DEEPC[ln.k] : skip ? 'r' : ln.L.color
        frame(ctx, ln.x + sx, ln.y + sy, 900, 430, { title: ln.L.name + (deep ? ' · 深挖' : ok ? `  ✓ ${ln.L.n}` : ''), color: col, tsize: 24, lw: 3 })
        if (!deep) {
          ln.T.draw(ctx, t, ln.x + 26 + sx, ln.y + 40 + sy)
          if (skip) {
            const k2 = prog(t, tSkip, tSkip + .6)
            ctx.save(); ctx.strokeStyle = COL.r; ctx.lineWidth = 3; ctx.globalAlpha *= .8
            ln.L.skip.forEach((j, q) => { const y = ln.y + 40 + (j + 2) * 32.5 + 16, w = 640 * clamp(k2 * 3 - q * .3); if (w > 0) { ctx.beginPath(); ctx.moveTo(ln.x + 26, y); ctx.lineTo(ln.x + 26 + w, y); ctx.stroke() } })
            ctx.restore()
            popIn(ctx, prog(t, tSkip + .3, tSkip + .7), ln.x + 700, ln.y + 360, () => {
              ctx.fillStyle = 'rgba(30,4,8,.95)'; ctx.fillRect(ln.x + 480, ln.y + 330, 400, 60); ctx.strokeStyle = COL.r; ctx.lineWidth = 3; ctx.strokeRect(ln.x + 480, ln.y + 330, 400, 60)
              txt(ctx, '✗ 旧模型 · 跳过', ln.x + 680, ln.y + 344, 30, 'r', { align: 'center', weight: 'bold' })
            })
          }
        } else {
          let y = ln.y + 50
          DEEP[ln.k].forEach(([c, who, rows], j) => {
            const tq = c === 'r' ? tRed + j * .25 : tGreen + j * .2, k3 = prog(t, tq - .2, tq + .3)
            fade(ctx, k3, () => {
              ctx.fillStyle = COL[c]; ctx.fillRect(ln.x + 26, y + 4, 6, rows.length * 34 - 8)
              drawRows(ctx, rows, ln.x + 46, y, 26, 1.3)
              txt(ctx, '— ' + who, ln.x + 870, y + rows.length * 34, 18, 'd', { align: 'right' })
            })
            y += rows.length * 34 + 34
          })
        }
      })
    })
    // 两派标签
    fade(ctx, prog(t, tGreen, tGreen + .4) * (1 - prog(t, x6 - .3, x6 + .3)), () => txt(ctx, '✓ 吊打一切', 2700, 20, 30, 'G', { align: 'center', weight: 'bold' }))
    fade(ctx, prog(t, tRed, tRed + .4) * (1 - prog(t, x6 - .3, x6 + .3)), () => txt(ctx, '✗ 在刷榜', 500, 490, 30, 'r', { align: 'center', weight: 'bold' }))
  }
  D.zSources.forEach(([name, c, lines], i) => {
    const k = prog(t, tSrc[i], tSrc[i] + .4) * (1 - prog(t, x7 + .2, x7 + .6))
    if (k <= 0) return
    const b = SRC_BOX(i)
    popIn(ctx, k, b.x + b.w / 2, b.y + b.h / 2, () => {
      frame(ctx, b.x, b.y, b.w, b.h, { title: name, color: c, lw: 3, dots: false, tsize: 20 })
      lines.forEach((l, j) => mtxt(ctx, l, b.x + 24, b.y + 52 + j * 54, 23, 'w'))
    })
  })
  if (t > x7) D.zFiles.forEach(([f, d, st], i) => {
    const k = clamp((t - x7 - .5 - i * .35) / .4); if (k <= 0) return
    const b = SRC_BOX(i)
    popIn(ctx, k, b.x + b.w / 2, b.y + b.h / 2, () => {
      frame(ctx, b.x, b.y, b.w, b.h, { title: st + ' · 可单独重跑', color: 'c', dots: false, lw: 3, tsize: 20 })
      txt(ctx, '▤', b.x + 24, b.y + 60, 50, 'c')
      txt(ctx, f.replace('research/', ''), b.x + 90, b.y + 66, 28, 'w', { weight: 'bold' })
      txt(ctx, d, b.x + 24, b.y + 150, 24, 'd')
    })
  })
}
TL.sfx.push({ t: x7 + .5, name: 'pop', o: { f: 500 } }, { t: x7 + .85, name: 'pop', o: { f: 600 } }, { t: x7 + 1.2, name: 'pop', o: { f: 700 } })

// ===================================================================
// 09 越用越熟：拉回星图
// ===================================================================
chapter('loop', '09 · 越用越熟')
const lp = mark('loop')
P_res.t1 = lp + 2.4
P_stars.vis.push([lp - .2, 1e9])
camTo(lp, 3.0, P_stars, 960, 430, 2100, { ease: E.io })
sfx(lp, 'whoosh', { dur: 2.8, up: false })
wait(.6)
const t3 = say('t3', .8)

// ===================================================================
// 10 结尾
// ===================================================================
chapter('outro', '10 · Recursurf')
const ot = mark('outro')
MUSIC.push({ t: ot - 1.5, lv: 4 })
const conv = ot + .4
sfx(conv, 'riser', { dur: 1.6 })
sfx(conv + 2.0, 'boom'); flashAt(conv + 2.0, .6)
wait(2.3)
const o1 = say('o1', .6)
const OT = new Term({ cols: 50, rows: 4, size: 26 })
OT.type(o1 + 3.4, 'npm install && npm link', { cps: 22 })
OT.type(o1 + 5.0, 'rsf read «a:<任何网页>»', { cps: 18 })
wait(7.5)
const end = mark('end')
MUSIC.push({ t: end - 1.6, lv: 0 })
sfx(end, 'off')
wait(2.5)
TL.total = at()
P_stars.draw = (ctx, t) => {
  const conv0 = conv, convK = prog(t, conv0, conv0 + 2.0)
  ctx.save()
  for (const s of STARS) {
    const k = t > t3 - .5 ? 1 : prog(t, l4 + .2 + s.d * .9, l4 + .5 + s.d * .9)
    if (k <= 0 || convK > 0) continue
    const [cx, cy] = STARS.cats[s.c]
    ctx.globalAlpha = k * .25; ctx.strokeStyle = COL.g; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(s.x, s.y); ctx.stroke()
  }
  // 回顾：走过的路径
  if (t > t3) {
    const k = prog(t, t3 + .6, t3 + 2) * (1 - convK)
    ctx.globalAlpha = k * .9; ctx.strokeStyle = COL.a; ctx.lineWidth = 2; ctx.setLineDash([6, 6])
    const pts = ['bilibili.com', 'zhihu.com', 'x.com', 'reddit.com'].map(starOf)
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 120, b.x, b.y) }
    ctx.stroke(); ctx.setLineDash([])
  }
  ctx.restore()
  for (const s of STARS) {
    const k = t > t3 - .5 ? 1 : prog(t, l4 + .2 + s.d * .9, l4 + .5 + s.d * .9)
    if (k <= 0 || convK > 0) continue
    const tw = .75 + .25 * Math.sin(t * 3 + s.i * 1.7 + s.ci)
    ctx.globalAlpha = k
    const hot = HOT.has(s.s)
    txt(ctx, '✦', s.x, s.y - 11, hot ? 26 : 18, hot ? 'a' : 'G', { align: 'center', glow: 12 * tw })
    txt(ctx, s.s, s.x, s.y + 12, hot ? 16 : 12, hot ? 'y' : 'g', { align: 'center' })
  }
  ctx.globalAlpha = 1
  if (convK <= 0) for (const [c, [x, y]] of Object.entries(STARS.cats)) {
    const k = t > t3 - .5 ? 1 : prog(t, l4 + .3, l4 + 1.5)
    ctx.globalAlpha = k * .9
    if (c !== '视频') txt(ctx, `[ ${c} ]`, x, y - 90, 20, 'a', { align: 'center', weight: 'bold' })
    else txt(ctx, `[ ${c} ]`, x, y + 50, 20, 'a', { align: 'center', weight: 'bold' })
  }
  ctx.globalAlpha = 1
  if (t > l4 && t < fm) { ctx.globalAlpha = prog(t, l4 + 1, l4 + 2); txt(ctx, '50 个网站 · rsf lib list', 960, 800, 26, 'w', { align: 'center' }); ctx.globalAlpha = 1 }
  if (convK > 0) {
    if (t < conv0 + 2.05) converge(ctx, t, conv0, 2.0, 960, 330, 24, i => { const s = STARS[i % STARS.length]; return [s.x + (hash(i) - .5) * 40, s.y + (hash(i + 1) - .5) * 20] })
    else {
      drawArt(ctx, LOGO(), 960, 330, 24, 'G', { grad: logoGrad, glow: 16 + 6 * Math.sin(t * 3) })
      fade(ctx, prog(t, o1, o1 + .8), () => txt(ctx, '给 AI 一双能上网的手', 960, 560, 52, 'w', { align: 'center', weight: 'bold' }))
      OT.draw(ctx, t, 760, 660)
      const fd = prog(t, end - .1, end + .5)
      if (fd > 0) { ctx.fillStyle = `rgba(0,0,0,${fd})`; ctx.fillRect(-2000, -2000, 6000, 6000) }
    }
  }
}
