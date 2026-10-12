# 宣传片台词列表

> 由 script.json 生成。「朗读稿」列是 TTS 实际念的文本（有 say 字段时用 say，否则用中文字幕）；改台词请改 script.json。
> 主线案例：xxx模型发布，口碑到底怎么样（虚构）。亲手操作一章：照着 release/v2.4 文件夹里的资料，填三家应用市场的上架表单（虚构）。


## 开场：痛点 → 亮出产品

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 1 | p1 | 你让 AI 帮你查查：昨晚发布的 xxx模型，大家都怎么评价。 | 你让 AI 帮你查查，昨晚发布的叉叉叉模型，大家都怎么评价。 | You ask your AI: what are people saying about the xxx model that launched last night? |
| 2 | p2 | 它去 X，要登录。去知乎，弹验证码。Reddit，直接 403。 | 它去 X，要登录。去知乎，弹验证码。Reddit，直接四零三。 | X wants a login. Zhihu throws a CAPTCHA. Reddit: straight 403. |
| 3 | p3 | 好不容易打开一页，几十万字符的 HTML 灌进来，上下文当场爆掉。 | 同左 | When a page finally opens, hundreds of thousands of characters of HTML pour in — and the context blows up. |
| 4 | p4 | 最后它只能说：“抱歉，我无法访问这些网站。” | 最后它只能说，抱歉，我无法访问这些网站。 | In the end, all it can say is: "Sorry, I can't access these sites." |
| 5 | p5 | 可这些网站，你的浏览器里，全都登录着。 | 同左 | Yet your own browser is logged in to every one of them. |
| 6 | logo1 | BrowserX —— 让 AI agent 借你的浏览器上网。 | BrowserX。让 AI agent，借你的浏览器上网。 | BrowserX — let your AI agent browse the web through your own browser. |

## 同一句话，再问一次（只给结果）

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 7 | h1 | 同一句话，再问一次。这回，它借你的浏览器，同时打开六个网站。 | 同左 | Same question, one more time. Now it borrows your browser and opens six sites at once. |
| 8 | h2 | 交回来一份报告：哪里在夸，哪里在骂，跑分和实测哪里对不上。每一条，都带出处。 | 同左 | Back comes a report: who's praising, who's complaining, where benchmarks and real use disagree. Every point cited. |
| 9 | m1 | 技术排查、新闻舆情、股票异动，也都是一句话的事。 | 同左 | Tech triage, public opinion, stock moves — each just one sentence away. |

## 原理：跟着一条命令走一遍

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 10 | a1 | BrowserX 的办法很直接：不另起一个浏览器，借你平时用的那个。 | 同左 | BrowserX's answer is simple: don't spin up another browser — borrow the one you already use. |
| 11 | a2 | 比如 AI 想读一条知乎回答，只要敲一条 bx 命令。 | 同左 | Say the AI wants to read a Zhihu answer. It just types one bx command. |
| 12 | a3 | 命令交给后台常驻的 daemon，它通过浏览器插件，在你的浏览器里开个标签。 | 命令交给后台常驻的 daemon，它通过浏览器插件，在你的浏览器里，开个标签。 | The command goes to a background daemon, which — through a browser extension — opens a tab in your browser. |
| 13 | a4 | 几十万字符的页面，变成几行精简的文字，回到 AI 手里。 | 同左 | A page of hundreds of thousands of characters comes back to the AI as a few compact lines. |
| 14 | a5 | 登录用的是你的，所以对网站来说，来的就是你本人。 | 同左 | It's your login — so to the website, it's simply you. |

## bx read

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 15 | r1 | 先看最常用的 bx read：一个网页，讲了什么。 | 先看最常用的，bx read。一个网页，讲了什么。 | Start with the everyday tool, bx read: what is this page about? |
| 16 | r2 | 一个 B 站视频页，原始 HTML 有二十三万字符。 | 同左 | A Bilibili video page: 230,000 characters of raw HTML. |
| 17 | r3 | read 之后，只剩两千字，该有的一样不少。 | 同左 | After read: about 2,000. Everything that matters is still there. |
| 18 | r4 | 标题、作者、播放数据，评论有多少条、怎么展开，一眼就清楚。 | 同左 | Title, author, stats, how many comments and how to expand them — all at a glance. |
| 19 | r5 | 长文章只关心几件事？加上 grep，只取命中的段落， | 长文章只关心几件事？加上 grep，只取命中的段落。 | Only care about a few things in a long article? Add --grep to keep just the matching passages, |
| 20 | r6 | 还标出它在全文的位置，想接着读，用 offset 跳过去就行。 | 同左 | each tagged with its position, so --offset can pick up right there. |
| 21 | r7 | 最妙的是结尾：读完页面，它还告诉 AI，这个网站有哪些现成的函数。 | 同左 | And the best part is at the end: it tells the AI which ready-made functions this site has. |

## 站点函数库

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 22 | l1 | 每个网站的常用功能，都存成一个普通的 JS 文件。 | 每个网站的常用功能，都存成一个普通的 JavaScript 文件。 | Each site's common features live in a plain JS file. |
| 23 | l2 | 函数签名就是说明书；注释里的例子，lib test 会真的跑一遍。 | 函数签名就是说明书。注释里的例子，lib test 会真的跑一遍。 | The signature is the manual; lib test actually runs the examples in the comments. |
| 24 | l3 | 接口怎么调、哪里有坑，写进站点笔记，踩过一次就不用再踩。 | 同左 | How the API works and where the traps are go into site notes — step on a trap once, never again. |
| 25 | l4 | 内置五十个网站：搜索、学术、社区、视频、新闻、金融，开箱即用。 | 同左 | 50 sites built in — search, research, forums, video, news, finance — ready out of the box. |

## 亲手操作：照着资料填三家应用市场的表单 → trace → 脚本

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 26 | f0 | 有些活没有接口，只能一页页去填。比如新版本上架：三家应用市场，三套不一样的表单。 | 同左 | Some jobs have no API — just forms. Like shipping a new version: three app stores, three different forms. |
| 27 | f1 | 要填的资料散在文件夹里：版本号、更新说明、软著编号、隐私政策，还有一堆截图。 | 同左 | The details are scattered across a folder: version, release notes, copyright number, privacy policy, and a pile of screenshots. |
| 28 | f2 | AI 先把文件读一遍，再用 bx tab list，找到你开着的三个后台。 | 同左 | The AI reads the files, then uses bx tab list to find the three consoles you have open. |
| 29 | f3 | bx snapshot 看一眼页面：每个输入框都带编号，哪些必填，一目了然。 | 同左 | One bx snapshot: every field gets a number, and the required ones are obvious. |
| 30 | f4 | 一条 fill 填完一整页，截图用 upload 直接传上去。 | 同左 | One fill completes the whole page; upload sends the screenshots straight in. |
| 31 | f5 | 按名字点“提交审核”？页面上有两个。它不瞎猜，把候选列出来。 | 按名字点提交审核？页面上有两个。它不瞎猜，把候选列出来。 | Click "Submit for review" by name? There are two. It won't guess — it lists the candidates. |
| 32 | f6 | 换成编号点，返回值直接告诉它：弹了确认框，页面也跳走了。 | 同左 | Click by number, and the result says it all: a confirm dialog popped, and the page moved on. |
| 33 | f7 | 第二家是三步向导。点完“下一步”，旧编号就作废，它会提醒 AI 重新看一眼。 | 第二家是三步向导。点完下一步，旧编号就作废，它会提醒 AI 重新看一眼。 | Store two is a three-step wizard. After "Next", old numbers expire — and it tells the AI to look again. |
| 34 | f8 | 每个错误都带错误码和下一步该怎么做。这些输出，都是写给 AI 看的。 | 同左 | Every error carries a code and the next step. All of this output is written for an AI to read. |
| 35 | f9 | 整个过程，trace 都录了下来：点了哪、填了什么、最后提交给了哪个接口。 | 同左 | trace records the whole run: what was clicked, what was filled, and which API it was finally submitted to. |
| 36 | f10 | AI 照着录制写成脚本。下次发版，一条命令，三家一起填完。 | 同左 | The AI turns the recording into a script. Next release: one command, all three stores done. |

## 组合：管道 + bx run

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 37 | c1 | 函数和函数之间，可以用管道拼起来。 | 同左 | Functions snap together with pipes. |
| 38 | c2 | B 站搜到的视频一行一条，流进下一个函数，评论就出来了。 | 同左 | Bilibili search results flow line by line into the next function — and out come the comments. |
| 39 | c3 | 再往上一层，用 bx run 写几行 JS，把好几个网站自由组合。 | 再往上一层，用 bx run 写几行 JavaScript，把好几个网站自由组合。 | One level up, a few lines of JS in bx run combine as many sites as you like. |

## 跨站调研：把开头那件事慢放一遍

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 40 | x1 | 回到开头那个问题，看看 AI 是怎么一步步查清楚的。 | 同左 | Back to the opening question — let's watch how the AI works it out, step by step. |
| 41 | x2 | 第一步，广撒网：六个网站同时搜，结果规整成同一种格式。 | 第一步，广撒网。六个网站同时搜，结果规整成同一种格式。 | Step one, cast a wide net: six sites searched at once, results normalized into one format. |
| 42 | x3 | B 站搜到的，不少是上一代模型的旧视频，AI 看一眼标题就跳过。 | 同左 | Many Bilibili hits are old videos about the previous model — the AI skips them by title. |
| 43 | x4 | 第二步，深挖讨论。说法正好相反：有人说吊打一切，有人说是在刷榜。 | 第二步，深挖讨论。说法正好相反：有人说吊打一切，有人说，是在刷榜。 | Step two, dig into the threads. They contradict each other: 'it crushes everything' versus 'it's gaming the benchmarks'. |
| 44 | x5 | 第三步，查一手资料：官方技术报告、公开榜单，还有网友的独立复测。 | 第三步，查一手资料。官方技术报告、公开榜单，还有网友的独立复测。 | Step three, primary sources: the official technical report, public leaderboards, and an independent re-test. |
| 45 | x6 | 最后写出报告：矛盾的说法摆在一起，每一条都带出处。 | 同左 | Finally, write it up: conflicting claims side by side, every point cited. |
| 46 | x7 | 中间结果都写进文件，哪一步都能单独重跑，上下文也不会被撑爆。 | 同左 | Intermediate results go to files — rerun any step, and the context never overflows. |

## 越用越熟

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 47 | t3 | 摸通的网站存成函数，做过的流程存成脚本。用得越多，它就越熟悉这个互联网。 | 同左 | Sites it figures out become functions; jobs it has done become scripts. The more you use it, the better it knows the web. |

## 结尾

| # | id | 中文字幕 | 朗读稿 | English |
|---|---|---|---|---|
| 48 | o1 | BrowserX —— 给 AI 一双能上网的手。 | BrowserX。给 AI，一双能上网的手。 | BrowserX — give your AI hands for the web. |

共 48 句。
