# BrowserX 宣传片（HTML 版）

双击 `index.html` 用 Chrome / Edge 打开就能播放，不用起服务器。想发给别人就用 `index-single.html`（CSS / JS / 旁白全打包在一个文件里，约 3.4 MB）。1920×1080，全长约 4 分 30 秒。

结构：

1. **痛点开场**：让 AI 查「昨晚发布的 xxx模型口碑怎么样」，它在 X、知乎、Reddit 处处碰壁，上下文被 HTML 撑爆，最后只能说“无法访问”。可这些网站你的浏览器全都登录着 → Logo。
2. **再问一次**：同一句话，借你的浏览器查 6 个网站，只给结果（带出处的报告）；再切换显示技术排查 / 新闻舆情 / 股票异动三个例子。
3. 原理 → bx read → 函数库。
4. **亲手操作**：照着 `release/v2.4` 文件夹里的资料，填三家应用市场的上架表单（tab list → snapshot → fill / upload → 同名候选 → changes → 向导跳转后编号作废），全程 trace 录下来，AI 写成 `publish.js`，下次发版一条命令。
5. 管道 + bx run → 把第 2 段的调研慢放一遍 → 越用越熟 → 结尾。

xxx模型、三家应用市场、蒙太奇里的例子都是虚构的；bx 的输出格式（snapshot、AMBIGUOUS、changes、STALE_REF、trace 报告）照真实运行的样子写。

## 快捷键

| 键 | 作用 |
|---|---|
| Enter / 点击 | 开始 |
| 空格 | 暂停 / 继续 |
| ← → | 快退 / 快进 5 秒 |
| 1–9、0 | 跳到第 1–10 章 |
| R | 从头重播 |
| F | 全屏 |
| S / E | 开关字幕 / 开关英文字幕 |
| M | 静音 |

底部进度条可以点击跳转。`index.html?t=120` 显示第 120 秒的静帧（没有声音，检查画面用）。

## 目录

```
index.html  css/style.css
js/engine.js   时间轴、镜头、面板树、终端渲染（文字离屏缓存）、ASCII 光栅化、辉光 / 故障后期
js/vo.js       旁白音频（base64 内嵌，tts/gen.py 生成）
js/data.js     画面里的终端输出和案例内容（B 站 read / grep / 函数库是真实输出，其余是虚构案例）
js/audio.js    旁白调度、合成 BGM（步进音序器）、音效；画面时钟 tlVis()（平滑过的音频时钟）
js/scenes.js   分镜：11 个章节，时间轴以旁白时长为骨架
js/main.js     主循环、字幕、进度条、快捷键
tts/           旁白脚本 script.json + 生成脚本 gen.py（本地 audio.cpp · Fish Audio S2 Pro，克隆 manbo_ref.wav）
build_single.ps1  把上面这些打成单文件 index-single.html（改完源文件重跑一次）
shot.ps1       用 bx 截静帧：.\shot.ps1 -times "12,30.5" -tab t23（标签先开好 index.html）
```

## 改旁白

改 `tts/script.json`（`zh` 是字幕，`say` 是实际朗读的文字，`en` 是英文字幕），然后：

```bash
cd tts
python gen.py
```

依赖 `V:\software\AI\audio-cpp`（Fish S2 Pro 模型 + manbo_ref.wav）和 PATH 里的 ffmpeg。试音色用 `tts/try_fish.py`，输出到 `tts/out_try/`。

只会重新生成改过的句子。画面时间轴跟着旁白时长自动调整。
