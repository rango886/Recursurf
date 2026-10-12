// ============ 音频：旁白 + 合成 BGM + 音效（全部按时间轴调度，可暂停 / 跳转） ============
const AU = {
  ctx: null, buf: {}, live: new Set(), voDone: new Set(), sfxIdx: 0, step: 0, noise: null,
  t0: 0, base: 0, playing: false, muted: false,
}
function auInit() {
  const ctx = AU.ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4
  AU.master = ctx.createGain(); AU.master.gain.value = .9
  AU.master.connect(comp); comp.connect(ctx.destination)
  AU.music = ctx.createGain(); AU.music.gain.value = .0; AU.music.connect(AU.master)
  AU.vo = ctx.createGain(); AU.vo.gain.value = 1.15; AU.vo.connect(AU.master)
  AU.fx = ctx.createGain(); AU.fx.gain.value = .45; AU.fx.connect(AU.master)
  // 琶音的回声
  AU.delay = ctx.createDelay(1); AU.delay.delayTime.value = 60 / BPM * .75
  const fb = ctx.createGain(); fb.gain.value = .38
  const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2500
  AU.delay.connect(dl); dl.connect(fb); fb.connect(AU.delay); dl.connect(AU.music)
  // 白噪声
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  AU.noise = nb
}
async function auLoad(onProgress) {
  const ids = Object.keys(VO); let n = 0
  await Promise.all(ids.map(async id => {
    const b64 = VO[id].src.split(',')[1], bin = atob(b64), arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    AU.buf[id] = await AU.ctx.decodeAudioData(arr.buffer)
    onProgress && onProgress(++n / ids.length)
  }))
}
// 时间轴时间 ↔ 音频时间（调度声音用 currentTime）
const tlNow = () => AU.playing ? AU.base + (AU.ctx.currentTime - AU.t0) : AU.base
const atime = t => AU.t0 + (t - AU.base)
// 画面用的时钟：currentTime 是按音频缓冲一块一块跳的（Windows 上 10~20ms 一跳且不均匀），
// 直接拿来驱动动画会一顿一顿。这里用 getOutputTimestamp + performance.now() 插值，再做平滑和单调保护。
const VCLK = { v: 0, p: 0, on: false }
function tlVis() {
  if (!AU.playing) { VCLK.on = false; return AU.base }
  const c = AU.ctx, pn = performance.now()
  let ct = c.currentTime
  if (c.getOutputTimestamp) {
    const ts = c.getOutputTimestamp()
    if (ts.contextTime > 0 && ts.performanceTime > 0) ct = ts.contextTime + (pn - ts.performanceTime) / 1000
  }
  const raw = AU.base + (ct - AU.t0)
  if (!VCLK.on) { VCLK.on = true; VCLK.v = raw; VCLK.p = pn; return raw }
  const pred = VCLK.v + (pn - VCLK.p) / 1000, err = raw - pred
  VCLK.v = Math.abs(err) > .12 ? raw : Math.max(VCLK.v, pred + err * .08)
  VCLK.p = pn
  return VCLK.v
}
function auPlay(from) {
  auStopAll()
  AU.base = from; AU.t0 = AU.ctx.currentTime + .05; AU.playing = true; VCLK.on = false
  AU.voDone.clear()
  AU.sfxIdx = TL.sfx.findIndex(s => s.t >= from); if (AU.sfxIdx < 0) AU.sfxIdx = TL.sfx.length
  AU.step = Math.ceil(from / STEP)
  // 正在进行中的旁白：从中间接着播
  for (const c of TL.cues) if (from > c.t && from < c.t + c.dur) { voStart(c, from - c.t); AU.voDone.add(c.id) }
}
function auPause() { AU.base = tlNow(); AU.playing = false; auStopAll() }
function auStopAll() { for (const n of AU.live) { try { n.stop() } catch (e) { } } AU.live.clear() }
function track(n, end) { AU.live.add(n); n.onended = () => AU.live.delete(n) }

function voStart(c, offset = 0) {
  const src = AU.ctx.createBufferSource(); src.buffer = AU.buf[c.id]; src.connect(AU.vo)
  const when = Math.max(AU.ctx.currentTime, atime(c.t + offset))
  src.start(when, offset); track(src)
}
// 每帧调用：提前 0.25 秒排好接下来的声音
function auTick() {
  if (!AU.playing) return
  const now = tlNow(), ahead = now + .25
  for (const c of TL.cues) if (!AU.voDone.has(c.id) && c.t >= now - .02 && c.t < ahead) { voStart(c); AU.voDone.add(c.id) }
  while (AU.sfxIdx < TL.sfx.length && TL.sfx[AU.sfxIdx].t < ahead) {
    const s = TL.sfx[AU.sfxIdx++]
    if (s.t >= now - .05) SFX[s.name] && SFX[s.name](atime(s.t), s.o)
  }
  while (AU.step * STEP < ahead) { musicStep(AU.step, atime(AU.step * STEP)); AU.step++ }
  // 有旁白时压低音乐
  const speaking = TL.cues.some(c => now > c.t - .15 && now < c.t + c.dur + .1)
  const target = (AU.muted ? 0 : 1) * musicLevel(now) * (speaking ? .32 : 1)
  AU.music.gain.setTargetAtTime(target * .5, AU.ctx.currentTime, .12)
}

// ============ 音色 ============
function env(g, t, a, peak, d, sus = 0, r = .05) {
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(Math.max(sus, .0001), t + a + d)
}
function osc(type, f, t, dur, out, vol = .2, o = {}) {
  const c = AU.ctx, s = c.createOscillator(), g = c.createGain()
  s.type = type; s.frequency.setValueAtTime(f, t)
  if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur))
  if (o.detune) s.detune.value = o.detune
  env(g, t, o.a || .005, vol, dur)
  let node = s
  if (o.lp) { const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.setValueAtTime(o.lp, t); if (o.lpTo) f2.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); f2.Q.value = o.q || 1; node.connect(f2); node = f2 }
  node.connect(g); g.connect(out)
  s.start(t); s.stop(t + dur + .1); track(s)
  return g
}
function noise(t, dur, out, vol = .2, o = {}) {
  const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter()
  s.buffer = AU.noise; s.loop = true
  f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 3000, t); f.Q.value = o.q || 1
  if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur)
  if (o.swell) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * o.swell); g.gain.exponentialRampToValueAtTime(.0001, t + dur) }
  else env(g, t, o.a || .002, vol, dur)
  s.connect(f); f.connect(g); g.connect(out)
  s.start(t, Math.random()); s.stop(t + dur + .05); track(s)
}
const SFX = {
  key: (t, o) => { noise(t, .025, AU.fx, .22 * (o.v || 1), { f: 2500 + Math.random() * 2500, q: 3 }); osc('square', 140 + Math.random() * 40, t, .012, AU.fx, .03) },
  enter: t => { noise(t, .05, AU.fx, .35, { f: 1500, q: 2 }); osc('square', 880, t + .01, .05, AU.fx, .05) },
  blip: (t, o) => osc('sine', o.f || 1400, t, .06, AU.fx, .12 * (o.v || 1)),
  ding: t => { osc('triangle', 1320, t, .5, AU.fx, .14); osc('triangle', 1980, t + .06, .6, AU.fx, .09) },
  stream: (t, o) => { const d = Math.max(.15, Math.min(o.dur || .5, 4)); for (let x = 0; x < d; x += .035) osc('square', 600 + Math.random() * 1800, t + x, .015, AU.fx, .025 * (o.v || 1)) },
  whoosh: (t, o) => noise(t, o.dur || .9, AU.fx, .5 * (o.v || 1), { f: o.up === false ? 3000 : 250, fTo: o.up === false ? 250 : 3500, q: .8, swell: .6 }),
  boom: t => { osc('sine', 90, t, 1.6, AU.fx, .9, { to: 28, glide: 1.2 }); noise(t, .9, AU.fx, .5, { type: 'lowpass', f: 900, fTo: 60 }); osc('sawtooth', 55, t, 1.2, AU.fx, .15, { lp: 400, lpTo: 60 }) },
  hit: t => { osc('sine', 160, t, .4, AU.fx, .6, { to: 40, glide: .3 }); noise(t, .2, AU.fx, .3, { f: 2000 }) },
  glitch: (t, o) => { const d = o.dur || .3; for (let x = 0; x < d; x += .03) osc('square', 80 + Math.random() * 1500, t + x, .03, AU.fx, .06); noise(t, d, AU.fx, .2, { f: 5000, q: .5 }) },
  error: t => { osc('sawtooth', 110, t, .28, AU.fx, .2, { lp: 1200 }); osc('sawtooth', 117, t, .28, AU.fx, .2, { lp: 1200 }) },
  riser: (t, o) => { const d = o.dur || 2; noise(t, d, AU.fx, .35, { f: 300, fTo: 8000, q: 1.5, swell: .95 }); osc('sawtooth', 110, t, d, AU.fx, .06, { to: 880, glide: d, lp: 3000, a: d * .8 }) },
  power: t => { osc('sine', 40, t, 1.2, AU.fx, .4, { to: 1800, glide: .5 }); noise(t, .6, AU.fx, .2, { f: 6000 }); osc('sawtooth', 50, t + .3, 2.5, AU.fx, .04, { lp: 200 }) },
  off: t => { osc('sine', 1800, t, .5, AU.fx, .35, { to: 30, glide: .4 }); noise(t, .3, AU.fx, .2, { f: 4000, fTo: 200 }) },
  clack: t => { noise(t, .06, AU.fx, .5, { f: 900, q: 4 }); osc('square', 220, t, .04, AU.fx, .08) },
  pop: (t, o) => osc('sine', o.f || 600, t, .12, AU.fx, .2, { to: (o.f || 600) * 2, glide: .08 }),
}

// ============ BGM：步进音序器 ============
const BPM = 112, STEP = 60 / BPM / 4      // 十六分音符
// 和弦（每小节一个）：Am F C G / Dm F Am E
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [50, 53, 57], [53, 57, 60], [57, 60, 64], [52, 56, 59]]
const mtof = m => 440 * Math.pow(2, (m - 69) / 12)
// 各段落的配器强度：由场景脚本设置 MUSIC = [{t, lv}]
let MUSIC = [{ t: 0, lv: 0 }]
function musicAt(t) { let s = MUSIC[0]; for (const m of MUSIC) if (m.t <= t) s = m; return s }
function musicLevel(t) { return musicAt(t).vol ?? 1 }
function musicStep(i, when) {
  const sec = musicAt(i * STEP), lv = sec.lv
  if (lv <= 0 || AU.muted) return
  const bar = Math.floor(i / 16), s = i % 16, ch = PROG[bar % PROG.length]
  const out = AU.music
  // 铺底（lv>=1）
  if (s === 0) for (const n of ch) for (const det of [-8, 8]) osc('sawtooth', mtof(n), when, STEP * 16, out, .028, { a: .4, detune: det, lp: lv >= 3 ? 1800 : 900, q: 2 })
  if (lv >= 2) {     // 贝斯：八分音符
    if (s % 2 === 0) { const n = ch[0] - 24 + (s % 8 === 6 ? 12 : 0); osc('sawtooth', mtof(n), when, STEP * 1.6, out, .16, { lp: 700, lpTo: 180, q: 6 }) }
    if (s % 4 === 2) noise(when, .03, out, .05, { type: 'highpass', f: 8000 })      // 闭镲
  }
  if (lv >= 3) {     // 鼓
    if (s % 4 === 0) { osc('sine', 150, when, .35, out, .75, { to: 42, glide: .12 }) }
    if (s === 4 || s === 12) { noise(when, .18, out, .28, { f: 1800, q: .7 }); osc('triangle', 190, when, .1, out, .12) }
    if (s % 2 === 1) noise(when, .02, out, .035, { type: 'highpass', f: 9000 })
    // 琶音（进回声）
    const arp = [0, 1, 2, 1, 0, 2, 1, 2][s % 8], n = ch[arp] + 12 + (s >= 8 ? 12 : 0)
    osc('square', mtof(n), when, STEP * .8, AU.delay, .035, { lp: 3200 })
    osc('square', mtof(n), when, STEP * .8, out, .03, { lp: 3200 })
  }
  if (lv >= 4) {     // 高潮：主旋律
    const MEL = [12, null, 7, null, 12, 14, 15, null, 14, null, 12, null, 7, null, 10, null]
    const m = MEL[s]
    if (m !== null) osc('sawtooth', mtof(ch[0] + m + (bar % 2 ? 12 : 0)), when, STEP * 1.8, out, .05, { lp: 2600, a: .01 })
    if (s % 4 === 2) noise(when, .08, out, .05, { type: 'highpass', f: 6000 })   // 开镲
  }
}
