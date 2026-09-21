$ErrorActionPreference = 'Stop'
$env:OMNIROUTE_SERVER_HOST = '127.0.0.1'
$env:DEBUG = ''
$omniCli = Join-Path $env:APPDATA 'npm/omniroute.cmd'
if (-not (Test-Path -LiteralPath $omniCli)) { throw 'OmniRoute ausente. Instale com npm install -g omniroute.' }
$omniData = Join-Path $env:USERPROFILE '.omniroute'
if (-not (Test-Path -LiteralPath $omniData)) { New-Item -ItemType Directory -Path $omniData | Out-Null }
Set-Location -LiteralPath $omniData
& $omniCli serve --no-open --no-tray --ready-timeout 180000
exit $LASTEXITCODE
