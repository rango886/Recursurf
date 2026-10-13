// 素材：rsf read / grep / 函数库 / 表单操作的输出格式来自真实运行的 rsf；xxx模型、应用市场等案例内容是虚构的
// 标记语法：«颜色:文字»   颜色 g绿 G亮绿 a琥珀 c青 r红 w白 d暗 y黄 m品红
window.D = {}

D.biliCmd = 'rsf read https://www.bilibili.com/video/BV1GJ411x7h7 -b'
D.biliOut = [
  '«w:# 【官方 MV】Never Gonna Give You Up - Rick Astley»',
  '«c:https://www.bilibili.com/video/BV1GJ411x7h7/»',
  '«d:type: video · via: »«a:lib:bilibili.com»«d: · author: 索尼音乐中国 · published: 2019-12-31 23:43»',
  '',
  'video:',
  '  bvid: BV1GJ411x7h7',
  '  duration: 3:33',
  '  up: 索尼音乐中国 (mid 486906719)',
  '  stat: 播放 107145243 · 点赞 2951744 · 投币 1282325 · 收藏 1552657 · 评论 237317',
  '  tags: Never Gonna Give You Up / Rick Astley / 流行音乐 / 欧美音乐 / MV',
  '',
  '«y:分段（rsf read --section <id>）：»',
  '  - «G:comments»: 评论（237317 条，按热度）«d:（按需加载）»',
  '  - «G:related»: 相关推荐（40 个）',
  '',
  '«a:这个网站有函数库 bilibili.com»«d:（rsf call bilibili.com <函数> [参数]；详细用法 rsf lib list bilibili.com）：»',
  '  «G:search»(keyword, { limit = 20, type = \'video\', order = \'totalrank\' } = {})  «d:— 搜索视频»',
  '  «G:rank»(category = \'全部\', { limit = 100 } = {})  «d:— 热门排行榜（按分区）»',
  '  «G:video»(id)  «d:— 视频详细信息（播放、点赞、分P、简介…）»',
  '  «G:comments»(id, { limit = 50, sort = \'hot\' } = {})  «d:— 视频评论。sort：hot 热门 / time 最新»',
  '  «G:download»(id, { out = \'.\', quality = \'1080\' } = {})  «d:— 下载视频（有 ffmpeg 时自动合并）»',
  '  «G:user»(mid)  «d:— UP 主信息»',
  '  «G:subtitles»(id, { lang = \'\', text = false } = {})  «d:— 视频字幕，按时间一句一行»',
  '  «G:summary»(id)  «d:— B 站官方的 AI 视频总结：摘要 + 带时间点的提纲»',
  '  «G:hot»({ limit = 20 } = {})  «d:— 综合热门»',
  '  «d:… 共 17 个函数»',
]

D.htmlSoup = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="spm_prefix" content="333.788"><script>window.__INITIAL_STATE__={"aid":80433022,"bvid":"BV1GJ411x7h7","p":1,"episode":"","videoData":{"bvid":"BV1GJ411x7h7","aid":80433022,"videos":1,"tid":193,"tname":"MV","copyright":1,"pic":"http://i0.hdslb.com/bfs/archive/...","title":"【官方 MV】Never Gonna Give You Up - Rick Astley","pubdate":1577807020,"ctime":1577807020,"desc":"","state":0,"duration":213,"rights":{"bp":0,"elec":0,"download":1,"movie":0,"pay":0,"hd5":1,"no_reprint":1,"autoplay":1}}</script><link rel="stylesheet" href="//s1.hdslb.com/bfs/static/jinkela/video/css/video.0.d6d5a4d.css"><div id="app"><div class="video-container-v1"><div class="left-container scroll-sticky"><div class="video-info-container"><h1 title="【官方 MV】Never Gonna Give You Up" class="video-title special-text-indent" data-title="..." data-v-4f1c0915><div class="video-info-detail-list"><div class="item"><svg class="view-icon" viewBox="0 0 24 24" width="24" height="24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" fill="currentColor"></path></svg><span class="view-text">10714.5万</span></div><div class="bili-video-card__wrap __scale-wrap"><a href="//www.bilibili.com/video/BV1xx411c7mD" target="_blank" data-spmid="333.788" data-mod="related"><div class="bili-video-card__image--wrap"><picture class="v-img bili-video-card__cover"><source srcset="//i1.hdslb.com/bfs/archive/a1b2.jpg@672w_378h_1c_!web-video-rcmd-cover.avif" type="image/avif"><img src="//i1.hdslb.com/bfs/archive/a1b2.jpg@672w_378h_1c" loading="lazy"></picture></div></a></div><script type="text/javascript">!function(){var e=document.createElement("script");e.src="//s1.hdslb.com/bfs/seed/log/report/log-reporter.js";document.head.appendChild(e)}();</script>`

D.grepCmd = "rsf read https://36kr.com/p/2961530218 --grep '思考模式|测试集' -C 0"
D.grepOut = [
  '«w:# 万字解读 xxx模型 技术报告：跑分之外的五个细节»',
  '«c:https://36kr.com/p/2961530218»',
  '«d:type: article · via: readability · author: 硅基观察»',
  '',
  '«y:grep: 思考模式|测试集 · 命中 7 处，分 4 块 · 共 18342 字»',
  '«d:（〔@数字〕是这一块在全文里的位置，rsf read --offset 数字 从那里接着读）»',
  '',
  '«a:〔@1260〕» 报告开篇给出的综合成绩，脚注里写明：所有分数都是在«r:思考模式»下测得的。',
  '«d:⋯»',
  '«a:〔@6831〕» 关闭«r:思考模式»以后，代码类任务平均下降 17 个百分点，数学类下降更明显，',
  '          而中文写作、摘要类任务几乎没有变化。',
  '«d:⋯»',
  '«a:〔@9475〕» 3.2 «w:数据污染检查»：团队把训练语料和公开«r:测试集»逐条比对，',
  '          整体重合率 3.1%，去掉重合的题目以后，综合排名不变。',
  '«d:⋯»',
  '«a:〔@14102〕» 附录 C 逐项列出了每个«r:测试集»的重合比例，其中两个代码«r:测试集»超过 8%，',
  '           这也是社区质疑“刷榜”的主要依据。',
]
D.libCode = [
  '«d:/* 站点笔记（B 站）：评论接口的 oid 要用 aid，不是 bvid … */»',
  '',
  '«d:/** 视频评论。sort：hot 热门 / time 最新»',
  '«d: *  »«a:@example»«d: comments(\'BV1GJ411x7h7\', { limit: 20 }) */»',
  '«m:export async function» «G:comments»«w:(id, { »«y:limit = 50»«w:, »«y:sort = \'hot\'»«w: } = {})» {',
  '  «m:const» v = parseVideo(id)',
  '  «m:const» aid = v.aid || («m:await» view(v)).aid',
  '  «m:const» out = []',
  '  «m:let» offset = «y:\'\'»',
  '  «m:for» («m:let» i = 0; i < 100 && out.length < limit; i++) {',
  '    «m:const» d = «m:await» api(«y:\'x/v2/reply/wbi/main\'», { oid: aid, mode: sort === «y:\'time\'» ? 2 : 3 }, { sign: «c:true» })',
  '    «m:for» («m:const» r «m:of» d.replies || []) {',
  '      out.push({ user: r.member.uname, text: r.content.message, like: r.like, time: time(r.ctime) })',
  '      «m:if» (out.length >= limit) «m:break»',
  '    }',
  '    offset = d.cursor?.pagination_reply?.next_offset',
  '    «m:if» (!offset || d.cursor?.is_end) «m:break»',
  '    «m:await» rsf.sleep(300)   «d:// 翻页之间停 300ms，不然会被风控»',
  '  }',
  '  «m:return» out',
  '}',
]

D.siteNotes = [
  '«a:bilibili.com»  «d:登录更好 — 不登录时评论只给前几条、下载画质最高 480P»',
  '',
  '«y:站点笔记（B 站）：»',
  '- 在已登录的 B 站标签里直接调 B 站自己的接口（tab.fetch 带着登录状态）',
  '- 路径里带 /wbi/ 的接口要签名，见 _bili-wbi.js（密钥 10 分钟缓存）',
  '- «w:评论接口的 oid 要用 aid，不是 bvid»：先用 x/web-interface/view 换一下',
  '- code «r:-101» 没登录；«r:-352 / -412 / -799» 是风控，翻页之间停 300ms 以上',
  '- 排行榜分区的 rid 是在页面上把每个分区点一遍、从网络记录里读出来的',
  '- AI 字幕要登录（need_login_subtitle）',
]

D.libTest = [
  '«G:$» rsf lib test bilibili.com comments',
  '«a:bilibili.com»',
  '  «G:✓» comments(\'BV1GJ411x7h7\', { limit: 20 })  «d:0.5s»  20 项，字段：bvid rpid user mid text like replies time',
  '«d:共 1 条：»«G:✓ 1»',
]

D.sites = {
  '搜索': ['google.com', 'bing.com', 'duckduckgo.com', 'baidu.com'],
  '学术 / AI': ['arxiv.org', 'semanticscholar.org', 'openreview.net', 'huggingface.co', 'aistudio.google.com'],
  '技术社区': ['news.ycombinator.com', 'reddit.com', 'github.com', 'stackoverflow.com', 'v2ex.com', 'linux.do', 'medium.com', 'x.com', 'lobste.rs', 'producthunt.com'],
  '视频': ['bilibili.com', 'youtube.com', 'douyin.com'],
  '中文资讯': ['weibo.com', 'zhihu.com', 'xiaohongshu.com', 'toutiao.com', 'weixin.qq.com', '36kr.com', 'gov.cn'],
  '外文新闻': ['reuters.com', 'bloomberg.com', 'bbc.com', 'substack.com', 'wikipedia.org', 'archive.org'],
  '金融': ['xueqiu.com', 'eastmoney.com', 'sina.com.cn', '10jqka.com.cn', 'tdx.com.cn', 'finance.yahoo.com', 'barchart.com', 'binance.com', 'coingecko.com', 'danjuanfunds.com'],
  '包和漏洞': ['npmjs.com', 'pypi.org', 'crates.io', 'nvd.nist.gov', 'osv.dev'],
}

// 按显示宽度补空格（中文占两格），拼表格用
const padW = (s, w) => s + ' '.repeat(Math.max(1, w - strW(s)))
const cutW = (s, w) => { let o = '', n = 0; for (const ch of s) { const k = isWide(ch) ? 2 : 1; if (n + k > w - 1) return o + '…'; o += ch; n += k } return o }


// =====================================================================
// 主线案例：xxx模型发布，口碑到底怎么样（虚构）
// =====================================================================
D.zPrompt = '昨晚发布的 xxx模型，大家都怎么评价？帮我查清楚，带上出处。'
D.zKeys = ['x', 'reddit', 'hn', 'zhihu', 'bilibili', 'v2ex']
// step1：6 个站并行搜，28 条（序号就是 research/posts.json 的下标）
D.zl = {
  x: { name: 'x.com', color: 'c', n: 6, items: [
    '0  @devlog_amy   xxx模型 实测：重构 2000 行老代码，一次跑通',
    '1  «y:@benchwatch   榜单第一？先看看测试集重合率再说»',
    '2  @mlnotes      官方报告第 14 页的脚注值得一读',
    '3  @indiehacker  API 价格只有上一代的一半',
    '4  @tinycoder    中文长文写作，终于不像机翻了',
    '5  @gpu_poor     本地跑不动，等量化版',
  ] },
  reddit: { name: 'reddit.com', color: 'r', n: 5, items: [
    '6  «y:r/LocalLLaMA   benchmarks look too good — contamination?»',
    '7  r/LocalLLaMA   Ran it on my own eval set, results inside',
    '8  r/singularity  xxx model is out. Thoughts?',
    '9  r/programming  A week of real work with xxx model',
    '10 r/ChatGPT      xxx model vs last gen, side by side',
  ] },
  hn: { name: 'news.ycombinator.com', color: 'a', n: 2, items: [
    '11 412分 268评  xxx model: technical report',
    '12 «y:96分  41评   Independent reproduction of xxx evals»',
  ] },
  zhihu: { name: 'zhihu.com', color: 'b', n: 4, items: [
    '13 «y:如何评价昨晚发布的 xxx模型？» 1.2 万关注',
    '14 xxx模型 真的吊打一切了吗？',
    '15 用 xxx模型 写了一周代码是什么体验？',
    '16 xxx模型 的中文写作能力怎么样？',
  ] },
  bilibili: { name: 'bilibili.com', color: 'm', n: 8, skip: [1, 2, 4, 5, 7], items: [
    '17 【实测】xxx模型 写代码到底行不行',
    '18 上一代模型深度评测（去年）',
    '19 上一代模型 vs 竞品，谁更强？',
    '20 xxx模型 发布会 10 分钟速览',
    '21 上一代模型 本地部署教程',
    '22 上一代模型 翻车合集',
    '23 xxx模型 中文写作横评',
    '24 上一代模型 一周使用体验',
  ] },
  v2ex: { name: 'v2ex.com', color: 'w', n: 3, items: [
    '25 xxx模型 API 已经能用了，速度挺快',
    '26 公司让评估 xxx模型，大家实际用下来如何？',
    '27 xxx模型 上下文到底能用多长？',
  ] },
}
D.zStatus = '来源：«c:x» 6；«r:reddit» 5；«a:hn» 2；«b:zhihu» 4；«m:bilibili» 8；«w:v2ex» 3 · 共 28 条 «d:(18.7s)»'
D.zPick = ['', '«m:◆» 按标题挑：',
  '«G:✓  1» [x] 榜单第一？先看看测试集重合率再说',
  '«G:✓  6» [reddit] benchmarks look too good — contamination?',
  '«G:✓ 13» [zhihu] 如何评价昨晚发布的 xxx模型？',
  '«d:18 19 21 22 24 [bilibili]» «r:✗ 上一代模型的旧视频，跳过»']
// step2：深挖。两派说法
D.zRed = [      // 刷榜派
  ['reddit · u/evalnerd', 'One benchmark jumped 15 points, fresh questions barely moved. Smells like contamination.'],
  ['x · @benchwatch', '榜单第一？测试集里有题跟训练数据重合，这分数得打个折。'],
  ['reddit · u/quietgpu', 'Default settings feel like last gen. The magic only shows up in thinking mode.'],
]
D.zGreen = [    // 吊打派
  ['zhihu · 高赞回答', '写了一周代码，复杂重构一次过，第一次敢把活整个交给模型。'],
  ['x · @devlog_amy', '2000 行老代码重构，一次跑通，测试全绿。'],
  ['zhihu · 2.3k 赞', '中文长文写作明显上了一个台阶，读起来不像机翻了。'],
]
D.zRedKey = 'reddit'
D.zDeep = ['reddit', 'zhihu', 'x']
D.zStep2 = ['«d:1 [x] 34 条回复 · 6 [reddit] 212 条 · 13 [zhihu] 86 个回答» «d:(2.4s)»']
// step3：一手资料
D.zSources = [
  ['技术报告 · arxiv.org', 'a', ['分数来自「深度思考」模式', '«a:附录 C：测试集重合 3.1%»', '«G:去重后仍是第一»']],
  ['公开榜单 · huggingface.co', 'c', ['综合榜   «G:第 1»', '代码榜   «a:第 3»', '中文写作 «G:第 1»']],
  ['独立复测 · hn', 'G', ['默认模式 vs 思考模式', '代码题 «a:61%» → «G:78%»', '«d:12 个任务 · 可复现»']],
]
D.zStep3 = [
  '«a:report»  arxiv：分数=深度思考模式 · 测试集重合 «a:3.1%»',
  '«c:board»   huggingface：综合 «G:#1» · 代码 «a:#3»',
  '«G:repro»   hn 复测：默认 «a:61%» · 思考模式 «G:78%» «d:(4.1s)»',
]
D.zReport = [
  '«w:## 结论：跑分没造假，但有前提»',
  '',
  '«G:✓» 榜单第一属实，官方分数用的是「深度思考」模式  «c:[技术报告]»',
  '«a:⚠» 默认模式下代码能力明显回落，和上一代接近    «c:[hn 复测]»',
  '«G:✓» 中文写作、长文总结，口碑一边倒地好          «c:[知乎 · B站]»',
  '«a:⚠» 说法矛盾：“吊打一切” vs “刷榜”',
  '«d:   → 一派开着思考模式，一派用的默认设置，都没说错»',
  '«a:⚠» 测试集重合 3.1%，去重后仍排第一             «c:[报告附录 C]»',
  '',
  '«d:6 个站 · 28 条 · 深挖 3 条 · 一手来源 3 个 → research/*.json»',
]
D.zConc = [
  '«G:✓» 榜单第一属实，但用的是「深度思考」模式   «c:[技术报告]»',
  '«a:⚠» 默认模式下代码能力回落，和上一代接近     «c:[hn 复测]»',
  '«G:✓» 中文写作、长文总结，口碑一边倒地好       «c:[知乎 · B站]»',
  '«a:⚠» “刷榜”质疑：部分题目和测试集重合 3.1%    «c:[报告附录]»',
]
D.zFiles = [['research/posts.json', '28 条搜索结果', 'step1'], ['research/threads.json', '3 个讨论 · 332 条回复', 'step2'], ['research/sources.json', '报告 · 榜单 · 复测', 'step3']]

// 开场蒙太奇：同一套做法，别的题目（虚构）
D.montage = [
  { tag: '技术排查', c: 'g', q: '部署突然全挂了，是云服务出事了吗？', sites: 'x · reddit · v2ex · 官方状态页', lines: [
    '«r:上游故障»  对象存储 14:02 起异常',
    '状态页 14:20 确认，预计 1 小时恢复',
    '«d:社区 46 条报告 · 最早 14:03»',
  ] },
  { tag: '新闻舆情', c: 'a', q: 'xx 手机昨晚发布，大家怎么看？', sites: '微博 · 知乎 · 小红书 · B站 · 头条', lines: [
    '«G:夸»  续航和影像，口碑一边倒',
    '«r:骂»  起售价涨了 500',
    '«c:热议»  发布会演示翻车片段',
    '«d:112 条 · 3.4 秒»',
  ] },
  { tag: '股票异动', c: 'r', q: 'xx 科技今天为什么涨停？', sites: '雪球 · 东方财富', lines: [
    'xx 科技 23.56  «r:+10.01%»',
    '主力净流入 «r:3.12 亿»（占 18.4%）',
    '消息：拿下 xxx模型 的算力订单',
  ] },
]

// 原理：rsf read 一条知乎回答
D.archCmd = 'rsf read zhihu.com/question/7203316845 -b'
D.archOut = [
  '«w:# 如何评价昨晚发布的 xxx模型？»',
  '«d:type: qa · 86 个回答 · 1.2 万关注»',
  '高赞 «w:2.3k»：写了一周代码，复杂重构',
  '一次过，第一次敢把活整个交给模型…',
  '«y:分段：»answers · «G:comments» · related',
  '«a:这个网站有函数库 zhihu.com：»',
  '  «G:search»  «G:question»  «G:answers» …',
]
D.archPage = [
  '«w:如何评价昨晚发布的 xxx模型？»',
  '«b:● 1.2 万关注»  «d:86 个回答 · 浏览 340 万»',
  '',
  '«d:匿名用户 · 2.3k 赞同»',
  '写了一周代码，复杂重构一次过，第一次敢把活整个交给模型。',
  '但默认模式和思考模式差别很大，跑分要看清是哪个模式……',
  '',
  '«d:阿杰 · 1.1k 赞同»',
  '中文长文写作明显上了一个台阶，读起来不像机翻了。',
]

// =====================================================================
// 亲手操作：照着文件夹里的资料，填三家应用市场的上架表单（虚构站点，输出格式来自真实运行的 rsf）
// =====================================================================
D.fPrompt = '拾光笔记 2.4.0 要上架三家应用市场，资料都在 release/v2.4，帮我填好提交。'
D.fFiles = [
  ['app.json', '版本号 2.4.0 · versionCode 240 · 分类 效率办公'],
  ['更新说明.md', '新增 AI 一键整理 · 桌面小组件 · 同步提速 40%'],
  ['资质信息.txt', '软著 2026SR0123456 · 浙ICP备2026000123号-2A'],
  ['隐私政策.md', 'https://shiguang.app/privacy'],
  ['截图/', '01.png  02.png  03.png  04.png  05.png'],
]
D.fRead = ['«a:⏵ bash» «w:cat release/v2.4/*.{json,md,txt}; ls release/v2.4/截图»', '«d:  … 版本 2.4.0 · 更新说明 4 条 · 软著号 · ICP 号 · 隐私政策链接 · 截图 5 张»']
D.fTabCmd = 'rsf tab list 应用'
D.fTabOut = [
  '«y:id    browser  title»',
  't192  vivaldi  发布新版本 - 星河应用市场开发者后台',
  't193  vivaldi  版本发布 - 青橙商店开放平台',
  't194  vivaldi  提交更新 - 蓝鲸应用中心',
]
D.fStores = [
  { label: '星河 · 发布新版本', url: 'dev.xinghe-store.com/apps/com.shiguang.notes/release', c: 'c' },
  { label: '青橙 · 版本发布', url: 'open.qingcheng.cn/app/release/step1', c: 'a' },
  { label: '蓝鲸 · 提交更新', url: 'developer.lanjing.com/apps/update', c: 'b' },
]
D.fSnapCmd = 'rsf snapshot -i -t t192'
D.fSnapOut = [
  '«w:# 发布新版本 - 星河应用市场开发者后台»',
  '- heading "发布新版本 提交审核" [level=1]',
  '  - button "提交审核" «a:[ref=e1]»',
  '- textbox "* 版本号" «a:[ref=e2]»',
  '- spinbutton "* 版本代码" «a:[ref=e3]»',
  '- textbox "* 更新说明" «a:[ref=e4]»',
  '- combobox "* 应用分类" «a:[ref=e5]»: 请选择 «d:{options: 效率办公 | 学习教育 | 实用工具}»',
  '- textbox "* 隐私政策链接" «a:[ref=e6]»',
  '- textbox "* 软件著作权登记号" «a:[ref=e7]»',
  '- button "* 应用截图（3–5 张）" «a:[ref=e8]»: 未选择任何文件',
  '- checkbox "应用内含广告" «a:[ref=e9]»',
  '- button "保存草稿" «a:[ref=e10]»',
  '- button "提交审核" «a:[ref=e11]»',
]
D.fFillCmd = 'rsf fill e2=2.4.0 e3=240 e4=@更新说明.md e5=效率办公 e6=https://shiguang.app/privacy e7=2026SR0123456 e9=false'
D.fFillOut = ['«G:ok: true»  «d:fields: e2 e3 e4 e5 e6 e7 e9 · 7 项»']
D.fUpCmd = 'rsf upload e8 截图/01.png 截图/02.png 截图/03.png 截图/04.png 截图/05.png'
D.fUpOut = ['«G:ok: true»  «d:files: 5»']
// 右边的“页面”：标签 / 编号 / 填进去的值
D.fForm = [
  ['版本号', 'e2', '2.4.0'], ['版本代码', 'e3', '240'], ['更新说明', 'e4', '新增：AI 一键整理…'], ['应用分类', 'e5', '效率办公 ▾'],
  ['隐私政策链接', 'e6', 'https://shiguang.app/privacy'], ['软著登记号', 'e7', '2026SR0123456'], ['应用截图', 'e8', '▣ ▣ ▣ ▣ ▣  已上传 5 张'], ['含广告', 'e9', '☐'],
]
D.fAmbCmd = 'rsf click "getByRole(\'button\', { name: \'提交审核\' })" -t t192'
D.fAmbOut = [
  '«r:✗ [AMBIGUOUS] getByRole(\'button\', { name: "提交审核" }) 匹配到 2 个元素»',
  '«y:  → 候选：»',
  '«w:    1. button "提交审核"»  «d:(标题栏)»',
  '«w:    2. button "提交审核"»  «d:(底部操作栏)»',
  '«y:  写得更具体一些（加 { exact: true }、换更精确的 CSS），或者 rsf snapshot / rsf find 拿编号»',
]
D.fClickCmd = 'rsf click e11 -t t192'
D.fClickOut = [
  '«G:ok: true»',
  '«y:changes:»',
  '  url: «c:https://dev.xinghe-store.com/…/review/XH-20261013-0042»',
  '  «a:navigated: soft»',
  '  dialogs:',
  '    - «w:"confirm: 确认提交审核？提交后 1–3 个工作日内完成审核，期间不能修改。 (accepted)"»',
]
D.fNextCmd = 'rsf click e4 -t t193   «d:# 下一步»'
D.fNextOut = [
  '«G:ok: true»',
  '«y:changes:»',
  '  url: «c:https://open.qingcheng.cn/app/release/step2»',
  '  «a:navigated: soft»',
  '  «a:note: 前端路由跳转（没有整页刷新），页面内容多半整体换了，建议重新 snapshot»',
]
D.fStaleCmd = 'rsf fill e1=2026SR0123456 -t t193'
D.fStaleOut = [
  '«r:✗ [STALE_REF] 编号 e1 无效：当前页面还没有 snapshot，或页面已经跳转»',
  '«y:  → 先执行 `rsf snapshot` 获取新编号»',
]
D.errCodes = ['NEED_LOGIN', 'BLOCKED', 'EMPTY', 'NOT_FOUND', 'CHANGED', 'AMBIGUOUS', 'STALE_REF', 'COVERED', 'NO_LIB']
// trace：把整个过程录下来
D.fTrace = [
  ['rsf trace start publish --goal "拾光笔记上架：星河、青橙、蓝鲸三家应用市场"', ['«G:● 录制中» publish «d:· 标签 t192 t193 t194»']],
  ['«d:… snapshot · fill · upload · click …（就是上面那些操作）»', []],
  ['rsf trace stop', ['«d:duration: 41.66 · events: 27 · requests: 18»', '«y:report: ~/.rsf/traces/publish/report.md»']],
]
D.fReport = [
  '«w:## 操作时间线»',
  '4. [8.3s t192] fill «d:#ver #code #notes #cat #privacy #soft»',
  '5. [8.6s t192] upload «d:#shots» → «c:POST /api/upload»',
  '7. [9.2s t192] click «d:#f > div.bar > button:nth-of-type(2)»',
  '   → «c:POST /api/xinghe/apps/com.shiguang.notes/versions»',
  '8. [9.3s t192] 弹窗 confirm: 确认提交审核？',
  '10. [20.0s t193] click «w:"下一步"» → «c:POST /api/qingcheng/release/draft»',
  '16. [33.5s t193] click «w:"提交"» → «c:POST /api/qingcheng/release/submit»',
  '19. [40.6s t194] click «w:"提交更新"» → «c:POST /api/lanjing/update»',
  '«w:## 接口：POST …/versions»',
  '«d:body.»versionName «d:2.4.0 ·» releaseNotes «d:· »category «d:· »copyrightNo «d:…»',
]
D.fScript = [
  '«d:// publish.js —— 照着 trace 的记录写的：三家应用市场一起填»',
  '«m:const» app = readRelease(rsf.args[0])   «d:// app.json、更新说明、资质、截图»',
  '«m:const» xh = «m:await» rsf.tab(«y:\'xinghe\'»)',
  '«m:await» xh.fill({ «y:\'#ver\'»: app.version, «y:\'#notes\'»: app.notes, «y:\'#soft\'»: app.soft, … })',
  '«m:await» xh.upload(«y:\'#shots\'», app.shots)',
  '«m:await» xh.click(«y:\'#f > div.bar > button:nth-of-type(2)\'»)',
  '«d:// 青橙：三步向导，每步点“下一步”；这家的分类叫“效率”，不叫“效率办公”»',
  '«d:// 蓝鲸：字段名又不一样，截图只要 3 张 …»',
]
D.fRunCmd = 'rsf run -f publish.js release/v2.5'
D.fRunOut = [
  '«G:星河:» 审核单号 XH-20261020-0057',
  '«G:青橙:» 工单 QC20261020-1183',
  '«G:蓝鲸:» LJ-UPD-58',
  '«d:(12.4s)»',
]

// 管道（B 站，中文）
D.pipeCmd = 'rsf call bilibili.com search "xxx模型 实测" --limit 2 | rsf call bilibili.com comments - --limit 3 -o table'
D.pipeChips = ['【实测】xxx模型 写代码到底行不行', 'xxx模型 中文写作横评']
D.pipeOut = [
  ['bvid', 'user', 'text', 'like'],
  ['BV1sK4y1x7Qm', '代码搬运工阿明', '跟着视频试了一下，重构确实猛，但默认模式下会偷懒，记得开思考', '1832'],
  ['BV1sK4y1x7Qm', '前端小周', '价格减半这点太香了，公司已经在切了', '967'],
  ['BV1sK4y1x7Qm', '夜猫子Leo', '三分钟那段的跑分对比，用的是不是同一个模式？', '412'],
  ['BV1qW8z1E7Rf', '一只文案狗', '写公众号长文终于不用大改了', '655'],
  ['BV1qW8z1E7Rf', '读书人老陈', '古文翻译还是有点小毛病，不过比上一代强多了', '203'],
].map((r, i) => (i ? '' : '«y:') + padW(r[0], 14) + padW(r[1], 18) + padW(cutW(r[2], 64), 66) + r[3] + (i ? '' : '»'))
D.step1Code = [
  '«d:// step1.js —— 6 个站并行搜，规整成同一种结构 { site, title, url, heat }»',
  '«m:const» q = «y:\'xxx模型\'»',
  '«m:const» sources = {',
  '  «G:x»:        () => rsf.lib(«y:\'x.com\'»).search(q),',
  '  «G:reddit»:   () => rsf.lib(«y:\'reddit.com\'»).search(«y:\'xxx model\'»),',
  '  «G:hn»:       () => rsf.lib(«y:\'news.ycombinator.com\'»).search(«y:\'xxx model\'»),',
  '  «G:zhihu»:    () => rsf.lib(«y:\'zhihu.com\'»).search(q),',
  '  «G:bilibili»: () => rsf.lib(«y:\'bilibili.com\'»).search(q + «y:\' 评测\'»),',
  '  «G:v2ex»:     () => rsf.lib(«y:\'v2ex.com\'»).search(q),',
  '}',
  '«d:// allSettled：一个站失败，不影响其它站»',
  '«m:const» settled = «m:await» Promise.«c:allSettled»(Object.values(sources).map(f => f()))',
  '«d:// 结果写进 research/posts.json，只把一行一条的摘要返回给 AI»',
]
