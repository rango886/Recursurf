# 把 index.html + css + js 打成单文件：promo/index-single.html
# 用法: .\build_single.ps1   （改完源文件后重新跑一次即可）
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$escJs = { param($s) $s.Replace('</script', '<\/script') }

$html = Get-Content "$root/index.html" -Raw -Encoding UTF8

# CSS 内联
$css = Get-Content "$root/css/style.css" -Raw -Encoding UTF8
$html = $html.Replace('<link rel="stylesheet" href="css/style.css">',
                      "<style>`n$css`n</style>")

# JS 内联（vo 在前，与原顺序一致）
foreach ($name in 'vo','engine','data','audio','scenes','main') {
  $js = & $escJs (Get-Content "$root/js/$name.js" -Raw -Encoding UTF8)
  $html = $html.Replace("<script src=`"js/$name.js`"></script>",
                        "<script>`n$js`n</script>")
}

if ($html -match 'src="js/|href="css/') { throw '仍有未内联的引用' }

[IO.File]::WriteAllText("$root/index-single.html", $html, [Text.UTF8Encoding]::new($false))
"{0:N1} MB" -f ((Get-Item "$root/index-single.html").Length / 1MB)
