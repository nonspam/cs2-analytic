$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$cmd=$null
foreach($c in @('py','python','python3')){if(Get-Command $c -ErrorAction SilentlyContinue){$cmd=$c;break}}
if(-not $cmd){Write-Host 'Python 3 не найден. Установите Python и повторите запуск.';Read-Host 'Enter';exit 1}
$port=8000
while($true){$t=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;if(-not $t){break};$port++}
Start-Process $cmd -ArgumentList "-m http.server $port --bind 127.0.0.1" -WindowStyle Minimized
Start-Sleep -Milliseconds 700
Start-Process "http://127.0.0.1:$port/"
Write-Host "CS5 Analytics: http://127.0.0.1:$port/"
