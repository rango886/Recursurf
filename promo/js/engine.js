// ============ 基础工具 ============
const VW = 1920, VH = 860            // 画面区（上下黑边之间）
const FONT = '"Sarasa Fixed SC","Sarasa Term SC","Cascadia Mono",Consolas,"Microsoft YaHei",monospace'
const FONT_UI = '"Sarasa UI SC","Microsoft YaHei UI","Microsoft YaHei",sans-serif'
const COL = {
  g: '#3dff8a', G: '#9dffc4', a: '#ffb02e', c: '#4fd8ff', r: '#ff4d5e', w: '#f2fff6',
  d: '#3f7a57', y: '#ffe066', m: '#d98cff', b: '#6c8cff', k: '#050a07',
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a, b, k) => a + (b - a) * k
const prog = (t, a, b) => clamp((t - a) / (b - a))
const E = {
  lin: k => k,
  io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  expo: k => k === 0 ? 0 : k === 1 ? 1 : k < .5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
  back: k => { const c = 1.70158 + 1; return 1 + c * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2) },
  smooth: k => k * k * (3 - 2 * k),
}
// 窗口淡入淡出：t 在 [a,b] 内为 1，前后 f 秒过渡
const win = (t, a, b, fi = .4, fo = fi) => Math.min(prog(t, a - fi, a), 1 - prog(t, b, b + fo))
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }
const GLY = '01<>/\\{}[]()#$%&*+=-:;~^|!?abcdefxyzABCDEFXYZ@'
const glyph = n => GLY[Math.floor(hash(n) * GLY.length)]
const isWide = ch => /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6\u3000-\u303f〔〕]/.test(ch)
const strW = s => { let w = 0; for (const ch of s) w += isWide(ch) ? 2 : 1; return w }

// ============ 时间轴 ============
const TL = { t: 0, marks: {}, cues: [], sfx: [], chapters: [], cam: [], beats: [] }
const M = TL.marks
function mark(n) { M[n] = TL.t; return TL.t }
function wait(s) { TL.t += s; return TL.t }
function at() { return TL.t }
function say(id, pad = .35) {
  const v = VO[id]
  TL.cues.push({ id, t: TL.t, dur: v.dur, zh: v.zh, en: v.en })
  M[id] = TL.t; M[id + '_end'] = TL.t + v.dur
  TL.t += v.dur + pad
  return M[id]
}
function chapter(id, label) { TL.chapters.push({ id, label, t: TL.t }); M['ch_' + id] = TL.t }
function sfx(t, name, o = {}) { TL.sfx.push({ t, name, o }) }

// ============ 面板（场景树） ============
const PANELS = []
function panel(o) {
  const p = Object.assign({ x: 0, y: 0, s: 1, w: VW, h: VH, t0: -1e9, t1: 1e9, fi: .5, fo: .5, pad: 0 }, o)
  PANELS.push(p); return p
}
function resolve(p) {      // 世界坐标：wx, wy 为本地 (0,0) 的世界位置，ws 为本地 1 单位的世界尺寸
  if (p._r) return
  const x = typeof p.x === 'function' ? p.x() : p.x, y = typeof p.y === 'function' ? p.y() : p.y
  const s = typeof p.s === 'function' ? p.s() : p.s
  if (p.parent) { resolve(p.parent); p.wx = p.parent.wx + x * p.parent.ws; p.wy = p.parent.wy + y * p.parent.ws; p.ws = p.parent.ws * s }
  else { p.wx = x; p.wy = y; p.ws = s }
  p._r = true
}
// 本地点 → 世界点
function W(p, lx, ly) { resolve(p); return [p.wx + lx * p.ws, p.wy + ly * p.ws] }

// ============ 镜头 ============
// camTo(开始时间, 时长, 面板, 本地中心x, 本地中心y, 本地视宽, {ease, arc})
function camTo(t, dur, p, lx, ly, lw, o = {}) { TL.cam.push({ t, dur, p, lx, ly, lw, ease: o.ease || E.io, arc: o.arc || 0, shake: o.shake || 0 }) }
function camAt(t) {
  const K = TL.cam
  for (const k of K) if (!k.c) { const [x, y] = W(k.p, k.lx, k.ly); k.c = { x, y, w: k.lw * k.p.ws } }
  let prev = K[0].c, cur = prev
  for (let i = 0; i < K.length; i++) {
    const k = K[i]
    if (t < k.t) break
    if (t < k.t + k.dur) {
      const a = prev, b = k.c, s = k.ease((t - k.t) / k.dur)
      const lr = Math.log(b.w / a.w)
      let w = a.w * Math.exp(lr * s), x, y
      if (Math.abs(lr) > .4) {      // 推拉：保证目标点平滑地走到画面中心
        const f = (w - b.w) / (a.w - b.w)
        x = b.x + (a.x - b.x) * f; y = b.y + (a.y - b.y) * f
      } else { x = lerp(a.x, b.x, s); y = lerp(a.y, b.y, s) }
      if (k.arc) w *= 1 + k.arc * Math.sin(Math.PI * s)
      cur = { x, y, w }
      return cur
    }
    prev = k.c; cur = k.c
  }
  return cur
}

// ============ 文字 ============
const MK = new Map()
function parseMk(s, def = 'g') {     // «c:文字» → [{ch, c}]（结果缓存：每帧都会调很多次，别反复分配）
  const key = def + '\u0001' + s
  let v = MK.get(key)
  if (v) return v
  if (MK.size > 20000) MK.clear()
  v = parseMk0(s, def); MK.set(key, v)
  return v
}
function parseMk0(s, def) {
  const out = []; let i = 0
  const re = /«(\w):((?:[^«»]|«\w:[^«»]*»)*)»/g
  let m
  const push = (txt, c) => { for (const ch of txt) out.push({ ch, c }) }
  while ((m = re.exec(s))) {
    push(s.slice(i, m.index), def)
    const inner = m[2]
    if (inner.includes('«')) parseMk0(inner, m[1]).forEach(o => out.push(o)); else push(inner, m[1])
    i = m.index + m[0].length
  }
  push(s.slice(i), def)
  return out
}
const plain = s => s.replace(/«\w:|»/g, '')
function wrapCells(cells, cols) {
  const rows = []; let row = [], w = 0
  for (const c of cells) {
    const cw = isWide(c.ch) ? 2 : 1
    if (w + cw > cols) { rows.push(row); row = []; w = 0 }
    row.push(c); w += cw
  }
  rows.push(row)
  return rows
}
function setFont(ctx, size, weight = '') { ctx.font = `${weight} ${size}px ${FONT}`; ctx.textBaseline = 'top' }
// 画一行 cells：按颜色分段；n = 只画前 n 个字符；scr = 未出现字符显示乱码
function drawCells(ctx, row, x, y, size, n = 1e9, o = {}) {
  const cw = size / 2
  let col = 0, run = '', runC = null, runX = x
  const flush = () => { if (run) { ctx.fillStyle = COL[runC] || runC; ctx.fillText(run, runX, y) } run = '' }
  for (let i = 0; i < row.length && i < n; i++) {
    const c = row[i], color = o.color || c.c
    if (color !== runC) { flush(); runC = color; runX = x + col * cw }
    run += c.ch; col += isWide(c.ch) ? 2 : 1
  }
  flush()
  return col * cw
}
// 简单文字
function txt(ctx, s, x, y, size, color = 'g', o = {}) {
  setFont(ctx, size, o.weight || '')
  ctx.textAlign = o.align || 'left'
  ctx.fillStyle = COL[color] || color
  if (o.glow) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = o.glow * .5 }
  ctx.fillText(s, x, y)
  ctx.shadowBlur = 0; ctx.textAlign = 'left'
}
function mtxt(ctx, s, x, y, size, def = 'g', n) {   // 带标记的一行
  setFont(ctx, size)
  return drawCells(ctx, parseMk(s, def), x, y, size, n)
}
// 打字机：返回 t 时刻应显示的字符数
const typed = (t, t0, len, cps = 30) => clamp(Math.floor((t - t0) * cps), 0, len)

// ============ 窗口框（ASCII 风格） ============
function frame(ctx, x, y, w, h, o = {}) {
  const c = COL[o.color || 'g'] || o.color, a = o.alpha ?? 1
  ctx.save(); ctx.globalAlpha *= a
  ctx.fillStyle = o.bg || 'rgba(4,14,8,0.92)'; ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = c; ctx.lineWidth = o.lw || 2
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
  if (o.double) { ctx.globalAlpha *= .45; ctx.strokeRect(x + 7, y + 7, w - 14, h - 14); ctx.globalAlpha /= .45 }
  if (o.title !== undefined) {
    const sz = o.tsize || 20
    setFont(ctx, sz)
    const label = `┤ ${o.title} ├`
    const tw = strW(label) * sz / 2
    ctx.fillStyle = o.bg || 'rgba(4,14,8,1)'; ctx.fillRect(x + 24, y - sz / 2, tw, sz)
    ctx.fillStyle = c; ctx.fillText(label, x + 24, y - sz / 2 + 1)
    if (o.dots !== false) {   // 右上角三个小方块
      for (let i = 0; i < 3; i++) { ctx.fillStyle = [COL.r, COL.a, COL.g][i]; ctx.fillRect(x + w - 90 + i * 24, y - 6, 12, 12) }
    }
  }
  ctx.restore()
}
// 高亮框（四角括号 + 底色），k = 0..1 出现进度
function hilite(ctx, x, y, w, h, k, color = 'a') {
  if (k <= 0) return
  const c = COL[color] || color
  ctx.save()
  const e = E.out(clamp(k))
  const pad = lerp(26, 6, e)
  const X = x - pad, Y = y - pad / 2, Wd = w + pad * 2, H = h + pad
  ctx.globalAlpha *= .16 * e; ctx.fillStyle = c; ctx.fillRect(X, Y, Wd, H)
  ctx.globalAlpha /= (.16 * e || 1); ctx.globalAlpha *= e
  ctx.strokeStyle = c; ctx.lineWidth = 3
  const L = Math.min(22, Wd / 3, H / 2)
  ctx.beginPath()
  ctx.moveTo(X, Y + L); ctx.lineTo(X, Y); ctx.lineTo(X + L, Y)
  ctx.moveTo(X + Wd - L, Y); ctx.lineTo(X + Wd, Y); ctx.lineTo(X + Wd, Y + L)
  ctx.moveTo(X + Wd, Y + H - L); ctx.lineTo(X + Wd, Y + H); ctx.lineTo(X + Wd - L, Y + H)
  ctx.moveTo(X + L, Y + H); ctx.lineTo(X, Y + H); ctx.lineTo(X, Y + H - L)
  ctx.stroke()
  ctx.restore()
}

// ============ 终端 ============
const TERM_CACHED = new Set()
function freeTermCache() {      // 超过 2 秒没画过的终端，释放离屏画布
  const now = performance.now()
  for (const T of TERM_CACHED) if (now - T._used > 2000) { T._cv = null; T._key = null; TERM_CACHED.delete(T) }
}
// 事件：type（打字命令）、out（逐行输出）、put（瞬间出现）、clear
class Term {
  constructor(o) {
    Object.assign(this, { cols: 150, rows: 30, size: 20, lh: 1.32, prompt: '«G:❯» ', ev: [], hl: [] }, o)
  }
  rowsOf(s, def) { return wrapCells(parseMk(s, def), this.cols) }
  type(t, cmd, o = {}) {
    const pre = o.prompt ?? this.prompt
    const cells = parseMk(pre + cmd, o.color || 'w')
    const preLen = parseMk(pre).length
    const cps = o.cps || 34
    const dur = (cells.length - preLen) / cps
    this.ev.push({ t, kind: 'type', rows: wrapCells(cells, this.cols), preLen, cps, len: cells.length })
    if (o.sound !== false) for (let i = 0; i < cells.length - preLen; i += 2) sfx(t + i / cps, 'key', { v: .5 })
    if (o.enter !== false) sfx(t + dur + .05, 'enter')
    return t + dur
  }
  out(t, lines, o = {}) {
    const rows = []
    for (const l of lines) rows.push(...this.rowsOf(l, o.color || 'g'))
    const lps = o.lps || 45
    this.ev.push({ t, kind: 'out', rows, lps })
    if (o.sound !== false) sfx(t, 'stream', { dur: rows.length / lps, v: o.sv || .5 })
    return t + rows.length / lps
  }
  put(t, lines, o = {}) { return this.out(t, lines, Object.assign({ lps: 1e6, sound: false }, o)) }
  clear(t) { this.ev.push({ t, kind: 'clear' }); return t }
  // t 时刻屏幕上的行：[{row, n(显示字符数), typing}]
  buffer(t) {
    let buf = []
    for (const e of this.ev) {
      if (t < e.t) break
      if (e.kind === 'clear') { buf = []; continue }
      if (e.kind === 'type') {
        const n = e.preLen + typed(t, e.t, e.len - e.preLen, e.cps)
        let left = n
        e.rows.forEach((r, i) => { if (left > 0 || i === 0) buf.push({ row: r, n: left, typing: left < e.len }); left -= r.length })
        // 最后一个可见行加光标
        buf.cur = n < e.len
      } else {
        const k = Math.floor((t - e.t) * e.lps)
        for (let i = 0; i < e.rows.length && i < k; i++) buf.push({ row: e.rows[i], n: 1e9 })
      }
    }
    return buf
  }
  // 高亮：按包含的文字匹配行
  mark(t0, t1, match, color = 'a', full = true) { this.hl.push({ t0, t1, match, color, full }) }
  rowRect(t, match, x0 = 0, y0 = 0, full = false) {
    const buf = this.buffer(t), start = Math.max(0, buf.length - this.rows)
    for (let i = start; i < buf.length; i++) {
      const s = buf[i].row.map(c => c.ch).join('')
      const j = s.indexOf(match)
      if (j >= 0) {
        const cw = this.size / 2, lh = this.size * this.lh
        if (full) {
          const a = s.search(/\S/), e = s.replace(/\s+$/, '')
          return { x: x0 + strW(s.slice(0, a)) * cw, y: y0 + (i - start) * lh, w: strW(e.slice(a)) * cw, h: lh, row: i - start }
        }
        const col = strW(s.slice(0, j))
        return { x: x0 + col * cw, y: y0 + (i - start) * lh, w: strW(match) * cw, h: lh, row: i - start }
      }
    }
    return null
  }
  draw(ctx, t, x, y) {
    const buf = this.buffer(t)
    const start = Math.max(0, buf.length - this.rows)
    const lh = this.size * this.lh
    // 高亮底
    for (const h of this.hl) {
      const k = win(t, h.t0, h.t1, .35, .35)
      if (k <= 0) continue
      const r = this.rowRect(t, h.match, x, y, h.full)
      if (r) hilite(ctx, r.x, r.y - 2, r.w, r.h, k, h.color)
    }
    setFont(ctx, this.size)
    // 已经完整显示的行画进离屏缓存（内容没变就直接贴图），正在打字的那行单独画
    let end = buf.length
    while (end > start && buf[end - 1].n < buf[end - 1].row.length) end--
    const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b)
    const bucket = Math.pow(2, Math.ceil(Math.log2(Math.max(sc, 1 / 32))))
    const W = this.cols * this.size / 2 + 4, H = this.rows * lh + 4
    const pw = Math.ceil(W * bucket), ph = Math.ceil(H * bucket)
    if (end > start && pw <= 6144 && ph <= 6144) {
      const key = `${start}:${end}:${bucket}`
      if (this._key !== key || this._r0 !== buf[start].row || this._r1 !== buf[end - 1].row) {
        if (!this._cv) this._cv = document.createElement('canvas')
        const cv = this._cv
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph }
        const g = cv.getContext('2d')
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph)
        g.setTransform(bucket, 0, 0, bucket, 0, 0)
        setFont(g, this.size)
        for (let i = start; i < end; i++) drawCells(g, buf[i].row, 0, (i - start) * lh, this.size)
        this._key = key; this._r0 = buf[start].row; this._r1 = buf[end - 1].row
      }
      ctx.drawImage(this._cv, 0, 0, pw, ph, x, y, W, H)
      this._used = performance.now(); TERM_CACHED.add(this)
    } else end = start
    let lastX = x, lastY = y
    if (end > start) { const b = buf[end - 1]; lastY = y + (end - 1 - start) * lh; lastX = x + strW(b.row.map(c => c.ch).join('')) * this.size / 2 }
    for (let i = end; i < buf.length; i++) {
      const b = buf[i], yy = y + (i - start) * lh
      const w = drawCells(ctx, b.row, x, yy, this.size, b.n)
      lastX = x + w; lastY = yy
    }
    // 光标
    if ((buf.cur || Math.floor(t * 2.2) % 2 === 0) && this.cursor !== false) {
      ctx.fillStyle = COL.g; ctx.fillRect(lastX + 2, lastY + 2, this.size * .5, this.size * 1.05)
    }
  }
}

// ============ ASCII 光栅化：把字 / 图形变成字符画 ============
const ART = {}
function asciiArt(key, text, o = {}) {
  if (ART[key]) return ART[key]
  const cols = o.cols || 80, font = o.font || `900 200px "Arial Black", "Microsoft YaHei", sans-serif`
  const c = document.createElement('canvas'), g = c.getContext('2d')
  g.font = font
  const lines = text.split('\n')
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), lh = parseInt(font.match(/(\d+)px/)[1]) * (o.lh || 1.05)
  c.width = Math.ceil(tw + 40); c.height = Math.ceil(lh * lines.length + 30)
  g.font = font; g.fillStyle = '#fff'; g.textBaseline = 'top'
  lines.forEach((l, i) => g.fillText(l, 20 + (tw - g.measureText(l).width) / 2, 10 + i * lh))
  const cellW = c.width / cols, cellH = cellW * 2, rows = Math.floor(c.height / cellH)
  const data = g.getImageData(0, 0, c.width, c.height).data
  const ramp = o.ramp || ' .:-=+*#%@'
  const out = []
  for (let r = 0; r < rows; r++) {
    let s = ''
    for (let q = 0; q < cols; q++) {
      let sum = 0, n = 0
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) {
        const px = Math.floor((q + (xx + .5) / 3) * cellW), py = Math.floor((r + (yy + .5) / 3) * cellH)
        sum += data[(py * c.width + px) * 4 + 3]; n++
      }
      const v = sum / n / 255
      s += ramp[Math.min(ramp.length - 1, Math.floor(v * (ramp.length - .01)))]
    }
    out.push(s)
  }
  // 去掉空行
  while (out.length && !out[0].trim()) out.shift()
  while (out.length && !out[out.length - 1].trim()) out.pop()
  const minL = Math.min(...out.filter(s => s.trim()).map(s => s.search(/\S/)))
  const trimmed = out.map(s => s.slice(minL).replace(/\s+$/, ''))
  const art = { rows: trimmed, cols: Math.max(...trimmed.map(s => s.length)), h: trimmed.length }
  ART[key] = art
  return art
}
// 画字符画：reveal 0..1 解码进度（随机顺序），居中于 (cx, cy)
function drawArt(ctx, art, cx, cy, size, color = 'g', o = {}) {
  const cw = size * .6, lh = size * (o.lh || 1)
  const x0 = cx - art.cols * cw / 2, y0 = cy - art.h * lh / 2
  ctx.save()
  ctx.font = `${o.weight || 'bold'} ${size}px ${FONT}`; ctx.textBaseline = 'top'
  ctx.fillStyle = COL[color] || color
  const rv = o.reveal ?? 1, seed = o.seed || 1, tt = o.t || 0
  art.rows.forEach((row, r) => {
    let s = ''
    for (let q = 0; q < row.length; q++) {
      const ch = row[q]
      if (ch === ' ') { s += ' '; continue }
      const h = hash(seed + r * 131 + q * 7)
      if (h < rv - .15 || rv >= 1) s += ch
      else if (h < rv) s += glyph(seed + q + r * 9 + Math.floor(tt * 24))
      else s += ' '
    }
    if (o.grad) ctx.fillStyle = o.grad(r / art.h)
    for (let q = 0; q < s.length; q++) if (s[q] !== ' ') ctx.fillText(s[q], x0 + q * cw, y0 + r * lh)
  })
  ctx.restore()
  return { x: x0, y: y0, w: art.cols * cw, h: art.h * lh, cw, lh }
}

// ============ 字符雨 / 背景 ============
function rain(ctx, t, x, y, w, h, o = {}) {
  const size = o.size || 18, cols = Math.floor(w / (size * .6)), alpha = o.alpha ?? .35
  ctx.save(); setFont(ctx, size)
  for (let i = 0; i < cols; i++) {
    const sp = 120 + hash(i) * 260, len = 8 + Math.floor(hash(i + 9) * 18)
    const head = ((t * sp + hash(i + 3) * h * 3) % (h + len * size)) - len * size
    for (let j = 0; j < len; j++) {
      const yy = head + j * size
      if (yy < 0 || yy > h - size) continue
      const k = j / len
      ctx.globalAlpha = alpha * k * k
      ctx.fillStyle = j === len - 1 ? COL.G : COL[o.color || 'g']
      ctx.fillText(glyph(i * 31 + j + Math.floor(t * 8 + hash(i) * 10)), x + i * size * .6, y + yy)
    }
  }
  ctx.restore()
}
function grid(ctx, x, y, w, h, step = 60, a = .07) {
  ctx.save(); ctx.strokeStyle = COL.g; ctx.globalAlpha *= a; ctx.lineWidth = 1
  ctx.beginPath()
  for (let gx = x; gx <= x + w; gx += step) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h) }
  for (let gy = y; gy <= y + h; gy += step) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy) }
  ctx.stroke(); ctx.restore()
}

// ============ 渲染器 ============
const R = { glitch: [], flash: [] }
function glitchAt(t, dur = .35, amt = 1) { R.glitch.push({ t, dur, amt }); sfx(t, 'glitch', { dur }) }
function flashAt(t, dur = .5, amt = 1) { R.flash.push({ t, dur, amt }) }
function envOf(list, t) { let v = 0; for (const g of list) if (t >= g.t && t < g.t + g.dur) v = Math.max(v, g.amt * (1 - (t - g.t) / g.dur)); return v }

function render(ctx, t, cv, bloomCv) {
  const sw = cv.width, sh = cv.height, k = sw / VW
  // 余辉：不完全清屏
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(3,8,5,0.62)'; ctx.fillRect(0, 0, sw, sh)
  const cam = camAt(t)
  // 手持感：很轻微的漂移
  const dx = Math.sin(t * .37) * .0018 * cam.w + Math.sin(t * 1.3) * .0006 * cam.w
  const dy = Math.cos(t * .29) * .0016 * cam.w
  const sc = VW / cam.w
  const left = cam.x + dx - cam.w / 2, top = cam.y + dy - cam.w * VH / VW / 2
  for (const p of PANELS) {
    resolve(p)
    const a = p.vis ? Math.max(0, ...p.vis.map(([a, b]) => win(t, a, b, p.fi, p.fo))) : win(t, p.t0, p.t1, p.fi, p.fo)
    if (a <= 0.001) continue
    const ps = p.ws * sc
    const sx = (p.wx - left) * sc, sy = (p.wy - top) * sc
    const pw = p.w * ps, ph = p.h * ps, pad = p.pad * ps
    if (sx + pw + pad < 0 || sy + ph + pad < 0 || sx - pad > VW || sy - pad > VH) continue
    if (pw < 2 && !p.always) continue
    if (ps > (p.maxScale || 400)) continue
    ctx.setTransform(k * ps, 0, 0, k * ps, k * sx, k * sy)
    ctx.globalAlpha = a
    p.draw(ctx, t, p, ps)
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1
  freeTermCache()
  // 辉光：缩小 → 模糊 → 叠加
  const bg = bloomCv.getContext('2d')
  bg.globalCompositeOperation = 'copy'
  bg.filter = 'blur(3px)'
  bg.drawImage(cv, 0, 0, bloomCv.width, bloomCv.height)
  bg.filter = 'none'
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55
  ctx.drawImage(bloomCv, 0, 0, sw, sh)
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
  // 闪白
  const fl = envOf(R.flash, t)
  if (fl > 0) { ctx.fillStyle = `rgba(200,255,220,${fl * .4})`; ctx.fillRect(0, 0, sw, sh) }
  // 故障：横向错位切片 + 色偏
  const gl = envOf(R.glitch, t)
  if (gl > 0) {
    const n = 4 + Math.floor(gl * 10)
    for (let i = 0; i < n; i++) {
      const h = Math.floor(hash(i + Math.floor(t * 40)) * 60 * k + 4)
      const y = Math.floor(hash(i * 3 + Math.floor(t * 40)) * sh)
      const off = (hash(i * 7 + Math.floor(t * 50)) - .5) * 160 * k * gl
      ctx.drawImage(cv, 0, y, sw, h, off, y, sw, h)
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 * gl
    ctx.drawImage(cv, 8 * k * gl, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
  }
}
