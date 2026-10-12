// ============ 主循环 / 字幕 / 控制 ============
const $ = id => document.getElementById(id)
const cv = $('cv'), ctx = cv.getContext('2d')
const bloom = document.createElement('canvas')
const Q = new URLSearchParams(location.search)
let fit = 1, showSub = true, showEn = true, started = false

function layout() {
  fit = Math.min(innerWidth / 1920, innerHeight / 1080)
  const st = $('stage')
  st.style.transform = `scale(${fit}) translate(-50%,-50%)`
  st.style.transform = `translate(-50%,-50%) scale(${fit})`
  st.style.transformOrigin = '50% 50%'
  const dpr = Math.min(devicePixelRatio || 1, 2)
  cv.width = Math.round(VW * fit * dpr); cv.height = Math.round(VH * fit * dpr)
  bloom.width = Math.round(cv.width / 4); bloom.height = Math.round(cv.height / 4)
}
addEventListener('resize', layout); layout()

// 章节刻度
for (const c of TL.chapters) { const i = document.createElement('i'); i.style.left = (c.t / TL.total * 100) + '%'; $('ticks').appendChild(i) }

// 开始页的 Logo
$('start-logo').textContent = LOGO().rows.join('\n')

// 字幕：旁白播到哪句显示哪句；相邻两句间隔很短时不闪烁
let curCue = null
function cueAt(t) {
  const C = TL.cues
  for (let i = 0; i < C.length; i++) {
    const c = C[i], next = C[i + 1]
    const hold = next ? Math.min(.6, Math.max(0, next.t - (c.t + c.dur) - .05)) : .6
    if (t >= c.t - .05 && t < c.t + c.dur + hold) return c
  }
  return null
}
function subs(t) {
  const c = showSub ? cueAt(t) : null
  if (c !== curCue) {
    curCue = c
    const zh = $('sub-zh'), en = $('sub-en')
    zh.classList.add('hide'); en.classList.add('hide')
    if (c) setTimeout(() => {
      if (curCue !== c) return
      zh.textContent = c.zh; en.textContent = c.en
      zh.classList.remove('hide'); if (showEn) en.classList.remove('hide')
    }, 90)
  }
}
const pad2 = n => String(Math.floor(n)).padStart(2, '0')
let lastCh = ''
function hud(t) {
  let ch = TL.chapters[0]; for (const c of TL.chapters) if (c.t <= t + .01) ch = c
  if (ch.label !== lastCh) { lastCh = ch.label; $('chapter').textContent = ch.label }
  $('tcv').textContent = `${pad2(t / 60)}:${pad2(t % 60)}:${pad2((t % 1) * 24)}`
  $('bar').style.width = (t / TL.total * 100) + '%'
}

// 时钟：有声时以音频时钟为准
let stillT = Q.has('t') ? parseFloat(Q.get('t')) : null
function now() { return AU.ctx ? tlVis() : (stillT ?? 0) }
function loop() {
  let t = now()
  if (t >= TL.total) { t = TL.total; if (AU.playing) { auPause(); AU.base = TL.total } }
  const ended = started && !AU.playing && AU.base >= TL.total - .05
  document.body.classList.toggle('ended', ended)
  $('paused').textContent = ended ? '■ 完 · 按 R 重播' : '❚❚ 暂停'
  auTick()
  R.t = t
  render(ctx, t, cv, bloom)
  subs(t); hud(t)
  requestAnimationFrame(loop)
}

function seek(t) {
  t = clamp(t, 0, TL.total - .01)
  const wasPlaying = AU.playing
  if (wasPlaying) auPlay(t); else AU.base = t
  // 跳转后清掉余辉
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height)
}
function togglePause() {
  if (!started) return
  if (AU.playing) { auPause(); document.body.classList.add('paused') }
  else { if (AU.base >= TL.total - .05) AU.base = 0; auPlay(AU.base); document.body.classList.remove('paused') }
}

async function boot() {
  auInit()
  await auLoad(k => $('start-btn').textContent = `[ 加载旁白 ${Math.round(k * 100)}% ]`)
  $('start-btn').textContent = '[ ▶ 点击 或 按 Enter 开始 ]'
  const go = async () => {
    if (started) return
    started = true
    await AU.ctx.resume()
    $('start').style.display = 'none'
    auPlay(Q.has('from') ? parseFloat(Q.get('from')) : 0)
  }
  $('start').onclick = go
  addEventListener('keydown', e => { if (!started && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go() } })
}

addEventListener('keydown', e => {
  if (!started) return
  const k = e.key.toLowerCase()
  if (k === ' ') { e.preventDefault(); togglePause() }
  else if (k === 'arrowright') seek(now() + 5)
  else if (k === 'arrowleft') seek(now() - 5)
  else if (k === 'home' || k === 'r') { seek(0); if (!AU.playing) togglePause() }
  else if (k === 'f') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() }
  else if (k === 's') showSub = !showSub
  else if (k === 'e') { showEn = !showEn; $('sub-en').classList.toggle('hide', !showEn) }
  else if (k === 'm') { AU.muted = !AU.muted; AU.master.gain.setTargetAtTime(AU.muted ? 0 : .9, AU.ctx.currentTime, .05) }
  else if (/^[0-9]$/.test(k)) { const c = TL.chapters[k === '0' ? 10 : +k]; if (c) seek(c.t) }
})
$('progress').onclick = e => { const r = $('progress').getBoundingClientRect(); seek((e.clientX - r.left) / r.width * TL.total) }
let mouseT; addEventListener('mousemove', () => { document.body.classList.add('mouse'); clearTimeout(mouseT); mouseT = setTimeout(() => document.body.classList.remove('mouse'), 1500) })

// ?t=秒 ：静帧预览（不放声音），用于检查画面
if (stillT !== null) {
  $('start').style.display = 'none'
  for (let i = 0; i < 12; i++) render(ctx, stillT, cv, bloom)
  subs(stillT); hud(stillT)
  document.title = 'READY'
} else { boot(); loop() }
