# 截静帧检查画面：.\shot.ps1 12,30.5,60
param([string]$times, [string]$tab = 't234')
$env:NO_COLOR = 1
mkdir "$PSScriptRoot\shots" -Force | Out-Null
rsf cdp Emulation.setDeviceMetricsOverride '{"width":1440,"height":810,"deviceScaleFactor":1,"mobile":false}' -t $tab | Out-Null
foreach ($t in $times.Split(',')) {
  rsf goto "file:///$("$PSScriptRoot".Replace('\','/'))/index.html?t=$t" -t $tab | Out-Null
  rsf wait --fn "document.title==='READY'" -t $tab | Out-Null
  Start-Sleep -Milliseconds 300
  rsf shot --save "$PSScriptRoot\shots\t$t.png" -t $tab | Out-Null
  $err = rsf eval "window.__err || ''" -t $tab
  "t=$t $err"
}
